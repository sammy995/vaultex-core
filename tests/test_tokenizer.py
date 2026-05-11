"""
tests/test_tokenizer.py — Sanity checks for the tokenization engine.

Run with:  pytest tests/ -v
"""

import pytest
from gateway.tokenizer import tokenize


def _fresh_session():
    return {"vault": {}, "counters": {}, "hash_to_token": {}}


def _run(text: str, session_id: str = "test-session", session: dict = None):
    if session is None:
        session = _fresh_session()
    tokenized, entities = tokenize(
        text=text,
        session_id=session_id,
        vault=session["vault"],
        counters=session["counters"],
        hash_to_token=session["hash_to_token"],
    )
    return tokenized, entities, session


class TestPIIDetection:
    def test_ssn_dash_format(self):
        text = "SSN: 123-45-6789"
        tokenized, entities, _ = _run(text)
        assert "123-45-6789" not in tokenized
        assert "{{SSN_1}}" in tokenized
        assert any(e.entity_type == "SSN" for e in entities)

    def test_email_address(self):
        text = "Contact jane@example.com for details."
        tokenized, entities, _ = _run(text)
        assert "jane@example.com" not in tokenized
        assert "{{EMAIL_1}}" in tokenized

    def test_phone_number(self):
        text = "Call 415-555-0192 to confirm."
        tokenized, entities, _ = _run(text)
        assert "415-555-0192" not in tokenized
        assert "{{PHONE_1}}" in tokenized

    def test_account_number_prefix(self):
        text = "Account ACC-00198234 is overdue."
        tokenized, entities, _ = _run(text)
        assert "ACC-00198234" not in tokenized
        assert "ACCT" in tokenized

    def test_loan_id(self):
        text = "Loan LOAN-2024-0041 has been approved."
        tokenized, entities, _ = _run(text)
        assert "LOAN-2024-0041" not in tokenized
        assert "{{LOAN_1}}" in tokenized

    def test_analytics_fields_preserved(self):
        """Credit scores, balances, and rates must NOT be tokenized."""
        text = "Credit score: 742. Balance: $42,500. APR: 4.75%. Risk: LOW."
        tokenized, entities, _ = _run(text)
        assert "742" in tokenized
        assert "42,500" in tokenized
        assert "4.75" in tokenized
        assert "LOW" in tokenized
        assert len(entities) == 0

    def test_deterministic_tokens_same_session(self):
        """The same value must produce the same token within a session."""
        session = _fresh_session()
        text1 = "Jane Smith is a high-risk customer."
        text2 = "Review Jane Smith's loan application."
        tokenized1, _, session = _run(text1, session=session)
        tokenized2, _, _ = _run(text2, session=session)
        # Extract the token used for Jane Smith in message 1
        token = [t for t in session["vault"] if session["vault"][t] == "Jane Smith"]
        assert token, "Jane Smith was not tokenized"
        assert token[0] in tokenized1
        assert token[0] in tokenized2

    def test_vault_mapping_is_correct(self):
        """vault must map token → original_value correctly."""
        text = "SSN: 123-45-6789"
        _, _, session = _run(text)
        token_values = list(session["vault"].values())
        assert "123-45-6789" in token_values

    def test_multiple_entities_in_one_prompt(self):
        text = (
            "Analyse risk for Jane Smith "
            "(SSN: 123-45-6789, email: jane@acme.com, phone: 415-555-0192). "
            "Account ACC-00198234 has balance $42,500, credit score 742."
        )
        tokenized, entities, session = _run(text)
        assert "Jane Smith" not in tokenized
        assert "123-45-6789" not in tokenized
        assert "jane@acme.com" not in tokenized
        assert "415-555-0192" not in tokenized
        assert "ACC-00198234" not in tokenized
        # Analytics fields intact
        assert "42,500" in tokenized
        assert "742" in tokenized
        assert len(entities) >= 4


class TestDetokenizer:
    def test_full_roundtrip(self):
        from gateway.detokenizer import detokenize, ROLE_PERMISSIONS

        text = "SSN: 123-45-6789 for Jane Smith."
        _, _, session = _run(text)
        vault = session["vault"]

        # Get the tokenized form
        tokenized_text, _ = tokenize(
            text=text,
            session_id="rt-session",
            vault=vault,
            counters={},
            hash_to_token={},
        )

        # VP role sees everything
        restored = detokenize(tokenized_text, vault, ROLE_PERMISSIONS["vp"])
        assert "123-45-6789" in restored

    def test_rbac_junior_analyst_sees_tokens(self):
        from gateway.detokenizer import detokenize, ROLE_PERMISSIONS

        vault = {"{{SSN_1}}": "123-45-6789"}
        text = "Customer SSN is {{SSN_1}}."
        result = detokenize(text, vault, ROLE_PERMISSIONS["junior_analyst"])
        assert "{{SSN_1}}" in result
        assert "123-45-6789" not in result

    def test_rbac_analyst_sees_person_not_ssn(self):
        from gateway.detokenizer import detokenize, ROLE_PERMISSIONS

        vault = {"{{PERSON_1}}": "Jane Smith", "{{SSN_1}}": "123-45-6789"}
        text = "{{PERSON_1}} has SSN {{SSN_1}}."
        result = detokenize(text, vault, ROLE_PERMISSIONS["analyst"])
        assert "Jane Smith" in result
        assert "{{SSN_1}}" in result        # SSN still hidden
        assert "123-45-6789" not in result

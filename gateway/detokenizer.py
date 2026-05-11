"""
detokenizer.py — Reverse token substitution on LLM responses.

Replaces {{PERSON_1}}, {{SSN_1}}, etc. back to their real values,
but only for entity types that the current role is permitted to see.

Role-based detokenization (RBAC):
  • junior_analyst  — sees tokens only (no PII revealed)
  • analyst         — sees PERSON names only
  • senior_analyst  — sees PERSON, EMAIL, PHONE, LOAN, ACCT
  • vp / admin      — sees everything (full detokenization)

The role restriction means the same gateway response can be served to
multiple users at different clearance levels without re-querying the LLM.
"""

import re
from typing import Dict, Set

# Reverse mapping: short code inside token → canonical entity type
_SHORT_TO_ENTITY: Dict[str, str] = {
    "PERSON":   "PERSON",
    "SSN":      "SSN",
    "ACCT":     "ACCOUNT_NUMBER",
    "ROUTING":  "ROUTING_NUMBER",
    "LOAN":     "LOAN_ID",
    "EMAIL":    "EMAIL_ADDRESS",
    "PHONE":    "PHONE_NUMBER",
    "DATE":     "DATE_TIME",
    "CARD":     "CREDIT_CARD",
}

_TOKEN_RE = re.compile(r"\{\{([A-Z]+)_(\d+)\}\}")

# Pre-defined role permission sets
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "junior_analyst":  set(),
    "analyst":         {"PERSON"},
    "senior_analyst":  {"PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "LOAN_ID", "ACCOUNT_NUMBER"},
    "vp":              set(_SHORT_TO_ENTITY.values()),
    "admin":           set(_SHORT_TO_ENTITY.values()),
}


def detokenize(
    text: str,
    vault: Dict[str, str],
    allowed_entity_types: Set[str],
) -> str:
    """
    Replace tokens in *text* with real values where the role permits it.

    Tokens for entity types not in *allowed_entity_types* are left as-is,
    so a junior analyst sees {{PERSON_1}} while a VP sees the real name.

    Parameters
    ----------
    text : str
        LLM response text that may contain tokens.
    vault : dict
        Mapping of token → real_value for this session.
    allowed_entity_types : set[str]
        Entity types the current role may see (canonical names).
    """
    if not vault or not text:
        return text

    result = text
    replacements = 0
    for token, real_value in vault.items():
        m = _TOKEN_RE.match(token)
        if not m:
            continue
        short = m.group(1)
        entity_type = _SHORT_TO_ENTITY.get(short, short)
        if entity_type in allowed_entity_types:
            result = result.replace(token, real_value)
            replacements += 1

    return result

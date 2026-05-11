"""
tokenizer.py — PII detection and deterministic token substitution.

Uses Microsoft Presidio with spaCy en_core_web_lg for NER plus
hand-crafted regex recognizers for finance-specific identifiers
(SSN, account numbers, loan IDs, routing numbers).

Key design decisions
────────────────────
• DETERMINISTIC  — the same real value always maps to the same token
  within a session.  {{PERSON_1}} always means the same customer.
  This preserves referential integrity across multi-turn conversations.

• ANALYTICS-SAFE — financial amounts, credit scores, interest rates,
  risk flags, geographic dimensions, and other analytics fields are
  intentionally NOT tokenized.  Only direct personal identifiers are
  replaced, so downstream analytics and aggregation still work.

• REVERSIBLE     — every token ↔ real-value mapping is stored in
  memory (demo) or Redis (production) and used by detokenizer.py to
  reconstruct the original text on the return path.
"""

import hashlib
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer
from presidio_analyzer.nlp_engine import NlpEngineProvider

# ── Entity short codes used inside tokens ──────────────────────────────────
# e.g. PERSON → {{PERSON_1}},  SSN → {{SSN_1}},  ACCOUNT_NUMBER → {{ACCT_1}}
#
# NOT tokenized (kept as real values for analytics):
#   currency amounts, credit scores, interest rates, payment amounts,
#   days-past-due, risk flags, loan types, employment status, city, state

ENTITY_SHORT: Dict[str, str] = {
    "PERSON":         "PERSON",
    "SSN":            "SSN",
    "ACCOUNT_NUMBER": "ACCT",
    "ROUTING_NUMBER": "ROUTING",
    "LOAN_ID":        "LOAN",
    "EMAIL_ADDRESS":  "EMAIL",
    "PHONE_NUMBER":   "PHONE",
    "DATE_TIME":      "DATE",
    "CREDIT_CARD":    "CARD",
}

ALL_ENTITIES = list(ENTITY_SHORT.keys())


def _build_analyzer() -> AnalyzerEngine:
    """Build a Presidio AnalyzerEngine with finance-specific custom recognizers."""

    # ── Finance-specific regex recognizers ────────────────────────────────
    ssn_recognizer = PatternRecognizer(
        supported_entity="SSN",
        patterns=[
            Pattern("SSN_DASH",  r"\b\d{3}-\d{2}-\d{4}\b", 0.95),
            Pattern("SSN_SPACE", r"\b\d{3} \d{2} \d{4}\b", 0.85),
        ],
    )

    account_recognizer = PatternRecognizer(
        supported_entity="ACCOUNT_NUMBER",
        patterns=[
            Pattern("ACCOUNT_LABELED",    r"(?i)\b(?:account|acct|acc)[\s#:\-]*\d{6,17}\b", 0.90),
            Pattern("ACCOUNT_ACC_PREFIX", r"\bACC-\d{7,12}\b", 0.92),
        ],
    )

    routing_recognizer = PatternRecognizer(
        supported_entity="ROUTING_NUMBER",
        patterns=[
            Pattern("ROUTING_LABELED", r"(?i)\b(?:routing|aba|rtn)[\s#:]*\d{9}\b", 0.95),
        ],
    )

    loan_recognizer = PatternRecognizer(
        supported_entity="LOAN_ID",
        patterns=[
            Pattern("LOAN_LABELED",     r"(?i)\b(?:loan|loan_id|loan-id)[\s#:\-]*[A-Z0-9][A-Z0-9\-]{4,19}\b", 0.90),
            Pattern("LOAN_YEAR_FORMAT", r"\bLOAN-\d{4}-\d{3,6}\b", 0.92),
        ],
    )

    # ── NLP engine (spaCy en_core_web_lg for PERSON detection) ─────────────
    nlp_provider = NlpEngineProvider(
        nlp_configuration={
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_lg"}],
        }
    )
    nlp_engine = nlp_provider.create_engine()

    analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
    for r in [ssn_recognizer, account_recognizer, routing_recognizer, loan_recognizer]:
        analyzer.registry.add_recognizer(r)

    return analyzer


# Singleton — loading spaCy takes ~3 seconds, do it once at startup
_analyzer: Optional[AnalyzerEngine] = None


def get_analyzer() -> AnalyzerEngine:
    global _analyzer
    if _analyzer is None:
        print("[vaultex] Loading Presidio + spaCy en_core_web_lg …")
        _analyzer = _build_analyzer()
        print("[vaultex] Presidio ready.")
    return _analyzer


# ── Data class ─────────────────────────────────────────────────────────────

@dataclass
class EntityResult:
    entity_type: str
    token: str
    original: str
    start: int
    end: int


# ── Core tokenization ──────────────────────────────────────────────────────

def _stable_hash(session_id: str, entity_type: str, value: str) -> str:
    """Deterministic 16-char hash used as a dedup key within a session."""
    raw = f"{session_id}:{entity_type}:{value}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def tokenize(
    text: str,
    session_id: str,
    vault: Dict[str, str],          # token → real_value  (mutated in-place)
    counters: Dict[str, int],       # entity_short → current counter (mutated)
    hash_to_token: Dict[str, str],  # dedup: hash → token (mutated)
) -> Tuple[str, List[EntityResult]]:
    """
    Detect PII in *text*, replace with deterministic tokens, and update
    *vault* / *counters* / *hash_to_token* in-place.

    Returns
    -------
    tokenized_text : str
        The original text with every PII span replaced by its token.
    entity_results : list[EntityResult]
        Metadata about each detected entity.
    """
    analyzer = get_analyzer()

    results = analyzer.analyze(
        text=text,
        language="en",
        entities=ALL_ENTITIES,
        score_threshold=0.4,
    )

    # ── Dedup overlapping spans (keep highest confidence) ──────────────────
    results_sorted_by_score = sorted(results, key=lambda r: r.score, reverse=True)
    covered: set = set()
    deduped = []
    for r in results_sorted_by_score:
        span = set(range(r.start, r.end))
        if not span & covered:
            deduped.append(r)
            covered |= span
    # Process right-to-left so replacements don't shift offsets
    deduped.sort(key=lambda r: r.start, reverse=True)

    tokenized = text
    entity_results: List[EntityResult] = []

    for r in deduped:
        original_value = text[r.start:r.end]
        entity_type = r.entity_type
        short = ENTITY_SHORT.get(entity_type, entity_type)

        val_hash = _stable_hash(session_id, entity_type, original_value)

        # Reuse existing token for the same value (deterministic)
        if val_hash in hash_to_token:
            token = hash_to_token[val_hash]
        else:
            counters[short] = counters.get(short, 0) + 1
            token = f"{{{{{short}_{counters[short]}}}}}"
            hash_to_token[val_hash] = token
            vault[token] = original_value

        entity_results.append(EntityResult(entity_type, token, original_value, r.start, r.end))
        tokenized = tokenized[: r.start] + token + tokenized[r.end:]

    return tokenized, entity_results

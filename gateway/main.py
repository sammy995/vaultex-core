"""
main.py — Vaultex Core: PII-safe LLM proxy gateway.

This is the reference open-source implementation.
For enterprise features (cloud LLM routing, SOC 2, GLBA compliance packs,
SSO, extended retention, SLA) see https://vaultex.ai

Architecture
────────────
  Client → POST /v1/chat  → tokenize PII  → LLM provider (OpenAI / Anthropic / Ollama)
                          ← detokenize    ← LLM response

The vault (token ↔ real-value map) is in-memory and scoped to each
session_id.  In production (Vaultex hosted), the vault is Fernet-encrypted
in Redis with configurable retention.

Quick start
───────────
  pip install -r requirements.txt
  python -m spacy download en_core_web_lg
  uvicorn gateway.main:app --reload

  # or: docker compose up
"""

import uuid
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gateway.detokenizer import ROLE_PERMISSIONS, detokenize
from gateway.tokenizer import tokenize

# ── Optional LLM clients (installed only when needed) ─────────────────────
try:
    import httpx
    _HTTPX_AVAILABLE = True
except ImportError:
    _HTTPX_AVAILABLE = False

app = FastAPI(
    title="Vaultex Core",
    description="PII-safe LLM proxy — tokenize before send, detokenize on return.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory session store ────────────────────────────────────────────────
# Structure:
#   sessions[session_id] = {
#       "vault":         {token: real_value},
#       "counters":      {short_code: int},
#       "hash_to_token": {val_hash: token},
#   }
#
# In production: swap this for the Redis-backed SessionStore.

_sessions: Dict[str, dict] = {}


def _get_or_create_session(session_id: str) -> dict:
    if session_id not in _sessions:
        _sessions[session_id] = {
            "vault": {},
            "counters": {},
            "hash_to_token": {},
        }
    return _sessions[session_id]


# ── Request / response models ──────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    provider: str = "openai"        # "openai" | "anthropic" | "ollama"
    model: str = "gpt-4o"
    api_key: Optional[str] = None
    ollama_url: str = "http://localhost:11434"
    session_id: Optional[str] = None
    role: str = "analyst"           # RBAC role for detokenization


class TokenizeRequest(BaseModel):
    text: str
    session_id: Optional[str] = None


class TokenizeResponse(BaseModel):
    session_id: str
    original: str
    tokenized: str
    entities: List[dict]
    vault: Dict[str, str]


class ChatResponse(BaseModel):
    session_id: str
    tokenized_prompt: str
    raw_llm_response: str
    detokenized_response: str
    entities_detected: List[dict]
    vault: Dict[str, str]


# ── Endpoints ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "vaultex-core"}


@app.post("/v1/tokenize", response_model=TokenizeResponse)
async def tokenize_endpoint(req: TokenizeRequest):
    """
    Tokenize PII in a text string.

    Useful for testing the detection engine before wiring up an LLM.
    Returns the tokenized text, detected entities, and vault mapping.
    """
    session_id = req.session_id or str(uuid.uuid4())
    session = _get_or_create_session(session_id)

    tokenized_text, entities = tokenize(
        text=req.text,
        session_id=session_id,
        vault=session["vault"],
        counters=session["counters"],
        hash_to_token=session["hash_to_token"],
    )

    return TokenizeResponse(
        session_id=session_id,
        original=req.text,
        tokenized=tokenized_text,
        entities=[{"entity_type": e.entity_type, "token": e.token, "original": e.original} for e in entities],
        vault=dict(session["vault"]),
    )


@app.post("/v1/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    PII-safe LLM chat proxy.

    Flow:
      1. Tokenize PII in each user message (vault stored in session)
      2. Forward tokenized messages to the requested LLM provider
      3. Detokenize the response according to the caller's RBAC role
      4. Return both raw (tokenized) and detokenized responses

    The LLM never sees raw PII.  Your API key is used only for the
    forwarded request and is never stored.
    """
    if not _HTTPX_AVAILABLE:
        raise HTTPException(503, "httpx not installed — run: pip install httpx")

    session_id = req.session_id or str(uuid.uuid4())
    session = _get_or_create_session(session_id)

    # ── Step 1: tokenize all user messages ────────────────────────────────
    all_entities = []
    processed_messages = []
    for msg in req.messages:
        if msg.role == "user":
            tokenized_content, entities = tokenize(
                text=msg.content,
                session_id=session_id,
                vault=session["vault"],
                counters=session["counters"],
                hash_to_token=session["hash_to_token"],
            )
            all_entities.extend(entities)
            processed_messages.append({"role": msg.role, "content": tokenized_content})
        else:
            processed_messages.append({"role": msg.role, "content": msg.content})

    tokenized_prompt = processed_messages[-1]["content"] if processed_messages else ""

    # ── Step 2: call LLM provider ─────────────────────────────────────────
    raw_response = await _call_llm(req, processed_messages)

    # ── Step 3: detokenize response based on caller's RBAC role ──────────
    allowed_types = ROLE_PERMISSIONS.get(req.role, set())
    detokenized = detokenize(raw_response, session["vault"], allowed_types)

    return ChatResponse(
        session_id=session_id,
        tokenized_prompt=tokenized_prompt,
        raw_llm_response=raw_response,
        detokenized_response=detokenized,
        entities_detected=[
            {"entity_type": e.entity_type, "token": e.token, "original": e.original}
            for e in all_entities
        ],
        vault=dict(session["vault"]),
    )


# ── LLM provider dispatch ──────────────────────────────────────────────────

async def _call_llm(req: ChatRequest, messages: List[dict]) -> str:
    if req.provider == "openai":
        return await _call_openai(req.model, messages, req.api_key or "")
    elif req.provider == "anthropic":
        return await _call_anthropic(req.model, messages, req.api_key or "")
    elif req.provider == "ollama":
        return await _call_ollama(req.model, messages, req.ollama_url)
    else:
        raise HTTPException(400, f"Unknown provider: {req.provider!r}. Use 'openai', 'anthropic', or 'ollama'.")


async def _call_openai(model: str, messages: List[dict], api_key: str) -> str:
    if not api_key:
        raise HTTPException(400, "api_key is required for OpenAI")
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "max_tokens": 2048},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _call_anthropic(model: str, messages: List[dict], api_key: str) -> str:
    if not api_key:
        raise HTTPException(400, "api_key is required for Anthropic")
    system_msg = None
    chat_msgs = []
    for m in messages:
        if m["role"] == "system":
            system_msg = m["content"]
        else:
            chat_msgs.append(m)

    payload: dict = {"model": model, "messages": chat_msgs, "max_tokens": 2048}
    if system_msg:
        payload["system"] = system_msg

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]


async def _call_ollama(model: str, messages: List[dict], base_url: str) -> str:
    url = base_url.rstrip("/") + "/api/chat"
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(url, json={"model": model, "messages": messages, "stream": False})
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]

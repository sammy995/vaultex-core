import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

import jwt as pyjwt
import structlog
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from gateway.audit import AuditLogger, EventType
from gateway.auth import issue_token, validate_token
from gateway.config import settings
from gateway.database import get_db, init_db
from gateway.detokenizer import run_detokenize
from gateway.llm_router import list_ollama_models, route_to_llm
from gateway.models import (
    ChatCompletionRequest,
    LoginRequest,
    RegisterRequest,
    SessionConfigRequest,
    SessionConfigResponse,
    TokenRequest,
    TokenResponse,
    UserResponse,
)
from gateway.rbac import get_role_permissions
from gateway.redis_store import SessionStore
from gateway.tokenizer import run_tokenize
from gateway.users import authenticate_user, create_user, get_user_by_email, get_user_by_username

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
)
log = structlog.get_logger()

store: SessionStore | None = None
audit_log: AuditLogger | None = None
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global store, audit_log
    init_db()  # create users table if not exists
    store = SessionStore(settings.redis_url)
    audit_log = AuditLogger(store.redis)
    log.info("gateway_startup", redis_url=settings.redis_url)
    yield
    await store.close()


app = FastAPI(title="PII Tokenization Gateway", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Chrome Private Network Access: HTTPS pages fetching http://localhost require
# the server to respond to OPTIONS preflights with this header.
@app.middleware("http")
async def private_network_access(request: Request, call_next):
    if (
        request.method == "OPTIONS"
        and "access-control-request-private-network" in request.headers
    ):
        origin = request.headers.get("origin", "*")
        return Response(
            status_code=204,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-ID",
                "Access-Control-Allow-Private-Network": "true",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "86400",
                "Vary": "Origin",
            },
        )
    response = await call_next(request)
    return response


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _correlation_id(request: Request) -> str:
    """Return X-Request-ID from the caller or generate a fresh UUID."""
    return request.headers.get("X-Request-ID") or str(uuid.uuid4())


async def _require_admin(
    authorization: Optional[str] = Header(None),
) -> dict:
    """FastAPI dependency that enforces admin-role JWT."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required")
    try:
        payload = validate_token(authorization[7:])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except Exception:
        raise HTTPException(401, "Invalid token")
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin role required")
    return payload


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    try:
        await store.redis.ping()
        redis_status = "ok"
    except Exception:
        redis_status = "unreachable"
    return {
        "status": "ok" if redis_status == "ok" else "degraded",
        "redis": redis_status,
        "timestamp": time.time(),
        "version": "1.1.0",
    }


@app.post("/api/session/configure", response_model=SessionConfigResponse)
async def configure_session(body: SessionConfigRequest, request: Request):
    correlation_id = _correlation_id(request)
    session_id = str(uuid.uuid4())
    await store.set_provider_config(
        session_id,
        {
            "provider": body.provider,
            "model": body.model,
            "api_key": body.api_key or "",
            "ollama_url": body.ollama_url or "http://localhost:11434",
        },
    )
    await audit_log.log_event(
        EventType.SESSION_CREATE,
        correlation_id=correlation_id,
        session_id=session_id,
        details={"provider": body.provider, "model": body.model},
    )
    log.info("session_created", session_id=session_id, provider=body.provider)
    return SessionConfigResponse(
        session_id=session_id, provider=body.provider, model=body.model
    )


@app.get("/api/session/models")
async def get_models(provider: str, ollama_url: Optional[str] = "http://localhost:11434"):
    if provider != "ollama":
        raise HTTPException(400, "Model listing is only supported for the ollama provider.")
    try:
        models = await list_ollama_models(ollama_url)
        return {"models": models}
    except Exception as exc:
        raise HTTPException(503, f"Cannot reach Ollama at {ollama_url}: {exc}")


@app.post("/api/auth/token", response_model=TokenResponse)
async def get_auth_token(body: TokenRequest, request: Request):
    """Issue a server-signed JWT for the requested role.

    In the enterprise version this endpoint would sit behind SSO / OIDC.
    For the current stage it accepts any valid role name directly, which
    is suitable for internal tools and design-partner pilots.
    """
    correlation_id = _correlation_id(request)
    try:
        token = issue_token(body.role, body.subject)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    await audit_log.log_event(
        EventType.AUTH_TOKEN_ISSUED,
        correlation_id=correlation_id,
        role=body.role,
        details={"subject": body.subject},
    )
    log.info("token_issued", role=body.role, correlation_id=correlation_id)
    return TokenResponse(
        token=token,
        role=body.role,
        expires_in=int(settings.jwt_ttl_hours * 3600),
    )


@app.post("/api/users/register", response_model=UserResponse, status_code=201)
async def register(
    body: RegisterRequest,
    request: Request,
    db=Depends(get_db),
):
    """Create a new user account and return a ready-to-use JWT."""
    correlation_id = _correlation_id(request)
    if get_user_by_email(db, body.email):
        raise HTTPException(409, "Email already registered")
    if get_user_by_username(db, body.username):
        raise HTTPException(409, "Username already taken")
    try:
        user = create_user(db, body.username, body.email, body.password, body.role)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    token = issue_token(user.role, user.email)
    await audit_log.log_event(
        EventType.AUTH_TOKEN_ISSUED,
        correlation_id=correlation_id,
        role=user.role,
        details={"action": "register", "username": user.username},
    )
    log.info("user_registered", username=user.username, role=user.role)
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        token=token,
        expires_in=int(settings.jwt_ttl_hours * 3600),
    )


@app.post("/api/users/login", response_model=UserResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db=Depends(get_db),
):
    """Authenticate an existing user and return a signed JWT."""
    correlation_id = _correlation_id(request)
    user = authenticate_user(db, body.email, body.password)
    if not user:
        await audit_log.log_event(
            EventType.AUTH_FAILURE,
            correlation_id=correlation_id,
            details={"reason": "bad_credentials", "email": body.email[:4] + "***"},
        )
        raise HTTPException(401, "Invalid email or password")
    token = issue_token(user.role, user.email)
    await audit_log.log_event(
        EventType.AUTH_TOKEN_ISSUED,
        correlation_id=correlation_id,
        role=user.role,
        details={"action": "login", "username": user.username},
    )
    log.info("user_login", username=user.username, role=user.role)
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        token=token,
        expires_in=int(settings.jwt_ttl_hours * 3600),
    )


@app.get("/api/audit/logs")
async def get_audit_logs(
    request: Request,
    date: Optional[str] = None,
    limit: int = 200,
    admin: dict = Depends(_require_admin),
):
    """Return the audit log for the given UTC date (admin role required)."""
    correlation_id = _correlation_id(request)
    await audit_log.log_event(
        EventType.ADMIN_ACCESS,
        correlation_id=correlation_id,
        role=admin.get("role"),
        details={"action": "get_audit_logs", "date": date, "limit": limit},
    )
    logs = await audit_log.get_logs(date=date, limit=min(limit, 500))
    return {"logs": logs, "count": len(logs), "date": date or "today"}


@app.post("/v1/chat/completions")
@limiter.limit("20/minute")
async def chat_completions(
    request: Request,
    body: ChatCompletionRequest,
    x_session_id: str = Header(..., alias="X-Session-ID"),
    authorization: Optional[str] = Header(None),
):
    correlation_id = _correlation_id(request)

    # 1. Strict JWT validation — fail 401, no silent fallback to a default role
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required. Call POST /api/auth/token first.")
    try:
        payload = validate_token(authorization[7:])
        role = payload["role"]
    except pyjwt.ExpiredSignatureError:
        await audit_log.log_event(
            EventType.AUTH_FAILURE, correlation_id, x_session_id, details={"reason": "expired"}
        )
        raise HTTPException(401, "Token expired — request a new token from POST /api/auth/token")
    except Exception as exc:
        await audit_log.log_event(
            EventType.AUTH_FAILURE, correlation_id, x_session_id, details={"reason": str(exc)}
        )
        raise HTTPException(401, "Invalid token")

    allowed_entities = get_role_permissions(role)

    # 2. Load provider config
    config = await store.get_provider_config(x_session_id)
    if not config:
        raise HTTPException(
            404, "Session not found or expired. Please reconfigure the gateway."
        )

    # 3. Tokenize all messages — FAIL SAFE: any error blocks the request
    tokenized_messages = []
    all_entities = []
    try:
        for msg in body.messages:
            tok_text, entities, new_tokens = await run_tokenize(
                msg.content, x_session_id, store
            )
            await store.update_token_map(x_session_id, new_tokens)
            tokenized_messages.append({"role": msg.role, "content": tok_text})
            all_entities.extend([e.to_dict() for e in entities])
    except Exception as exc:
        log.error("tokenization_failed", error=str(exc), session_id=x_session_id)
        raise HTTPException(
            422,
            f"PII tokenization failed — request blocked for safety. Detail: {exc}",
        )

    if all_entities:
        await audit_log.log_event(
            EventType.PII_DETECTED,
            correlation_id,
            session_id=x_session_id,
            role=role,
            details={
                "entity_count": len(all_entities),
                "entity_types": list({e["entity_type"] for e in all_entities}),
            },
        )

    # 4. Call the LLM with the sanitized prompt
    try:
        llm_response = await route_to_llm(
            provider=config["provider"],
            model=config["model"],
            messages=tokenized_messages,
            api_key=config.get("api_key"),
            ollama_url=config.get("ollama_url", "http://localhost:11434"),
        )
    except Exception as exc:
        log.error(
            "llm_call_failed",
            error=str(exc),
            session_id=x_session_id,
            provider=config["provider"],
        )
        raise HTTPException(502, f"LLM provider error: {exc}")

    # 5. De-tokenize response according to caller's role
    token_map = await store.get_token_map(x_session_id)
    detokenized = run_detokenize(llm_response, token_map, allowed_entities)

    await audit_log.log_event(
        EventType.CHAT_REQUEST,
        correlation_id,
        session_id=x_session_id,
        role=role,
        details={
            "provider": config["provider"],
            "model": config["model"],
            "entities_masked": len(all_entities),
            "entities_allowed": list(allowed_entities),
        },
    )

    log.info(
        "request_completed",
        session_id=x_session_id,
        role=role,
        entities_masked=len(all_entities),
        correlation_id=correlation_id,
    )

    return JSONResponse(
        {
            "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
            "object": "chat.completion",
            "model": config["model"],
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": detokenized},
                    "finish_reason": "stop",
                }
            ],
            # Extra field consumed by the UI — ignored by standard OpenAI clients
            "_meta": {
                "tokenized_messages": tokenized_messages,
                "entities_found": all_entities,
                "role": role,
                "entities_allowed": list(allowed_entities),
            },
        }
    )

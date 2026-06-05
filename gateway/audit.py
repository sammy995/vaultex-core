"""Append-only audit trail backed by Redis.

Storage layout
--------------
Each UTC calendar day gets its own Redis list key:

    audit:{tenant_id}:{YYYY-MM-DD}   → list of JSON-encoded AuditEntry dicts

Lists are retained for ``ttl_days`` days (default 30).  Nothing is ever
deleted within the retention window, making the log effectively tamper-evident
for the duration of retention (Redis persistence permitting).

Event types
-----------
Use the ``EventType`` constants so log consumers can filter reliably without
free-text matching.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Optional

import structlog

log = structlog.get_logger()


class EventType:
    """Canonical audit event type strings."""

    SESSION_CREATE = "session_create"
    AUTH_TOKEN_ISSUED = "auth_token_issued"
    AUTH_FAILURE = "auth_failure"
    CHAT_REQUEST = "chat_request"
    PII_DETECTED = "pii_detected"
    PII_DETOKENIZED = "pii_detokenized"
    LLM_CALL = "llm_call"
    ADMIN_ACCESS = "admin_access"
    RATE_LIMIT = "rate_limit"


class AuditLogger:
    """Append-only, Redis-backed audit log.

    Args:
        redis_client: A connected ``redis.asyncio`` client.
        tenant_id:    Logical tenant namespace (default ``"default"``).
        ttl_days:     Retention window for each day's log list.
    """

    def __init__(self, redis_client, tenant_id: str = "default", ttl_days: int = 30):
        self.redis = redis_client
        self.tenant_id = tenant_id
        self.ttl = ttl_days * 24 * 3600

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _day_key(
        self, date_str: Optional[str] = None, tenant_id: Optional[str] = None
    ) -> str:
        tenant = tenant_id or self.tenant_id
        if not date_str:
            date_str = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")
        return f"audit:{tenant}:{date_str}"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def log_event(
        self,
        event_type: str,
        correlation_id: str,
        session_id: Optional[str] = None,
        role: Optional[str] = None,
        details: Optional[dict] = None,
        tenant_id: Optional[str] = None,
    ) -> None:
        """Append a single structured entry to today's audit log.

        ``tenant_id`` (Gap 3) namespaces the log per tenant; when omitted it
        falls back to the logger's default tenant for back-compat.
        The entry is JSON-serialised and appended atomically via Redis RPUSH.
        """
        entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "event_type": event_type,
            "tenant_id": tenant_id or self.tenant_id,
            "correlation_id": correlation_id,
            "session_id": session_id,
            "role": role,
            "details": details or {},
        }
        key = self._day_key(tenant_id=tenant_id)
        await self.redis.rpush(key, json.dumps(entry))
        await self.redis.expire(key, self.ttl)
        log.debug("audit_event", event_type=event_type, correlation_id=correlation_id)

    async def get_logs(
        self,
        date: Optional[str] = None,
        limit: int = 500,
        tenant_id: Optional[str] = None,
    ) -> list[dict]:
        """Return the most-recent ``limit`` entries for the given UTC date.

        Args:
            date:      ISO 8601 date string (``YYYY-MM-DD``).  Defaults to today.
            limit:     Maximum number of entries to return (capped at 500).
            tenant_id: Tenant to read (Gap 3); defaults to the logger's tenant.

        Returns:
            List of audit entry dicts, oldest-first within the page.
        """
        key = self._day_key(date, tenant_id=tenant_id)
        entries = await self.redis.lrange(key, -min(limit, 500), -1)
        return [json.loads(e) for e in entries]

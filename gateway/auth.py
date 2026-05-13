"""Enterprise-grade server-side JWT issuance and strict validation.

Replaces the MVP pattern of browser-minted JWTs with a shared secret.
All tokens are now issued by the gateway so JWT_SECRET never needs to
be exposed to the browser (NEXT_PUBLIC_JWT_SECRET is no longer needed).

Token lifecycle
---------------
* POST /api/auth/token  → issue_token()   → signed HS256 JWT
* Every protected route → validate_token() → strict validation (iss, aud, jti)
"""

import time
import uuid

import jwt as pyjwt

from gateway.config import settings
from gateway.rbac import ROLE_PERMISSIONS

_ALLOWED_ROLES: frozenset[str] = frozenset(ROLE_PERMISSIONS.keys())


def issue_token(role: str, subject: str = "gateway-user") -> str:
    """Issue a signed HS256 JWT with proper enterprise claims.

    Args:
        role:    Must be a key in ROLE_PERMISSIONS.
        subject: Opaque user identifier (email, SSO sub, etc.).

    Returns:
        Compact JWT string.

    Raises:
        ValueError: If role is not a recognised role.
    """
    if role not in _ALLOWED_ROLES:
        raise ValueError(f"Unknown role: {role!r}. Allowed: {sorted(_ALLOWED_ROLES)}")
    now = int(time.time())
    payload = {
        "sub": subject,
        "role": role,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "jti": str(uuid.uuid4()),   # unique token ID — enables future revocation
        "iat": now,
        "exp": now + int(settings.jwt_ttl_hours * 3600),
    }
    return pyjwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def validate_token(token: str) -> dict:
    """Strict gateway-token validation.

    Enforces issuer, audience, expiry, and every required claim.
    Raises a pyjwt exception on any failure — callers must catch and 401.
    No silent fallback to a default role.
    """
    return pyjwt.decode(
        token,
        settings.jwt_secret,
        algorithms=["HS256"],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
        options={
            "require": ["exp", "iat", "iss", "aud", "jti", "sub", "role"],
        },
    )

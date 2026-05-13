import json
import hashlib
import base64
from typing import Dict, Optional

import redis.asyncio as aioredis
from cryptography.fernet import Fernet

from gateway.config import settings


def _get_fernet() -> Fernet:
    """Derive a stable Fernet key from JWT_SECRET via SHA-256."""
    key_bytes = hashlib.sha256(settings.jwt_secret.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


class SessionStore:
    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url, decode_responses=True)
        self.fernet = _get_fernet()
        self.TTL = 3600  # 1 hour

    # --- Provider config ---

    async def set_provider_config(self, session_id: str, config: dict) -> None:
        if config.get("api_key"):
            config["api_key"] = self.fernet.encrypt(
                config["api_key"].encode()
            ).decode()
        key = f"session:{session_id}:provider"
        await self.redis.setex(key, self.TTL, json.dumps(config))

    async def get_provider_config(self, session_id: str) -> Optional[dict]:
        key = f"session:{session_id}:provider"
        data = await self.redis.get(key)
        if not data:
            return None
        config = json.loads(data)
        if config.get("api_key"):
            config["api_key"] = self.fernet.decrypt(
                config["api_key"].encode()
            ).decode()
        return config

    # --- Token map ---

    async def set_token_map(self, session_id: str, token_map: Dict[str, str]) -> None:
        key = f"session:{session_id}:tokens"
        await self.redis.setex(key, self.TTL, json.dumps(token_map))

    async def get_token_map(self, session_id: str) -> Dict[str, str]:
        key = f"session:{session_id}:tokens"
        data = await self.redis.get(key)
        return json.loads(data) if data else {}

    async def update_token_map(self, session_id: str, new_tokens: Dict[str, str]) -> None:
        existing = await self.get_token_map(session_id)
        existing.update(new_tokens)
        await self.set_token_map(session_id, existing)

    # --- Per-entity counters (for deterministic token numbering) ---

    async def get_or_create_token_for_hash(
        self, session_id: str, val_hash: str, entity_type: str, short: str
    ) -> str:
        """
        If val_hash already has a token in this session, return it.
        Otherwise, increment the entity counter and create a new token.
        """
        hash_key = f"session:{session_id}:hash:{val_hash}"
        existing = await self.redis.get(hash_key)
        if existing:
            return existing

        counter_key = f"session:{session_id}:counter:{entity_type}"
        count = await self.redis.incr(counter_key)
        await self.redis.expire(counter_key, self.TTL)

        token = f"{{{{{short}_{count}}}}}"
        await self.redis.setex(hash_key, self.TTL, token)
        return token

    async def close(self) -> None:
        await self.redis.aclose()

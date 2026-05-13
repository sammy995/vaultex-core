from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    jwt_secret: str = "change-me-in-production-secret-key"
    # Comma-separated list of allowed CORS origins.
    # Add your Vercel URL here or set ALLOWED_ORIGINS env var.
    allowed_origins: str = (
        "http://localhost:3000,"
        "http://localhost:3001,"
        "https://vaultex-iota.vercel.app,"
        "https://vaultex.space,"
        "https://vaultex.app"
    )

    # Enterprise JWT claims — validated on every request
    jwt_issuer: str = "pii-gateway"
    jwt_audience: str = "pii-gateway-clients"
    jwt_ttl_hours: float = 4.0

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

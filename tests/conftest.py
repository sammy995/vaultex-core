"""pytest configuration — adds project root to sys.path and sets test env vars."""

import os
import sys

# Ensure the project root is on the path so `import gateway` works
project_root = os.path.dirname(os.path.dirname(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Provide minimal env vars required by gateway/config.py
os.environ.setdefault("JWT_SECRET", "test-secret-for-unit-tests")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")

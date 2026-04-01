import os
from pathlib import Path

# Zmienne środowiskowe z prefiksem AGENT_KS_ (np. AGENT_KS_UPLOAD_DIR)
_PREFIX = "AGENT_KS_"


def _env_path(key: str, default: str) -> Path:
    return Path(os.environ.get(f"{_PREFIX}{key}", default))


def _env_int(key: str, default: int) -> int:
    raw = os.environ.get(f"{_PREFIX}{key}")
    if raw is None:
        return default
    return int(raw)


UPLOAD_DIR: Path = _env_path("UPLOAD_DIR", "data/uploads")
MAX_UPLOAD_BYTES: int = _env_int("MAX_UPLOAD_BYTES", 25 * 1024 * 1024)
ALLOWED_EXTENSIONS: frozenset[str] = frozenset({".pdf", ".jpg", ".jpeg", ".png"})

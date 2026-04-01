import re
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app import config

router = APIRouter(prefix="/invoices", tags=["invoices"])

_ALLOWED_MIME = frozenset(
    {
        "application/pdf",
        "application/octet-stream",
        "image/jpeg",
        "image/png",
        "image/jpg",
    }
)


def _safe_stem(name: str, max_len: int = 120) -> str:
    base = Path(name).name
    base = re.sub(r"[^\w.\-]", "_", base, flags=re.UNICODE)
    if not base or base.startswith("."):
        base = "document"
    return base[:max_len]


def _extension(filename: str | None) -> str:
    if not filename:
        return ""
    return Path(filename).suffix.lower()


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
    summary="Prześlij fakturę (JPG, PNG, PDF)",
)
async def upload_invoice(file: UploadFile = File(...)) -> dict:
    ext = _extension(file.filename)
    if ext not in config.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Dozwolone rozszerzenia: {', '.join(sorted(config.ALLOWED_EXTENSIONS))}. "
                f"Otrzymano: {ext or '(brak)'}"
            ),
        )

    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type and content_type not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nieobsługiwany typ MIME: {content_type}",
        )

    doc_id = str(uuid.uuid4())
    stem = _safe_stem(file.filename or "document")
    stored_name = f"{doc_id}_{stem}"
    dest = config.UPLOAD_DIR / stored_name

    config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    size = 0
    try:
        with dest.open("wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > config.MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Plik przekracza limit {config.MAX_UPLOAD_BYTES} bajtów.",
                    )
                out.write(chunk)
    except HTTPException:
        if dest.exists():
            dest.unlink(missing_ok=True)
        raise
    except OSError as e:
        if dest.exists():
            dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Nie udało się zapisać pliku: {e}",
        ) from e

    return {
        "id": doc_id,
        "original_filename": file.filename,
        "stored_path": str(dest),
        "stored_filename": stored_name,
        "content_type": file.content_type,
        "size_bytes": size,
    }

import re
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app import config
from app import db
from app.services.analyzer import analyze_invoice_text
from app.services.bielik import analyze_with_bielik, merge_invoice_analysis
from app.services.ocr import extract_text, tesseract_available

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

    db.create_invoice(
        invoice_id=doc_id,
        original_filename=file.filename,
        stored_path=dest,
        content_type=file.content_type,
        size_bytes=size,
    )

    return {
        "id": doc_id,
        "status": "uploaded",
        "original_filename": file.filename,
        "stored_path": str(dest),
        "stored_filename": stored_name,
        "content_type": file.content_type,
        "size_bytes": size,
    }


@router.post(
    "/upload-and-process",
    status_code=status.HTTP_201_CREATED,
    summary="Prześlij i od razu przetwórz dokument",
)
async def upload_and_process_invoice(file: UploadFile = File(...)) -> dict:
    uploaded = await upload_invoice(file)
    processed = await process_invoice(uploaded["id"])
    processed["upload_status_code"] = 201
    return processed


@router.post(
    "/{invoice_id}/process",
    summary="Przetwórz dokument (OCR + analiza pól)",
)
async def process_invoice(invoice_id: str) -> dict:
    invoice = db.get_invoice(invoice_id)
    if invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono dokumentu.")

    file_path = Path(invoice["stored_path"])
    if not file_path.exists():
        db.mark_failed(invoice_id, "Brak pliku źródłowego na dysku.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Plik źródłowy nie istnieje.",
        )

    db.mark_processing(invoice_id)
    try:
        ocr_result = extract_text(file_path)
        text = ocr_result["text"]
        heuristic_analysis = analyze_invoice_text(text)
        bielik_analysis = analyze_with_bielik(text, heuristic_analysis)
        analysis = merge_invoice_analysis(heuristic_analysis, bielik_analysis)
        analysis["ocr_engine"] = ocr_result["engine"]
        analysis["ocr_warning"] = ocr_result["warning"]
        analysis["ocr_text_length"] = len(text)
        db.mark_processed(invoice_id, ocr_text=text, analysis=analysis)
    except Exception as exc:  # noqa: BLE001
        db.mark_failed(invoice_id, str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd przetwarzania dokumentu: {exc}",
        ) from exc

    response = db.get_invoice(invoice_id) or {"id": invoice_id, "status": "processed"}
    preview = (text[:220] + "...") if len(text) > 220 else text
    response["processing_summary"] = {
        "engine": analysis.get("ocr_engine"),
        "text_length": len(text),
        "preview": preview,
        "warning": analysis.get("ocr_warning"),
    }
    return response


@router.get("/{invoice_id}", summary="Pobierz szczegóły dokumentu")
async def get_invoice(invoice_id: str) -> dict:
    invoice = db.get_invoice(invoice_id)
    if invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono dokumentu.")
    return invoice


@router.get("", summary="Lista dokumentów")
async def list_invoices(limit: int = 50) -> list[dict]:
    safe_limit = min(max(limit, 1), 200)
    return db.list_invoices(limit=safe_limit)


@router.get("/status/ocr", summary="Status OCR")
async def ocr_status() -> dict:
    return {
        "tesseract_available": tesseract_available(),
        "supported_file_types": sorted(config.ALLOWED_EXTENSIONS),
    }

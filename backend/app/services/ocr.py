from pathlib import Path

from pypdf import PdfReader


def extract_text(file_path: Path) -> str:
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        try:
            reader = PdfReader(str(file_path))
            chunks: list[str] = []
            for page in reader.pages:
                chunks.append(page.extract_text() or "")
            return "\n".join(chunks).strip()
        except Exception:  # noqa: BLE001
            # Część skanów/PDF-ów nie ma warstwy tekstowej albo jest uszkodzona.
            # Nie przerywamy pipeline'u - zwracamy pusty tekst.
            return ""

    # Placeholder do czasu integracji z Tesseract/EasyOCR.
    return ""

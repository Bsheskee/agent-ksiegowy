from pathlib import Path
from shutil import which

import pytesseract
from PIL import Image
from pypdf import PdfReader


def tesseract_available() -> bool:
    return which("tesseract") is not None


def extract_text(file_path: Path) -> dict:
    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        try:
            reader = PdfReader(str(file_path))
            chunks: list[str] = []
            for page in reader.pages:
                chunks.append(page.extract_text() or "")
            text = "\n".join(chunks).strip()
            return {
                "text": text,
                "engine": "pypdf_text_layer",
                "warning": None if text else "PDF nie zawiera warstwy tekstowej lub tekst jest pusty.",
            }
        except Exception:  # noqa: BLE001
            return {
                "text": "",
                "engine": "pypdf_text_layer",
                "warning": "Nie udało się odczytać tekstu z PDF.",
            }

    if suffix in {".jpg", ".jpeg", ".png"}:
        if not tesseract_available():
            return {
                "text": "",
                "engine": "tesseract",
                "warning": "Silnik tesseract nie jest zainstalowany w systemie.",
            }
        try:
            with Image.open(file_path) as image:
                text = pytesseract.image_to_string(image, lang="pol+eng").strip()
            return {
                "text": text,
                "engine": "tesseract",
                "warning": None if text else "OCR nie zwrócił tekstu dla obrazu.",
            }
        except Exception:  # noqa: BLE001
            return {
                "text": "",
                "engine": "tesseract",
                "warning": "Błąd podczas OCR obrazu w Tesseract.",
            }

    return {
        "text": "",
        "engine": "unknown",
        "warning": f"Nieobsługiwany format pliku: {suffix or '(brak rozszerzenia)'}",
    }

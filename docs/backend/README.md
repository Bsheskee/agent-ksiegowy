# Backend

Katalog backendu będzie zawierał logikę aplikacji oraz interfejs API.

## Odpowiedzialność backendu
- przyjmowanie plików przesyłanych przez użytkownika,
- zapis dokumentów,
- uruchamianie procesu OCR,
- przekazywanie tekstu do modelu Bielik,
- zapis wyników analizy do bazy danych,
- udostępnianie danych frontendowi,
- generowanie eksportów CSV/XLSX.

## Planowane moduły
- upload dokumentów
- OCR
- integracja z modelem Bielik
- baza danych
- eksport danych

## Uruchomienie (MVP upload + processing)

Wymagania: Python 3.10+.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Dokumentacja interaktywna API: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health: `GET /health`
- Upload faktury: `POST /api/v1/invoices/upload` (pole formularza `file`, typy: PDF, JPG, PNG)
- Przetwarzanie dokumentu: `POST /api/v1/invoices/{invoice_id}/process`
- Szczegóły dokumentu: `GET /api/v1/invoices/{invoice_id}`
- Lista dokumentów: `GET /api/v1/invoices?limit=50`
- Status OCR/Tesseract: `GET /api/v1/invoices/status/ocr`

Pliki zapisywane są w katalogu `data/uploads/` (względem katalogu roboczego przy starcie serwera). Katalog jest ignorowany przez Git.
Metadane i wyniki analizy zapisywane są w `data/app.db` (SQLite).

Zmienne środowiskowe (opcjonalnie): `AGENT_KS_UPLOAD_DIR`, `AGENT_KS_DATABASE_PATH`, `AGENT_KS_MAX_UPLOAD_BYTES`.

## Szybki test flow MVP

```bash
# 1) Upload
curl -F "file=@../docs/data/sample_data/f-vat_2011.pdf" http://127.0.0.1:8000/api/v1/invoices/upload

# 2) Processing
curl -X POST http://127.0.0.1:8000/api/v1/invoices/<ID_Z_UPLOADU>/process

# 3) Podgląd rekordu
curl http://127.0.0.1:8000/api/v1/invoices/<ID_Z_UPLOADU>
```

Uwaga: OCR obrazów (`jpg/png`) działa przez Tesseract (`pytesseract`). PDF-y są czytane przez warstwę tekstową (`pypdf`), a dla skanów PDF bez warstwy tekstowej zwracane jest ostrzeżenie w `processing_summary.warning`.

### Wymagania systemowe OCR (Tesseract)

- macOS: `brew install tesseract tesseract-lang`
- Ubuntu/Debian: `sudo apt-get install tesseract-ocr tesseract-ocr-pol`

Po instalacji możesz sprawdzić dostępność:

```bash
curl http://127.0.0.1:8000/api/v1/invoices/status/ocr
```

W odpowiedzi `POST /api/v1/invoices/{invoice_id}/process` dostaniesz `processing_summary` (silnik OCR, długość tekstu, fragment tekstu i ewentualne ostrzeżenie), co daje szybki, widoczny efekt działania MVP.

## Status
Zaimplementowany backend MVP: upload, zapis, przetwarzanie dokumentu (PDF text extraction), podstawowa ekstrakcja pól i kategoryzacja (regułowa), zapis wyników w SQLite.
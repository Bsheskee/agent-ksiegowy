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

## Uruchomienie (MVP upload)

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

Pliki zapisywane są w katalogu `data/uploads/` (względem katalogu roboczego przy starcie serwera). Katalog jest ignorowany przez Git.

Zmienne środowiskowe (opcjonalnie): `AGENT_KS_UPLOAD_DIR`, `AGENT_KS_MAX_UPLOAD_BYTES`.

## Status
Zaimplementowany szkielet FastAPI oraz endpoint uploadu plików (Etap 2 planu implementacji).
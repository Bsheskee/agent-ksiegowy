# TODO

## Organizacja projektu
- [x] utworzenie repozytorium
- [x] przygotowanie struktury katalogów
- [x] dodanie dokumentacji
- [ ] podział ról w zespole

## MVP – backend
- [x] wybór frameworka backendowego (FastAPI)
- [x] utworzenie podstawowego API
- [x] endpoint do uploadu plików
- [x] zapis przesłanych dokumentów
- [x] walidacja typów plików

## MVP – OCR
- [x] wybór narzędzia OCR (Tesseract)
- [x] integracja OCR z backendem (JPG/PNG)
- [x] testy na przykładowych fakturach
- [x] zapis tekstu odczytanego z dokumentu

## MVP – Bielik
- [x] przygotowanie promptu / schematu analizy
- [x] integracja z modelem Bielik (placeholder: `backend/app/services/bielik.py`)
- [x] ekstrakcja podstawowych pól
- [ ] kategoryzacja wydatków
- [x] obsługa błędnych lub niepełnych odpowiedzi

## MVP – baza danych
- [x] projekt tabel (SQLite: `invoices`)
- [x] zapis dokumentów i wyników
- [x] lista rekordów
- [ ] filtrowanie danych

## MVP – pipeline (etap przejściowy)
- [x] endpoint przetwarzania dokumentu po uploadzie
- [x] ekstrakcja tekstu z PDF (`pypdf`)
- [x] podstawowa ekstrakcja pól i kategoryzacja regułowa (placeholder pod Bielik)

## MVP – frontend
- [x] formularz uploadu
- [ ] widok analizy dokumentu
- [ ] możliwość edycji danych
- [x] tabela przetworzonych faktur
- [x] UI: usunięcie „Status przetwarzania” z danych księgowych + schowanie podglądu OCR (rozwijany w panelu technicznym)

## MVP – eksport
- [ ] eksport CSV
- [ ] eksport XLSX

## Rozszerzenia
- [ ] logowanie użytkowników
- [ ] historia operacji
- [ ] statystyki wydatków
- [ ] integracja z Google Sheets
- [ ] obsługa wielu użytkowników / firm

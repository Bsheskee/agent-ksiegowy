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
- [x] kategoryzacja wydatków (13 kategorii: oprogramowanie, sprzęt IT, paliwo, transport, delegacje, media, materiały biurowe, usługi doradcze, marketing, surowce, wyposażenie, ubezpieczenia, inne)
- [x] obsługa błędnych lub niepełnych odpowiedzi

## MVP – baza danych
- [x] projekt tabel (SQLite: `invoices`)
- [x] zapis dokumentów i wyników
- [x] lista rekordów
- [x] filtrowanie danych (po kategorii, statusie, zakresie dat wystawienia)

## MVP – pipeline (etap przejściowy)
- [x] endpoint przetwarzania dokumentu po uploadzie
- [x] ekstrakcja tekstu z PDF (`pypdf`)
- [x] podstawowa ekstrakcja pól i kategoryzacja regułowa (placeholder pod Bielik)

## MVP – frontend
- [x] formularz uploadu
- [x] widok analizy dokumentu (tabela danych + pozycje faktury, kolorowe badge kategorii)
- [x] możliwość edycji danych (modal z formularzem, PATCH do API)
- [x] tabela przetworzonych faktur
- [x] UI: usunięcie „Status przetwarzania” z danych księgowych + schowanie podglądu OCR (rozwijany w panelu technicznym)

## MVP – eksport
- [x] eksport CSV (endpoint + przycisk w UI, z uwzględnieniem aktywnych filtrów)
- [x] eksport XLSX (endpoint + przycisk w UI, z nagłówkami i formatowaniem)

## Rozszerzenia
- [ ] logowanie użytkowników
- [ ] historia operacji
- [ ] statystyki wydatków
- [ ] integracja z Google Sheets
- [ ] obsługa wielu użytkowników / firm

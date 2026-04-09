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
- [ ] wybór narzędzia OCR
- [ ] integracja OCR z backendem
- [ ] testy na przykładowych fakturach
- [ ] zapis tekstu odczytanego z dokumentu

## MVP – Bielik
- [ ] przygotowanie promptu / schematu analizy
- [ ] integracja z modelem Bielik
- [ ] ekstrakcja podstawowych pól
- [ ] kategoryzacja wydatków
- [ ] obsługa błędnych lub niepełnych odpowiedzi

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
- [ ] formularz uploadu
- [ ] widok analizy dokumentu
- [ ] możliwość edycji danych
- [ ] tabela przetworzonych faktur

## MVP – eksport
- [ ] eksport CSV
- [ ] eksport XLSX

## Rozszerzenia
- [ ] logowanie użytkowników
- [ ] historia operacji
- [ ] statystyki wydatków
- [ ] integracja z Google Sheets
- [ ] obsługa wielu użytkowników / firm
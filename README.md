# Agent księgowy do analizy faktur

Aplikacja wspomagająca automatyczne przetwarzanie faktur kosztowych z wykorzystaniem OCR oraz modelu językowego Bielik.

## Opis projektu
Użytkownik przesyła skan, zdjęcie lub plik PDF faktury, a system:
- odczytuje tekst z dokumentu,
- wyodrębnia kluczowe dane,
- przypisuje wydatek do kategorii,
- zapisuje wynik w uporządkowanej tabeli,
- umożliwia eksport danych do pliku.

Projekt ma na celu ograniczenie ręcznego przepisywania danych z faktur oraz ułatwienie porządkowania i analizy wydatków.

## Główne funkcje
- upload faktur w formacie JPG, PNG, PDF,
- OCR dokumentów,
- analiza tekstu z wykorzystaniem modelu Bielik,
- ekstrakcja danych księgowych,
- kategoryzacja wydatków,
- możliwość ręcznej korekty danych,
- zapis rekordów do bazy,
- eksport danych do CSV/XLSX.

## Wykorzystanie modelu Bielik
Model Bielik będzie wykorzystywany do:
- interpretacji tekstu uzyskanego z OCR,
- identyfikacji kluczowych informacji z faktury,
- przypisania wydatku do odpowiedniej kategorii,
- zwracania danych w ustrukturyzowanej formie.

## Grupa docelowa
System jest przeznaczony dla:
- osób prowadzących jednoosobową działalność,
- małych firm,
- pracowników administracyjnych,
- biur rachunkowych,
- organizacji rozliczających wydatki,
- użytkowników prywatnych.

## Planowane technologie
- Frontend: React lub prosty interfejs webowy
- Backend: FastAPI / Flask / Django
- OCR: Tesseract lub inny silnik OCR
- LLM: Bielik
- Baza danych: SQLite / PostgreSQL
- Eksport: CSV / XLSX / Google Sheets API

## Dokumentacja
Dokumentacja projektowa znajduje się w katalogu `docs/`:
- `PRD.md` – wymagania produktu
- `ARCHITECTURE.md` – architektura i przepływ danych
- `IMPLEMENTATION_PLAN.md` – plan implementacji
- `TODO.md` – lista zadań

## Struktura repozytorium
- `backend/` – logika aplikacji i API
- `frontend/` – interfejs użytkownika
- `docs/` – dokumentacja projektowa
- `data/sample_data/` – dane testowe i przykładowe faktury

## Status
Backend (FastAPI): działa szkielet API oraz upload faktur (JPG, PNG, PDF) — szczegóły w `docs/backend/README.md`. Frontend i OCR w przygotowaniu.

## Autorzy
Projekt realizowany zespołowo w ramach przedmiotu „Podstawy systemów informatycznych”.
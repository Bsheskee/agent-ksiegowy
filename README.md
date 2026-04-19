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

## Logika biznesowa

**Przedmiot domeny.** System obsługuje faktury kosztowe (skan, zdjęcie lub PDF). Biznesowo chodzi o przejście od surowego dokumentu do **uporządkowanego rekordu księgowego**: zestawu pól opisujących transakcję oraz **kategorii wydatku**, które można dalej filtrować, raportować i eksportować.

**Proces end-to-end (docelowy model).** Zgodnie z założeniami produktu i przepływem z `docs/ARCHITECTURE.md` oraz `docs/PRD.md`:
1. Użytkownik przesyła plik — dokument jest **trwale zapisywany** w systemie (oryginał do audytu i ponownego przetworzenia).
2. Z dokumentu uzyskiwany jest **tekst** (OCR dla obrazów; dla PDF — warstwa tekstowa, a w przyszłości pełniejsza obsługa skanów).
3. Z tekstu wyodrębniane są **pola faktury** i proponowana jest **kategoria kosztu** (w docelowej wersji głównie przez model Bielik; patrz poniżej o MVP).
4. Wynik jest **zapisywany w bazie** i prezentowany użytkownikowi.
5. Użytkownik **weryfikuje i ewentualnie poprawia** dane (zatwierdzenie ma być źródłem prawdy przed dalszym użyciem danych w rozliczeniach — wymaganie z PRD).
6. Zatwierdzone lub zaakceptowane rekordy można **przeglądać, filtrować i eksportować** (CSV/XLSX; opcjonalnie arkusze).

**Minimalny zestaw pól (wymagania produktowe).** System ma identyfikować m.in.: numer faktury, datę wystawienia, sprzedawcę (w praktyce także identyfikatory jak NIP), kwoty netto/brutto, VAT, walutę — z możliwością rozszerzenia o dodatkowe daty i pozycje z layoutów typowych dla polskich faktur (szczegóły implementacji MVP: `docs/backend/README.md`).

**Kategoryzacja.** Docelowy słownik kategorii obejmuje m.in. paliwo, transport, usługi, sprzęt, oprogramowanie, gastronomię, materiały biurowe (`docs/PRD.md`). Kategoria jest **propozycją systemu**; użytkownik może ją zmienić przed użyciem danych w rozliczeniach. W wdrożonym MVP część klasyfikacji może być **regułowa** (słowa kluczowe w tekście), z planem przejścia na Bielika dla trudniejszych przypadków.

**Ograniczenia i założenia.** Aplikacja zakłada typowe faktury w języku polskim; jakość automatycznego odczytu zależy od jakości skanu i spójności szablonu dokumentu. System nie zastępuje pełnej księgowości — **automatyzuje wstępne przetwarzanie i porządkowanie**, przy **obowiązkowej** możliwości korekty przez człowieka. W przyszłości jest możliwa integracja z KSeF (Krajowy System e-Faktur), który posiada otwarte API, co pozwla na zintegrowanie go z zewnętrznymi aplikacjami, takimi jak programy księgowe, systemy ERP czy inne narzędzia biznesowe. Dla naszej aplikacji w wersji MVP (Minimum Value Product) na tym etapie nie przewidujemy integracji z KSeF.

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
Backend (FastAPI): działa upload faktur oraz pipeline przetwarzania MVP (PDF text extraction + podstawowa ekstrakcja pól + zapis do SQLite) — szczegóły w `docs/backend/README.md`. Frontend, OCR obrazów i pełna integracja Bielika są w przygotowaniu.

## Autorzy
Projekt realizowany zespołowo w ramach przedmiotu „Podstawy systemów informatycznych”.
- Bartłomiej Białobrzewski
- Aner Ot
- Michał Studziński
- Piotr Mazur

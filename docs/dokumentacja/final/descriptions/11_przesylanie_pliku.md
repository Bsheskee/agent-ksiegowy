# 11 – Przesyłanie pliku (demo)

**Widok formularza przesyłania z wybranym plikiem, gotowym do przetworzenia.**

## Co widać na zrzucie

1. **Dropzone** — po wybraniu pliku zmienia się komunikat z „Przeciągnij plik tutaj lub kliknij, aby wybrać" na nazwę wybranego pliku (np. `f-vat_perf.pdf`).

2. **Nazwa pliku** — wyświetlona w strefie przeciągania, potwierdzająca poprawny wybór dokumentu.

3. **Przycisk „Przetwórz dokument"** — aktywny i gotowy do kliknięcia.

## Przepływ end-to-end (co dzieje się po kliknięciu)

1. Aplikacja wysyła plik jako `FormData` do `POST /api/v1/invoices/upload-and-process`.
2. Backend zapisuje plik na dysku (katalog `data/uploads/`).
3. Obliczana jest suma SHA-256 w celu wykrycia duplikatów.
4. Uruchamiany jest pipeline: OCR → analiza heurystyczna → (opcjonalnie) Bielik → scalenie → zapis do SQLite.
5. Rekord otrzymuje status `uploaded` → `processing` → `processed` (lub `failed`).
6. Do bazy `events` zapisywane są wpisy audytowe: uploaded, processing, processed.
7. Frontend otrzymuje pełny obiekt JSON z danymi i renderuje panel analizy.

## Prezentacja

Ten zrzut pokazuje moment tuż przed rozpoczęciem przetwarzania — użytkownik wybrał plik i za chwilę kliknie „Przetwórz dokument". To ilustracja prostoty obsługi: wybierz plik → kliknij → otrzymaj ustrukturyzowane dane księgowe. Cały skomplikowany pipeline OCR + AI dzieje się w tle, bez angażowania użytkownika.

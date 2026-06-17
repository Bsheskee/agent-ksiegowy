# 08 – Ustawienia

**Panel konfiguracyjny aplikacji z podglądem danych technicznych ostatniej faktury.**

## Elementy widoku

### Konfiguracja backendu
- **Adres API** — pole tekstowe z domyślną wartością `http://127.0.0.1:8000`. Przechowywane w `localStorage` pod kluczem `agent_ks_backend_url`. Zmiana wymaga kliknięcia „Zapisz".
- **Przycisk „Zapisz"** — zapisuje adres do localStorage i odświeża dane aplikacji (kategorie, statystyki, pulpit).
- **Wskazówka** — „Zmień tylko jeśli backend działa na innym porcie lub hoście".

### Dane techniczne ostatniego dokumentu
Tabela z metadanymi: ID dokumentu (skrócone), Nazwa pliku, Typ pliku (content-type), Rozmiar (B/KB/MB), Silnik OCR (np. `pypdf_text_layer`, `tesseract`), Długość OCR (liczba znaków).

### Sekcje rozwijane (collapsible)
1. **Tekst OCR (podgląd)** — `<details>` z surowym tekstem wyodrębnionym z dokumentu. Podsumowanie zawiera liczbę znaków. Jeśli OCR zwrócił ostrzeżenie (np. pusty text layer w PDF), wyświetlana jest żółta ramka ostrzegawcza.

2. **Pełna odpowiedź API (JSON)** — `<details>` z sformatowanym JSON-em zawierającym cały rekord z bazy danych. Przydatne do debugowania i weryfikacji.

## Prezentacja

Widok ustawień pokazuje, że aplikacja jest przejrzysta i konfigurowalna. Użytkownik może zmienić adres backendu bez restartowania serwera. Sekcje rozwijane z OCR i JSON-em są szczególnie przydatne dla zaawansowanych użytkowników i deweloperów — dają wgląd w to, co system „widzi" i jak interpretuje dane.

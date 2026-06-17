# 01 – Pulpit (Dashboard)

**Główny ekran aplikacji widoczny po zalogowaniu.** Pulpit pełni rolę centrum dowodzenia i podsumowania — to pierwszy widok, który wita użytkownika.

## Elementy widoku

1. **Panel boczny (sidebar)** — lewa nawigacja z pięcioma zakładkami: Pulpit, Nowa faktura, Dokumenty, Statystyki, Ustawienia. Wyróżniona aktywna strona (niebieska belka po lewej). Branding aplikacji „Agent Księgowy / System faktur" u góry.

2. **Górny pasek (topbar)** — wyświetla tytuł bieżącej strony, opcjonalnie przycisk menu hamburger (wersja mobilna).

3. **Karty KPI (2 szt.)** — duże kafelki tuż pod topbarem:
   - **Przetworzonych faktur** — łączna liczba poprawnie przetworzonych dokumentów (np. 3).
   - **Łączna wartość brutto** — suma kwot brutto wszystkich przetworzonych faktur (np. 13 973,60 PLN).

4. **Lista ostatnich dokumentów** — tabela/karty z 5 najnowszymi fakturami. Każda karta zawiera:
   - Nazwę pliku źródłowego
   - Status przetworzenia (zielona/bursztynowa/czerwona plakietka)
   - Numer faktury
   - Kwotę brutto z walutą
   - Kategorię wydatku (kolorowy badge)
   - Datę wystawienia
   - Przycisk „Zobacz wszystkie ->" prowadzący do widoku Dokumentów.

## Jak działa

Dane na pulpicie ładują się automatycznie przy przejściu na tę stronę: aplikacja wywołuje endpoint `GET /api/v1/invoices/stats` w celu pobrania sumarycznych statystyk oraz `GET /api/v1/invoices?limit=5` dla listy ostatnich faktur. Wszystkie wartości są formatowane w polskim stylu (spacje jako separator tysięcy, przecinek dziesiętny, PLN).

## Prezentacja

Ten widok pokazuje kompleksowość rozwiązania: aplikacja nie tylko przetwarza faktury, ale też agreguje wyniki w czytelny pulpit menedżerski. Użytkownik od razu widzi liczby i może kliknąć dowolną fakturę, aby przejść do jej szczegółów.

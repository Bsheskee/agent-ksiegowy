# 09 – Pozycje faktury (linie)

**Szczegółowy widok faktury rozszerzony o tabelę pozycji (line items).** Ten ekran pokazuje pełnię możliwości ekstrakcji danych.

## Elementy widoku

### Panel analizy (górna część)
Takie same sekcje jak w widoku 03: identyfikacja, strony, kwoty, klasyfikacja — ale dla faktury `f-vat_soft.pdf` (nr 298/2010).

### Tabela pozycji (dolna część, pełna szerokość)
Pod panelem analizy wyświetla się sekcja **„Pozycje faktury"** z tabelą o kolumnach:
| Lp | Nazwa | Jm | Ilość | Cena netto | Stawka VAT | Wart. netto | Wart. VAT | Wart. brutto |
|----|-------|----|--------|-------------|------------|-------------|-----------|--------------|

Pozycje są wyodrębniane przez heurystyczny parser w `analyzer.py`, który stosuje trzy strategie:
1. **Wiersze nazwane** — linie zawierające zarówno nazwę, jak i wartości liczbowe.
2. **Wiersze zwarte** — krótkie linie z danymi ilościowymi.
3. **Wiersze osierocone** — pozostałe dopasowania.

## Przykład

Dla faktury `f-vat_soft.pdf` (oprogramowanie), w tabeli widoczne są np. pozycje takie jak licencje oprogramowania z cenami netto, stawkami VAT i wartościami brutto. Każdy wiersz odpowiada jednej pozycji z oryginalnego dokumentu.

## Prezentacja

Tabela pozycji to jedna z najbardziej zaawansowanych funkcji systemu. Podczas gdy proste OCR-y potrafią wyciągnąć tylko tekst, nasz system strukturyzuje dane w formacie księgowym — z podziałem na netto, VAT i brutto dla każdej pozycji. To kluczowe dla użytkowników, którzy potrzebują szczegółowego raportowania kosztów.

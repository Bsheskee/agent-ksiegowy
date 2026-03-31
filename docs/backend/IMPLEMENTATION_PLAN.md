# Plan implementacji

## Etap 1 – Inicjalizacja projektu
- utworzenie repozytorium,
- przygotowanie struktury katalogów,
- dodanie podstawowej dokumentacji,
- ustalenie podziału zadań w zespole.

## Etap 2 – Backend i upload plików
- przygotowanie szkieletu backendu,
- utworzenie endpointu do przesyłania faktur,
- zapis plików w systemie.

## Etap 3 – OCR
- integracja z silnikiem OCR,
- odczyt tekstu z przykładowych dokumentów,
- zapis surowego tekstu do dalszej analizy.

## Etap 4 – Integracja z modelem Bielik
- przygotowanie formatu wejścia dla modelu,
- przekazanie tekstu do analizy,
- odebranie danych w formacie ustrukturyzowanym.

## Etap 5 – Logika walidacji i ekstrakcji
- mapowanie danych z odpowiedzi modelu na pola systemowe,
- obsługa brakujących danych,
- przygotowanie mechanizmu ręcznej korekty.

## Etap 6 – Baza danych
- zaprojektowanie modelu danych,
- zapis dokumentów i wyników analizy,
- przygotowanie zapytań do listowania rekordów.

## Etap 7 – Frontend
- formularz uploadu,
- podgląd wyników analizy,
- ekran edycji i zatwierdzania danych,
- tabela przetworzonych faktur.

## Etap 8 – Eksport danych
- generowanie plików CSV,
- opcjonalnie XLSX,
- opcjonalnie integracja z Google Sheets.

## Etap 9 – Testy i prezentacja
- testy end-to-end,
- przygotowanie zestawu przykładowych faktur,
- przygotowanie scenariusza demonstracyjnego.

## Proponowane milestone’y

### Milestone 1
- repozytorium,
- dokumentacja,
- podział zadań.

### Milestone 2
- upload plików,
- zapis dokumentów.

### Milestone 3
- OCR,
- odczyt tekstu.

### Milestone 4
- integracja z Bielikiem,
- ekstrakcja danych i kategoryzacja.

### Milestone 5
- zapis do bazy,
- lista faktur.

### Milestone 6
- eksport danych,
- testy,
- demo.
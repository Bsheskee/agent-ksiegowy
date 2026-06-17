# 05 – Lista dokumentów

**Pełny widok wszystkich faktur z możliwością filtrowania i eksportu.**

## Elementy widoku

### Panel górny
- **Tytuł** — „Wszystkie dokumenty".
- **Przyciski eksportu:**
  - **CSV** — plik rozdzielany średnikami z BOM UTF-8, 21 kolumn danych.
  - **XLSX** — plik Excela ze stylizowanym nagłówkiem (biały tekst na niebieskim tle #2563EB).
  - **Odśwież** — przycisk przeładowania listy.

### Pasek filtrów (5 kontrolek)
1. **Szukaj** — pole tekstowe, filtruje według numeru faktury lub nazwy pliku. Obsługa klawisza Enter.
2. **Kategoria** — lista rozwijana z 13 kategoriami + opcja „Wszystkie".
3. **Status** — lista rozwijana: Wszystkie, Przetworzone, Przesłane, Błąd.
4. **Od** — date picker, filtruje `issue_date >= wartość`.
5. **Do** — date picker, filtruje `issue_date <= wartość`.
6. **Filtruj** — zastosowanie filtrów.
7. **Wyczyść** — reset wszystkich filtrów.

### Siatka dokumentów
Karty w układzie responsive grid (min 300px szerokości). Każda karta zawiera:
- Nazwę pliku źródłowego
- Plakietki statusu (ostrzeżenie OCR, potwierdzenie, status)
- Numer faktury, kwotę brutto, kategorię (kolorowy badge), datę wystawienia
- Dla przetworzonych: podpowiedź „Kliknij, aby zobaczyć szczegóły →"

### Eksport — 21 kolumn
ID dokumentu, Nazwa pliku, Status, Dodano, Numer faktury, Data wystawienia, Data sprzedaży, Termin zapłaty, Miejsce wystawienia, Nazwa sprzedawcy, NIP sprzedawcy, Nazwa nabywcy, NIP nabywcy, Suma netto, Suma VAT, Suma brutto, Waluta, Kategoria, Zatwierdzone, Metoda ekstrakcji, Status Bielik.

## Prezentacja

Widok Dokumentów to centrum zarządzania bazą faktur. Użytkownik może szybko znaleźć interesujący go dokument, wyfiltrować według kategorii czy statusu, a następnie wyeksportować dane do arkusza kalkulacyjnego. Limit 50 rekordów na stronę zapewnia szybkość ładowania.

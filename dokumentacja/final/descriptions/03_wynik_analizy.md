# 03 – Wynik analizy faktury

**Szczegółowy widok faktury po przetworzeniu.** To najbogatszy ekran aplikacji, prezentujący wszystkie dane wyodrębnione przez system.

## Sekcje widoku

### Plakietki statusu (górny rząd)
- **Bielik** (purpurowy) / **Heurystyka** (szary) — wskazuje, czy dane zostały wzbogacone przez model językowy, czy pochodzą wyłącznie z reguł heurystycznych.
- **Zatwierdzone** (zielony) / **Niezatwierdzone** (pomarańczowy) — status akceptacji danych przez użytkownika.
- **Przetworzono** (zielony) / **Błąd** (czerwony) — status procesu.

### Identyfikacja (5 pól)
- Numer faktury, Data wystawienia, Data sprzedaży, Termin zapłaty, Miejsce wystawienia.

### Strony (karty sprzedawcy / nabywcy)
- Dwie karty obok siebie: Sprzedawca (nazwa + NIP) i Nabywca (nazwa + NIP).

### Kwoty (siatka 4 kolumn)
- Netto, VAT, Brutto (podświetlony niebieskim tłem), Waluta. Kwoty formatowane w stylu polskim: „1 234,56 PLN".

### Klasyfikacja
- Kategoria wydatku wyświetlona jako kolorowa plakietka (13 kategorii, każda z unikalnym kolorem, np. oprogramowanie, sprzęt IT, paliwo itd.).

### Przyciski akcji
- **Zatwierdź** (zielony) — ustawia `confirmed: true` w bazie.
- **Edytuj** (szary) — otwiera modal edycyjny z 14 polami.
- **Przetwórz ponownie** (szary) — uruchamia ponowny pipeline OCR + analiza.

## Prezentacja

To kluczowy widok pokazujący wartość biznesową aplikacji: z surowego pliku PDF/JPG/PNG system wyodrębnia ustrukturyzowane dane księgowe, kategoryzuje wydatek i prezentuje wszystko w czytelnej formie. Użytkownik może zweryfikować, poprawić i zatwierdzić dane jednym kliknięciem.

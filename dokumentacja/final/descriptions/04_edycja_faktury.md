# 04 – Edycja faktury (modal)

**Modal edycyjny pozwalający użytkownikowi na ręczną korektę danych wyodrębnionych przez system.**

## Elementy modala

1. **Tytuł** — „Edytuj dane faktury".

2. **Siatka pól (14 pól w 2 kolumnach):**
   - **Kolumna lewa:**
     - Numer faktury (pole tekstowe)
     - Data wystawienia (date picker)
     - Data sprzedaży (date picker)
     - Termin zapłaty (date picker)
     - Miejsce wystawienia (pole tekstowe)
     - Nazwa sprzedawcy (pole tekstowe)
     - NIP sprzedawcy (pole tekstowe)
   - **Kolumna prawa:**
     - Nazwa nabywcy (pole tekstowe)
     - NIP nabywcy (pole tekstowe)
     - Suma netto (pole tekstowe)
     - Suma VAT (pole tekstowe)
     - Suma brutto (pole tekstowe)
     - Waluta (pole tekstowe)
     - Kategoria (rozwijana lista — dane z `GET /api/v1/invoices/categories`)

3. **Przycisk „Anuluj"** — zamyka modal bez zapisu.

4. **Przycisk „Zapisz zmiany"** — wywołuje `PATCH /api/v1/invoices/{id}/analysis` z przesłaniem tylko zmodyfikowanych pól.

5. **Okienko statusu** — wewnątrz modala wyświetla komunikaty o zapisie („Zapisano!", „Błąd: ...").

## Przepływ zapisu

1. Użytkownik klika „Zapisz zmiany".
2. Pojawia się potwierdzenie: „Zapisać zmiany w danych faktury?"
3. Po akceptacji: PATCH do API, odświeżenie panelu analizy, toast success, odświeżenie statystyk.
4. Modal automatycznie zamyka się po 700 ms od udanego zapisu.

## Zamknięcie

Modal można zamknąć przez kliknięcie w tło (backdrop), przycisk „X" w nagłówku, przycisk „Anuluj" lub klawisz Escape.

## Prezentacja

Modal edycyjny realizuje kluczowe wymaganie biznesowe: **człowiek zawsze ma ostatnie słowo**. System proponuje dane automatycznie, ale użytkownik może je zweryfikować i poprawić przed użyciem w rozliczeniach. To balans między automatyzacją a kontrolą.

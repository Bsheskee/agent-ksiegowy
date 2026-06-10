# 07 – Statystyki (wykresy)

**Widok analityczny z dwoma wykresami słupkowymi i podsumowaniem KPI.**

## Elementy widoku

### Karty KPI (zduplikowane z pulpitu)
- **Przetworzonych faktur** — łączna liczba.
- **Łączna wartość brutto** — suma wszystkich faktur.

### Wykres 1: Wydatki według kategorii (poziomy słupkowy)
- Oś Y: kategorie wydatków (oprogramowanie, sprzęt IT, inne).
- Oś X: wartości w PLN (format „1 234,56 PLN").
- Każda kategoria ma swój unikalny kolor (z mapy `CAT_COLOURS`).
- Brak legendy — etykiety kategorii są bezpośrednio na osi Y.
- W przykładowych danych widoczne trzy słupki: oprogramowanie (4 646,00 PLN), sprzęt IT (6 120,00 PLN), inne (3 207,60 PLN).

### Wykres 2: Wydatki według miesiąca (pionowy słupkowy)
- Oś X: ostatnie 12 miesięcy.
- Oś Y: wartości w PLN.
- Niebieskie słupki (#2563eb).
- Pokazuje sezonowość wydatków — rozkład kwot brutto w czasie.

### Przycisk odświeżania
- Ikona strzałki w kole — przeładowuje dane statystyczne z API.

## Technologia

Wykresy są renderowane za pomocą biblioteki **Chart.js v4.4.4**. Dane pochodzą z endpointu `GET /api/v1/invoices/stats`, który zwraca agregacje: `by_category` (suma brutto na kategorię) i `by_month` (suma brutto na miesiąc). Backend parsuje polski format kwot („1 000,00") przed agregacją.

## Prezentacja

Widok statystyk pokazuje, że aplikacja nie jest tylko narzędziem do przetwarzania — to również platforma analityczna. Użytkownik może na pierwszy rzut oka zobaczyć, na co wydaje najwięcej pieniędzy i jak wydatki rozkładają się w czasie. To kluczowa wartość dla małych firm i księgowości.

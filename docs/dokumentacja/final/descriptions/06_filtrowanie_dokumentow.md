# 06 – Filtrowanie dokumentów

**Lista dokumentów z aktywnym filtrem kategorii.** Widok prezentujący mechanizm filtrowania w praktyce.

## Co widać na zrzucie

1. **Pasek filtrów** — kategoria ustawiona na „oprogramowanie" (wybrana z rozwijanej listy). Pozycje filtrów są wypełnione, przycisk „Filtruj" został kliknięty.

2. **Siatka dokumentów** — wyświetlone tylko faktury sklasyfikowane jako „oprogramowanie". W przykładowej bazie jest to faktura `f-vat_soft.pdf` (nr 298/2010) na kwotę 4 646,00 PLN.

3. **Efekt filtrowania** — pozostałe faktury (kategorii „sprzęt IT" i „inne") są ukryte, co pokazuje selektywność mechanizmu.

## Jak działa filtrowanie

Po kliknięciu „Filtruj" aplikacja:
1. Czyta wartości wszystkich pól filtrujących.
2. Buduje obiekt `URLSearchParams`.
3. Wysyła żądanie `GET /api/v1/invoices?category=oprogramowanie&limit=50`.
4. Backend używa `json_extract()` w SQLite do filtrowania po polu `analysis_json`.
5. Otrzymane dane renderuje jako karty w siatce.

## Prezentacja

Filtrowanie pokazuje, że system nie tylko gromadzi dane, ale też umożliwia ich inteligentne przeszukiwanie. Użytkownik może szybko zawęzić wyniki do konkretnej kategorii, okresu czy statusu, co jest kluczowe przy większej liczbie dokumentów.

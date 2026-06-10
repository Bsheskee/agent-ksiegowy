# Key Value Proposition — odpowiedzi na zarzuty dotyczące KSeF

## Cel dokumentu

Przygotowanie zespołu do obrony projektu przed zarzutem, że Krajowy System e-Faktur (KSeF) czyni nasze narzędzie zbędnym. Poniżej znajdują się konkretne argumenty, granice kompetencji KSeF oraz unikalna wartość, którą dostarcza Agent Księgowy.

---

## 1. Czym KSeF jest, a czym nie jest

| KSeF | Agent Księgowy |
|---|---|
| System **międzyfirmowej wymiany** ustrukturyzowanych faktur elektronicznych (XML) | Narzędzie do **wewnętrznego przetwarzania** dokumentów przez pojedynczego użytkownika |
| Wymaga faktury wystawionej i odebranej w formacie ustrukturyzowanym przez obie strony | Przyjmuje **surowe dokumenty** — skany, zdjęcia, PDF-y (z warstwą tekstową lub bez) |
| Nie wykonuje OCR — działa wyłącznie na danych XML | Wykonuje **OCR** (Tesseract, pypdf) — odczytuje tekst z obrazów i skanów |
| Nie kategoryzuje wydatków — służy wyłącznie do przesyłania i przechowywania faktur | **Klasyfikuje** wydatki do 13 kategorii kosztowych (regulowo + opcjonalnie Bielik) |
| Nie oferuje analizy kosztów, statystyk ani dashboardów | Oferuje **dashboard KPI**, wykresy wydatków wg kategorii i miesięcy |
| Nie pozwala na edycję ani adnotacje — faktura w KSeF jest niezmienialna | Pozwala na **ręczną korektę** i zatwierdzenie danych przed użyciem |
| Nie oferuje eksportu do arkuszy kalkulacyjnych | Eksportuje dane do **CSV i XLSX** z 21 kolumnami, z możliwością filtrowania |
| Wymaga internetu i połączenia z API Ministerstwa Finansów | Działa **lokalnie** (offline), bez zależności od zewnętrznych serwisów |

**Wniosek:** KSeF i Agent Księgowy działają na **różnych poziomach abstrakcji** i rozwiązują **różne problemy**. KSeF to infrastruktura państwowa do obiegu faktur między podmiotami. Agent Księgowy to narzędzie wspomagające pracownika/księgowego w porządkowaniu i analizie dokumentów, niezależnie od ich źródła.

---

## 2. Co KSeF NIE rozwiązuje — a nasze narzędzie tak

### 2.1. Faktury papierowe i skany

> **Zarzut:** KSeF eliminuje faktury papierowe, więc nie ma potrzeby OCR.

**Odpowiedź:** KSeF **nie eliminuje** faktur papierowych z dnia na dzień. Nawet po pełnym wdrożeniu:
- Faktury z zagranicy (spoza Polski) — nie przechodzą przez KSeF
- Faktury wewnątrzwspólnotowe — poza zakresem KSeF
- Paragony, bilety, rachunki — nie są objęte KSeF
- Dokumenty archiwalne (sprzed wdrożenia KSeF) — trzeba je zeskanować i przetworzyć
- Małe firmy i jednoosobowe działalności mają **wieloletnie okresy przejściowe**

Nasze narzędzie obsługuje wszystkie te przypadki, których KSeF nigdy nie dotknie.

### 2.2. Kategoryzacja kosztów

> **Zarzut:** KSeF już ma dane faktury, więc po co kolejna warstwa?

**Odpowiedź:** KSeF przechowuje fakturę w formacie XML — zawiera NIP, kwoty, daty, ale **nie klasyfikuje wydatku** do kategorii księgowej (oprogramowanie, paliwo, marketing itd.). To księgowy lub system księgowy musi ręcznie przypisać każdą fakturę do odpowiedniego konta. Nasze narzędzie **automatyzuje** tę właśnie czynność — i robi to z użyciem heurystyki + opcjonalnie modelu Bielik.

### 2.3. Analiza i dashboard

> **Zarzut:** Do analizy są narzędzia BI podpięte pod KSeF.

**Odpowiedź:** Owszem, ale:
- Narzędzia BI wymagają integracji, konfiguracji i wiedzy technicznej
- Agent Księgowy dostarcza **gotowy dashboard** z wykresami Chart.js od razu po uruchomieniu
- KSeF nie grupuje wydatków po kategoriach — nasz system tak
- Wykresy "wydatki wg kategorii" i "wydatki wg miesiąca" są generowane automatycznie, **zero konfiguracji**

### 2.4. Praca offline i prywatność

> **Zarzut:** KSeF jest online, więc to wygodniejsze.

**Odpowiedź:** KSeF wymaga stałego połączenia z internetem i przesyłania wszystkich faktur do rządowej bazy danych. Nasze narzędzie:
- Działa **w pełni lokalnie** — żadne dane nie opuszczają komputera użytkownika
- Może być używane w firmach, które **nie chcą** przesyłać wszystkich faktur do chmury rządowej
- Jest przydatne dla firm **przed** obowiązkowym wdrożeniem KSeF (opóźnienia, przesunięcia terminów)

---

## 3. Mapa kompetencji — kto robi co

```
Proces ksiegowy:
 1. Otrzymanie dokumentu (PDF/scan/XML)
    - KSeF: XML z systemu zewnetrznego
    - Agent: PDF, skan, zdjecie (dowolne źródlo)
 2. OCR / odczyt danych zapisanych na dokumencie
    - KSeF: NIE (nie potrzebuje — pracuje na XML)
    - Agent: TAK (Tesseract, pypdf)
 3. Ekstrakcja pól (nr, data, kwoty, NIP)
    - KSeF: TAK (z XML)
    - Agent: TAK (z tekstu OCR / text layer)
 4. Kategoryzacja wydatku
    - KSeF: NIE
    - Agent: TAK (13 kategorii + Bielik)
 5. Weryfikacja i korekta przez czlowieka
    - KSeF: NIE (faktura niezmienialna)
    - Agent: TAK (edycja, zatwierdzenie)
 6. Analiza kosztów (KPI, wykresy, raporty)
    - KSeF: NIE
    - Agent: TAK (dashboard, Chart.js)
 7. Eksport do arkusza (CSV/XLSX)
    - KSeF: NIE
    - Agent: TAK
 8. Wysłanie do urzedu skarbowego (zgodnosc z prawem)
    - KSeF: TAK (to jego glowna rola)
    - Agent: NIE
```

**Kluczowa obserwacja:** KSeF i Agent Księgowy **nie konkurują** — **uzupełniają się**. KSeF rozwiązuje problem obiegu faktur między podmiotami. Agent Księgowy rozwiązuje problem **wewnętrznego przetwarzania i analizy** dokumentów w firmie.

---

## 4. Gotowe odpowiedzi na typowe pytania

### Pytanie 1: Skoro KSeF bedzie obowiazkowy, to po co wam to?

KSeF jest obowiązkowy dla faktur **między polskimi firmami** w formacie XML. Nie obejmuje:
- Faktur zagranicznych
- Dokumentów archiwalnych
- Paragonów, biletów, rachunków
- Skanów i zdjęć faktur papierowych

Nasze narzędzie obsługuje **wszystkie te przypadki**. Co więcej, nawet faktury z KSeF można pobrać jako PDF i przetworzyć przez nasz system, aby automatycznie dodać kategoryzację i analizę.

### Pytanie 2: KSeF zwalnia pracownika z recznego przepisywania — to wystarczy.

KSeF zwalnia z przepisywania danych strukturalnych (NIP, kwoty). **Nie zwalnia** z:
- Przypisywania kategorii kosztowej
- Ręcznej korekty danych
- Generowania raportów wydatków
- Eksportu do arkuszy kalkulacyjnych

Wszystkie te czynności automatyzuje Agent Księgowy.

### Pytanie 3: Wasze narzedzie to tylko prosty OCR + baza danych.

To prawda, że fundamentem jest OCR + baza danych. Jednak:
- OCR obsługuje zarówno PDF (warstwa tekstowa), jak i obrazy (Tesseract)
- Ekstrakcja pól wspiera trzy strategie parsowania pozycji faktury
- Kategoryzacja działa regułowo z możliwością rozszerzenia o Bielik
- Dashboard i wykresy są generowane automatycznie
- Eksport do CSV/XLSX uwzględnia aktywne filtry
- SHA-256 deduplikacja zapobiega wielokrotnemu przetwarzaniu

Nie jest to "prosty OCR" — to kompletny pipeline od skanu do analityki.

### Pytanie 4: KSeF tez bedzie mial kiedys analityke.

Być może, ale:
- KSeF jest systemem państwowym — jego priorytetem jest zgodność podatkowa, nie analityka biznesowa
- Rozwój funkcji analitycznych w KSeF nie jest zapowiadany i jeśli nastąpi, to w perspektywie lat
- Nasze narzędzie jest dostępne **już teraz**, lekkie, lokalne i darmowe
- Nawet jeśli KSeF doda podstawowe statystyki, nasza kategoryzacja (13 kategorii + Bielik) wykracza poza to, co kiedykolwiek będzie oferował system państwowy

### Pytanie 5: Czy nie lepiej zintegrowac sie z KSeF zamiast robic wlasne narzedzie?

Integracja z KSeF jest możliwa i zapisana w dokumentacji jako przyszłościowe rozszerzenie (**KSeF ma otwarte API**). Obecnie jednak:
- KSeF nie obejmuje wszystkich dokumentów (faktury zagraniczne, paragony, archiwa)
- KSeF wymaga internetu — nasze narzędzie działa offline
- KSeF nie oferuje kategoryzacji ani dashboardów
- API KSeF jest wciąż rozwijane i zmienia się

Strategia: **najpierw niezależne narzędzie**, potem ewentualna integracja z KSeF jako dodatkowe źródło danych.

---

## 5. Podsumowanie — nasza unikalna wartość

1. **OCR dla wszystkiego, czego KSeF nie dotknie** — skany, zdjęcia, faktury zagraniczne, paragony
2. **Automatyczna kategoryzacja** — 13 kategorii kosztowych + opcjonalny Bielik
3. **Dashboard i analityka** — gotowe wykresy, KPI, statystyki
4. **Praca offline** — zero zależności od internetu
5. **Prywatność** — dane nie opuszczają komputera użytkownika
6. **Natychmiastowa dostępność** — start.sh i gotowe
7. **Rozszerzalność** — otwarte API, możliwość integracji z KSeF w przyszłości

KSeF rozwiązuje problem **obowiązkowego raportowania podatkowego**. Agent Księgowy rozwiązuje problem **codziennego zarządzania finansami firmy**. To dwa różne problemy, a nasze narzędzie wypełnia lukę, której KSeF nigdy nie zaadresuje.

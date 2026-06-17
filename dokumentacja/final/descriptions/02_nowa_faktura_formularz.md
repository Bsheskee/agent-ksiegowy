# 02 – Nowa faktura (formularz przesyłania)

**Główny widok dodawania nowej faktury do systemu.** To tutaj użytkownik rozpoczyna proces przetwarzania dokumentu.

## Elementy widoku

1. **Panel górny** — tytuł „Nowa faktura".

2. **Strefa przeciągania i upuszczania (dropzone)** — duży obszar z przerywaną ramką, centralnie umieszczony na stronie. Komunikat zachęty: „Przeciągnij plik tutaj lub kliknij, aby wybrać". Obsługiwane formaty: PDF, JPG, PNG (maks. 25 MB).

3. **Pole wyboru pliku (input type="file")** — ukryty, aktywowany po kliknięciu dropzone lub przeciągnięciu pliku.

4. **Przycisk „Przetwórz dokument"** — główna akcja. Po kliknięciu wysyła plik do API (`POST /api/v1/invoices/upload-and-process`). Podczas oczekiwania zmienia tekst na „Przetwarzanie..." i wyświetla spinner.

5. **Obszar statusu** — pole tekstowe pod przyciskiem, wyświetla komunikaty o powodzeniu (zielony) lub błędzie (czerwony).

6. **Panel wyników (ukryty początkowo)** — miejsce, gdzie po przetworzeniu pojawia się szczegółowa analiza faktury (sekcja `#analysisSection` z polem `display:none`).

## Obsługa duplikatów

Gdy plik o identycznej sumie SHA-256 został już wcześniej przesłany, system zwraca istniejący rekord z flagą `duplicate: true`. Użytkownik widzi ostrzeżenie (żółty toast) i może edytować/zatwierdzić dane bez ponownego przetwarzania.

## Prezentacja

Ten widok demonstruje prostotę interfejsu — jeden obszar, jeden przycisk, minimalny friction dla użytkownika. Całe złożone przetwarzanie (OCR, ekstrakcja heurystyczna, opcjonalnie Bielik) dzieje się w tle po kliknięciu przycisku.

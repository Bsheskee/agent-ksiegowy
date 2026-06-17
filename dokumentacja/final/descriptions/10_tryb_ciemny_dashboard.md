# 10 – Tryb ciemny (Dashboard)

**Aplikacja w trybie ciemnym — widok pulpitu głównego.**

## Opis

Aplikacja w pełni wspiera tryb ciemny (dark mode) poprzez media query CSS `prefers-color-scheme: dark`. Zrzut przedstawia ten sam widok co screenshot 01, ale w ciemnej palecie barw.

## Zmiany stylistyczne w trybie ciemnym

- **Tło strony** — zmienia się z jasnego na ciemnoszare (#1a1a2e lub podobne).
- **Panel boczny** — ciemne tło, jaśniejszy tekst, delikatne cienie.
- **Karty i panele** — ciemne powierzchnie (#2a2a3e) z jaśniejszym tekstem.
- **Karty KPI** — białe napisy na ciemnym tle z akcentami kolorystycznymi.
- **Badge'y** — kolorowe plakietki (zielone potwierdzenie, pomarańczowa kategoria) pozostają czytelne dzięki odpowiedniemu kontrastowi.
- **Przyciski** — dostosowane kolory dla ciemnego tła.

## Jak jest implementowany

Tryb ciemny jest w pełni oparty na CSS — nie wymaga przełącznika ani JavaScriptu. Przeglądarka automatycznie wybiera odpowiedni zestaw kolorów na podstawie ustawień systemowych użytkownika. W `styles.css` zdefiniowano reguły z `@media (prefers-color-scheme: dark)` zmieniające zmienne CSS (kolory tła, tekstu, obramowań, cieni).

## Prezentacja

Wsparcie trybu ciemnego to nie tylko kwestia estetyki — to wymóg nowoczesnych aplikacji webowych. Użytkownicy pracujący wieczorem lub w słabym oświetleniu docenią męczącą oczy paletę. Aplikacja jest gotowa do codziennego użytku w każdych warunkach.

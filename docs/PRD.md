# PRD – Agent księgowy do automatycznego przetwarzania faktur

## 1. Nazwa projektu
Agent księgowy do automatycznego przetwarzania faktur z wykorzystaniem modelu Bielik

## 2. Cel projektu
Celem projektu jest stworzenie aplikacji, która automatyzuje wstępne przetwarzanie faktur kosztowych.  
Użytkownik przesyła skan, zdjęcie lub plik PDF faktury, a system:
- odczytuje treść dokumentu,
- wyodrębnia kluczowe dane,
- klasyfikuje wydatek do odpowiedniej kategorii,
- zapisuje wynik w uporządkowanej tabeli lub arkuszu.

## 3. Problem
Wprowadzanie danych z faktur do arkuszy lub systemów księgowych jest często wykonywane ręcznie. Powoduje to:
- dużą czasochłonność,
- ryzyko błędów,
- brak spójnej kategoryzacji,
- trudność w analizie kosztów.

Projekt ma ograniczyć te problemy przez częściową automatyzację procesu.

## 4. Grupa docelowa
System może być przydatny dla:
- osób prowadzących jednoosobową działalność gospodarczą,
- małych firm,
- pracowników administracyjnych,
- biur rachunkowych,
- organizacji i zespołów rozliczających wydatki,
- użytkowników prywatnych.

## 5. Główna wartość
Najważniejsze korzyści:
- automatyczny odczyt danych z dokumentów,
- automatyczna lub półautomatyczna kategoryzacja wydatków,
- ograniczenie błędów ludzkich,
- łatwiejszy eksport i analiza danych.

## 6. Zakres funkcjonalny MVP

### 6.1. Dodawanie dokumentów
- przesyłanie plików JPG, PNG i PDF,
- zapis dokumentów w systemie.

### 6.2. Odczyt danych z faktury
- ekstrakcja tekstu z dokumentu,
- identyfikacja podstawowych pól:
  - numer faktury,
  - data wystawienia,
  - sprzedawca,
  - kwota netto,
  - kwota brutto,
  - VAT,
  - waluta.

### 6.3. Kategoryzacja wydatku
- przypisanie faktury do kategorii kosztowej, np.:
  - paliwo,
  - transport,
  - usługi,
  - sprzęt,
  - oprogramowanie,
  - gastronomia,
  - materiały biurowe.

### 6.4. Walidacja przez użytkownika
- podgląd odczytanych danych,
- możliwość ręcznej korekty,
- zatwierdzenie wpisu.

### 6.5. Widok tabelaryczny
- lista przetworzonych dokumentów,
- podstawowe filtrowanie i wyszukiwanie.

### 6.6. Eksport danych
- eksport do CSV lub XLSX,
- opcjonalnie eksport do Google Sheets.

## 7. Funkcjonalności rozszerzone
- logowanie użytkowników,
- historia operacji,
- statystyki wydatków,
- reguły automatycznej klasyfikacji,
- obsługa wielu kont lub firm,
- archiwizacja dokumentów.

## 8. Wykorzystanie modelu Bielik
W projekcie zostanie wykorzystany model językowy Bielik jako komponent wspierający analizę treści dokumentu.

### Planowane zastosowania:
- interpretacja tekstu wyodrębnionego z faktury po OCR,
- identyfikacja i normalizacja kluczowych informacji z dokumentu,
- przypisanie wydatku do odpowiedniej kategorii,
- generowanie ustrukturyzowanego wyniku.

### Rola modelu w systemie:
1. użytkownik przesyła dokument,
2. OCR odczytuje tekst,
3. tekst trafia do modelu Bielik,
4. model zwraca dane oraz proponowaną kategorię,
5. użytkownik zatwierdza lub poprawia wynik.

## 9. Wymagania funkcjonalne
- System ma umożliwiać przesłanie skanu, zdjęcia lub PDF faktury.
- System ma zapisywać przesłany dokument.
- System ma odczytywać tekst z dokumentu z użyciem OCR.
- System ma przekazywać wynik OCR do modułu analitycznego opartego o model Bielik.
- System ma wyodrębniać podstawowe dane księgowe.
- System ma przypisywać dokument do kategorii kosztowej.
- System ma prezentować użytkownikowi dane do zatwierdzenia lub edycji.
- System ma zapisywać zatwierdzone dane w bazie.
- System ma umożliwiać przeglądanie i filtrowanie rekordów.
- System ma umożliwiać eksport danych do CSV lub XLSX.

## 10. Wymagania niefunkcjonalne
- Interfejs użytkownika powinien być prosty i zrozumiały.
- System powinien działać dla typowych faktur w języku polskim.
- System powinien umożliwiać korektę danych przez użytkownika.
- Dane powinny być przechowywane w uporządkowanej bazie.
- Aplikacja powinna być łatwa do uruchomienia lokalnie.
- Kod powinien być podzielony na moduły umożliwiające rozwój.

## 11. Kryteria sukcesu
Projekt zostanie uznany za udany, jeśli:
- użytkownik będzie mógł przesłać fakturę i otrzymać uzupełnione dane,
- system poprawnie zapisze dane w tabeli,
- system automatycznie zaproponuje kategorię wydatku,
- użytkownik będzie mógł poprawić i wyeksportować dane,
- aplikacja będzie działać end-to-end w wersji demonstracyjnej.
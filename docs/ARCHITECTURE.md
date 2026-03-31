# Architektura systemu

## 1. Główne moduły systemu
1. Frontend – interfejs użytkownika do przesyłania faktur i przeglądania wyników
2. Backend API – logika aplikacji oraz komunikacja między modułami
3. Moduł przechowywania plików – zapis oryginalnych dokumentów
4. OCR – ekstrakcja tekstu ze skanu lub pliku PDF
5. Bielik Analyzer – analiza tekstu i ekstrakcja danych
6. Database – zapis danych o dokumentach i wynikach analizy
7. Export Module – eksport danych do CSV/XLSX

## 2. Przepływ danych
1. Użytkownik przesyła fakturę przez frontend.
2. Backend zapisuje plik w systemie.
3. Moduł OCR odczytuje tekst z dokumentu.
4. Odczytany tekst trafia do modułu analitycznego opartego o Bielik.
5. Bielik zwraca uporządkowane dane oraz proponowaną kategorię wydatku.
6. Backend zapisuje wynik w bazie danych.
7. Frontend wyświetla dane użytkownikowi do zatwierdzenia lub korekty.
8. Po zatwierdzeniu dane mogą zostać wyeksportowane.

## 3. Diagram logiczny

```text
[Użytkownik]
     |
     v
[Frontend]
     |
     v
[Backend API]
     |
     +--> [Storage]
     |
     +--> [OCR]
     |        |
     |        v
     |   [Tekst z dokumentu]
     |
     +--> [Bielik Analyzer]
     |        |
     |        v
     |   [Dane ustrukturyzowane + kategoria]
     |
     +--> [Database]
     |
     +--> [Export Module]
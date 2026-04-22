
## Wymagania

- Python 3.10+
- Git
- system:
  - macOS / Linux
  - lub Windows PowerShell

## Uruchomienie

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

### Windows

Uruchom w PowerShell:

```powershell
.\start.ps1
```

## Gotowe

Po uruchomieniu otwórz w przeglądarce:

```text
http://localhost:5500
```

Frontend powinien być dostępny lokalnie, a backend zostanie uruchomiony automatycznie w tle.

---

# Troubleshooting

## 1. `start.ps1` nie działa na Windows
Sprawdź, czy plik istnieje w katalogu głównym projektu.

Jeśli PowerShell blokuje uruchamianie skryptów, wykonaj:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Następnie uruchom ponownie:

```powershell
.\start.ps1
```

## 2. Brak Pythona
Sprawdź wersję:

```bash
python --version
```

albo na Windows:

```powershell
py --version
```

Jeśli Python nie jest dostępny, zainstaluj Python 3.10 lub nowszy.

## 3. Brak zależności backendu
Jeśli instalacja pakietów się nie powiedzie, sprawdź czy istnieje plik:

```text
backend/requirements.txt
```

## 4. OCR nie działa
Dla OCR obrazów może być potrzebny Tesseract.

### macOS
```bash
brew install tesseract tesseract-lang
```

### Ubuntu / Debian
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-pol
```

### Windows
Zainstaluj Tesseract OCR i upewnij się, że jest dodany do systemowego `PATH`.

## 5. Port 5500 lub 8000 jest zajęty
Jeśli aplikacja nie startuje, sprawdź czy porty:
- `5500` (frontend)
- `8000` (backend)

nie są już używane przez inne procesy.

## 6. Backend nie uruchamia się
Sprawdź, czy w backendzie istnieje aplikacja uruchamiana jako:

```text
app.main:app
```

oraz czy `uvicorn` znajduje się w `backend/requirements.txt`.

## 7. Frontend się otwiera, ale nic nie działa
Upewnij się, że backend działa równolegle i nasłuchuje na:

```text
http://localhost:8000
```

oraz że frontend wysyła żądania do poprawnego adresu API.
```

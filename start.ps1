Write-Host "[INFO] Start backend..." -ForegroundColor Cyan

$projectRoot = Get-Location
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

if (!(Test-Path $backendPath)) {
    Write-Host "[ERROR] Nie znaleziono folderu backend" -ForegroundColor Red
    exit 1
}

if (!(Test-Path $frontendPath)) {
    Write-Host "[ERROR] Nie znaleziono folderu frontend" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

if (!(Test-Path ".venv")) {
    Write-Host "[INFO] Tworze virtualenv..." -ForegroundColor Yellow
    py -m venv .venv
}

$pythonExe = Join-Path $backendPath ".venv\Scripts\python.exe"
$pipExe = Join-Path $backendPath ".venv\Scripts\pip.exe"

if (!(Test-Path $pythonExe)) {
    Write-Host "[ERROR] Nie znaleziono python.exe w virtualenv" -ForegroundColor Red
    exit 1
}

if (!(Test-Path "requirements.txt")) {
    Write-Host "[ERROR] Nie znaleziono pliku requirements.txt w folderze backend" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Instaluje zaleznosci backendu..." -ForegroundColor Yellow
& $pipExe install -r requirements.txt

Write-Host "[INFO] Uruchamiam backend..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath $pythonExe `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--reload" `
    -WorkingDirectory $backendPath `
    -PassThru

Set-Location $projectRoot

Write-Host "[INFO] Start frontend..." -ForegroundColor Cyan
Write-Host "[INFO] Uruchamiam frontend..." -ForegroundColor Green

$frontendProcess = Start-Process -FilePath "py" `
    -ArgumentList "-m", "http.server", "5500" `
    -WorkingDirectory $frontendPath `
    -PassThru

Write-Host ""
Write-Host "[OK] Backend (PID $($backendProcess.Id)) i Frontend (PID $($frontendProcess.Id)) uruchomione" -ForegroundColor Green
Write-Host "[URL] Frontend: http://localhost:5500" -ForegroundColor White
Write-Host "[URL] Backend:  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "[STOP] Aby zatrzymac serwery, nacisnij ENTER..." -ForegroundColor Yellow
Read-Host

Write-Host "[INFO] Zatrzymuje serwery..." -ForegroundColor Red

if ($backendProcess -and !$backendProcess.HasExited) {
    Stop-Process -Id $backendProcess.Id -Force
}

if ($frontendProcess -and !$frontendProcess.HasExited) {
    Stop-Process -Id $frontendProcess.Id -Force
}

Write-Host "[OK] Serwery zatrzymane." -ForegroundColor Green

#!/usr/bin/env bash

set -e

echo "▶️ Start backend..."

cd backend

if [ ! -d ".venv" ]; then
  echo "🔧 Tworzę virtualenv..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt >/dev/null

uvicorn app.main:app --reload &
BACKEND_PID=$!

cd ..

echo "▶️ Start frontend..."

cd frontend
python3 -m http.server 5500 &
FRONTEND_PID=$!

cd ..

echo "✅ Backend (PID $BACKEND_PID) i Frontend (PID $FRONTEND_PID) uruchomione"
echo "🌐 Frontend: http://localhost:5500"
echo "🧠 Backend:  http://localhost:8000"
echo "⏹  Zatrzymaj: CTRL+C"

# Sprzątanie po CTRL+C
trap "echo '🛑 Zatrzymuję serwery…'; kill $BACKEND_PID $FRONTEND_PID" SIGINT

wait

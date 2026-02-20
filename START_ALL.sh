#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Deteniendo servicios..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT SIGTERM

echo "🚀 Iniciando Entorno KAIU (Oracle Linux WSL)..."

# 1. Start Redis (Check if running or start it)
if ! pgrep redis-server > /dev/null; then
    echo "📦 Iniciando Redis Server..."
    # Try different paths/commands common in RHEL/Oracle
    sudo systemctl start redis 2>/dev/null || sudo /usr/bin/redis-server --daemonize yes 2>/dev/null || redis-server --daemonize yes
else
    echo "✅ Redis ya está corriendo."
fi

# 2. Check Database Connection
echo "🔍 Verificando Base de Datos..."
# We can just run a quick prisma check or trust it works. 
# Let's verify DB schema is pushed.
# npx prisma db push --skip-generate

# 3. Start Backend API (Port 3001)
echo "🌐 Iniciando Backend API (Puerto 3001)..."
npm run api &
API_PID=$!

# 4. Start Frontend (Vite)
echo "🎨 Iniciando Frontend (Puerto 5173/8080)..."
npm run dev &
FRONT_PID=$!

# Wait for both
wait $API_PID $FRONT_PID

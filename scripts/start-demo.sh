#!/bin/bash

# Resolve paths dynamically
BUN_CMD=${BUN_CMD:-bun}
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd -W 2>/dev/null || pwd)
WSL_ROOT=$(wsl bash -c "wslpath -a '$PROJECT_ROOT'")
WSL_ROOT=$(echo "$WSL_ROOT" | tr -d '\r')

# Start the Mock Bank API (Reserves)
echo "🏦 Starting Mock Bank API on port 3002..."
wsl $BUN_CMD run "$WSL_ROOT/backend/src/mock-bank-api.ts" &
BANK_PID=$!

# Wait for Bank to start
sleep 2

# Start the Main Backend API (Gateway/Registry)
echo "🚀 Starting BSKT Backend on port 3001..."
wsl $BUN_CMD run "$WSL_ROOT/backend/src/server.ts" &
BACKEND_PID=$!

echo "--------------------------------------------------"
echo "✅ BSKT Demo Environment is RUNNING!"
echo "--------------------------------------------------"
echo "📊 Bank Reserves: http://localhost:3002/reserves"
echo "📜 Basket Registry: http://localhost:3001/baskets"
echo "🧪 Health Check: http://localhost:3001/health"
echo "--------------------------------------------------"
echo "Press Ctrl+C to stop both servers."

# Handle shutdown
trap "kill $BANK_PID $BACKEND_PID; exit" INT
wait

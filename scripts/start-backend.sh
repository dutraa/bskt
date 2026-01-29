#!/bin/bash

# Start BSKT Backend API Server

echo "🚀 Starting BSKT Backend API Server..."

# Navigate to backend directory
cd "$(dirname "$0")/../backend" || exit 1

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please update it with your configuration."
        echo "   Edit backend/.env and add your RPC_URL and other settings."
        exit 1
    else
        echo "❌ .env.example not found!"
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server in development mode
echo "🔥 Starting server in development mode..."
npm run dev

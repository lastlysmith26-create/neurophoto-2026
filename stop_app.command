#!/bin/bash

# Script to stop NeuroPhoto backend and frontend processes

# Go to the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🛑 Stopping NeuroPhoto App..."

# Function to kill process on a port
kill_port() {
    local PORT=$1
    local NAME=$2
    local PID=$(lsof -ti :$PORT)
    
    if [ -n "$PID" ]; then
        echo "Found $NAME running on port $PORT (PID: $PID). Killing..."
        kill -9 $PID
        echo "✅ $NAME stopped."
    else
        echo "⚠️  $NAME not found consistently on port $PORT."
    fi
}

# Stop Backend (Port 3001)
kill_port 3001 "Backend"

# Stop Frontend (Port 5173 - default Vite port)
kill_port 5173 "Frontend"
# Also try 5174 just in case
kill_port 5174 "Frontend (Alt Port)"

echo "Done! If terminal windows are still open, you can close them safely."

#!/bin/bash

# Get port from environment variable or default to 8000
PORT=${PORT:-8000}

echo "Starting AZSpace Backend API on port $PORT"

# Start the FastAPI server
uvicorn app:app --host 0.0.0.0 --port $PORT --workers 1

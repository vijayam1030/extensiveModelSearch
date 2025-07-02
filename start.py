#!/usr/bin/env python3
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Direct import and run
from main import app
import uvicorn

if __name__ == "__main__":
    print("Starting AI Model Comparison Tool...")
    print("Make sure Ollama is running: ollama serve")
    print("Server will be available at: http://localhost:8000")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        log_level="info"
    )
#!/usr/bin/env python3
import os
import sys

def main():
    # Add backend directory to Python path
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    sys.path.insert(0, backend_dir)
    
    # Run the FastAPI server
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
import subprocess
import requests
import json

def check_ollama_status():
    """Check Ollama status and running models"""
    print("🔍 Checking Ollama status...")
    
    # Check if Ollama is running
    try:
        result = subprocess.run(['ollama', 'ps'], capture_output=True, text=True)
        print(f"📊 Running models:\n{result.stdout}")
        
        if result.stdout.strip() == "NAME\tID\tSIZE\tPROCESSOR\tUNTIL":
            print("✅ No models currently running")
        
    except FileNotFoundError:
        print("❌ Ollama not found. Make sure it's installed and in PATH")
        return
    
    # Check available models
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True)
        print(f"📋 Available models:\n{result.stdout}")
    except:
        print("❌ Could not list models")
    
    # Test API connection
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            print(f"🌐 API accessible - {len(models)} models found via API")
        else:
            print(f"⚠️ API returned status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to Ollama API: {e}")

def kill_stuck_models():
    """Kill any stuck model processes"""
    print("\n🔧 Checking for stuck processes...")
    try:
        # This will stop all running models
        subprocess.run(['ollama', 'stop', '--all'], capture_output=True)
        print("✅ Stopped all running models")
    except:
        print("❌ Could not stop models")

if __name__ == "__main__":
    check_ollama_status()
    
    response = input("\n🤔 Kill stuck models? (y/N): ")
    if response.lower() == 'y':
        kill_stuck_models()
        print("\n📊 Status after cleanup:")
        check_ollama_status()
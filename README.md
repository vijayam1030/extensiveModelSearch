# AI Model Comparison Tool

A web application that allows you to submit questions to multiple local AI models simultaneously and compare their streaming responses in real-time.

## Features

- Submit questions to multiple Ollama models simultaneously
- Real-time streaming responses
- Side-by-side comparison of model outputs
- Summary and evaluation of responses
- Clean, responsive web interface

## Prerequisites

1. **Python 3.8+**
2. **Ollama** installed and running on your system
3. **Local AI models** downloaded via Ollama

### Install Ollama Models

Make sure you have the following models installed:

```bash
ollama pull llama3
ollama pull llama3.1
ollama pull codellama
ollama pull mistral
ollama pull gemma
ollama pull phi3
ollama pull qwen2
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Ollama service:**
   ```bash
   ollama serve
   ```

3. **Run the application:**
   ```bash
   python run.py
   ```

4. **Open your browser:**
   Go to `http://localhost:8000`

## Usage

1. Enter your question in the text area
2. Click "Ask All Models" or press Ctrl+Enter
3. Watch as responses stream in real-time from each model
4. Review the summary at the bottom comparing all responses

## Configuration

To modify which models are used, edit the `models` dictionary in `backend/main.py`:

```python
self.models = {
    "llama3": {
        "provider": "ollama",
        "model_name": "llama3"
    },
    # Add or remove models as needed
}
```

## Troubleshooting

- **Connection errors**: Ensure Ollama is running (`ollama serve`)
- **Model not found**: Make sure the model is installed (`ollama pull <model-name>`)
- **Port conflicts**: Change the port in `run.py` if 8000 is already in use

## Architecture

- **Backend**: FastAPI with WebSocket support for streaming
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Models**: Local Ollama models via HTTP API
- **Streaming**: Real-time updates via WebSocket connections
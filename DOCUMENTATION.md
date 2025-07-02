# AI Model Comparison Tool - Documentation

## Overview

The AI Model Comparison Tool is a comprehensive web application that allows users to submit questions to multiple local AI models simultaneously and compare their streaming responses in real-time. Built with a FastAPI backend and vanilla JavaScript frontend, it provides an intuitive interface for evaluating and analyzing responses from different AI models.

## 🛠️ Tools and Technologies Used

### Backend Technologies
- **FastAPI** (v0.104.1) - Modern, fast web framework for building APIs
- **Uvicorn** (v0.24.0) - ASGI server for running FastAPI applications
- **HTTPX** (v0.26.0) - Async HTTP client for making requests to Ollama API
- **Pydantic** (v2.5.3) - Data validation and serialization
- **WebSockets** (v12.0) - Real-time bi-directional communication
- **Python-multipart** (v0.0.6) - Form data parsing
- **AIOFiles** (v23.2.1) - Async file operations
- **Jinja2** (v3.1.4) - Template engine for web rendering

### Frontend Technologies
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with gradients, animations, and responsive design
- **JavaScript (ES6+)** - Client-side logic and WebSocket handling
- **WebSocket API** - Real-time communication with backend
- **Fetch API** - HTTP requests for REST endpoints

### AI Model Integration
- **Ollama** - Local AI model runtime and management
- **Supported Models**:
  - LLaMA 3 / 3.1 / 3.2
  - Code Llama
  - Mistral
  - Gemma / Gemma 2 / Gemma 3
  - Phi3
  - Qwen 2.5 / 3
  - DeepSeek R1
  - TinyLlama
  - And any other Ollama-compatible models

### Development Tools
- **Git** - Version control
- **Python Virtual Environment** - Dependency isolation
- **WSL2** - Windows Subsystem for Linux (for Windows users)

## 🏗️ Architecture and Workflow

### System Architecture

```
┌─────────────────┐    WebSocket/HTTP    ┌──────────────────┐    HTTP API    ┌─────────────┐
│   Frontend      │◄────────────────────►│   FastAPI        │◄──────────────►│   Ollama    │
│   (Browser)     │                      │   Backend        │                │   Runtime   │
└─────────────────┘                      └──────────────────┘                └─────────────┘
         │                                         │                                  │
         │                                         │                                  │
    ┌─────────┐                              ┌─────────────┐                   ┌─────────────┐
    │   UI    │                              │  Session    │                   │  AI Models  │
    │ Control │                              │ Management  │                   │   (Local)   │
    └─────────┘                              └─────────────┘                   └─────────────┘
```

### Data Flow

1. **User Input**: User enters question and selects preferences
2. **Session Creation**: Frontend generates unique session ID
3. **WebSocket Connection**: Establishes real-time communication
4. **Request Processing**: Backend processes request with enhanced prompts
5. **Model Execution**: Parallel/batch/sequential processing of models
6. **Streaming Response**: Real-time streaming of model outputs
7. **Response Analysis**: Automatic evaluation and summary generation
8. **Meta-Summary**: Best model generates comprehensive analysis

### Processing Modes

#### 1. Batch Processing (Default)
- **Workflow**: Processes models in groups of 3
- **Advantages**: Balanced performance and resource usage
- **Use Case**: General purpose, most reliable

#### 2. Parallel Processing
- **Workflow**: All models process simultaneously
- **Advantages**: Fastest completion time
- **Use Case**: Powerful hardware, speed priority

#### 3. Sequential Processing
- **Workflow**: One model at a time
- **Advantages**: Most stable, lowest resource usage
- **Use Case**: Limited resources, maximum reliability

### Response Length Control

The system supports 5 preset lengths plus custom:

- **Brief**: 1-2 sentences (~100 tokens)
- **Short**: 3-5 sentences (~200 tokens)
- **Medium**: 1-2 paragraphs (~500 tokens) [Default]
- **Long**: 3-4 paragraphs (~800 tokens)
- **Detailed**: 5+ paragraphs (~1200 tokens)
- **Custom**: User-defined line count

### Session Management

Each question gets a unique session ID to prevent cross-contamination:
- Session ID format: `timestamp + random_string`
- All responses tagged with session ID
- Frontend ignores responses from previous sessions
- Session invalidation on stop/error

## 🚀 How to Run the Application

### Prerequisites

1. **System Requirements**:
   - Python 3.8 or higher
   - 8GB+ RAM recommended
   - Modern web browser
   - Internet connection (for initial setup)

2. **Install Ollama**:
   ```bash
   # On Linux/macOS
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # On Windows
   # Download from https://ollama.ai/download
   ```

3. **Install AI Models**:
   ```bash
   # Essential models (choose based on your hardware)
   ollama pull llama3.2          # ~2GB
   ollama pull mistral           # ~4GB
   ollama pull phi3              # ~2GB
   ollama pull gemma2            # ~5GB
   
   # Optional additional models
   ollama pull llama3.1          # ~5GB
   ollama pull codellama         # ~7GB
   ollama pull qwen2.5           # ~4GB
   ollama pull deepseek-r1       # ~8GB
   ```

### Installation Steps

1. **Clone/Download the Project**:
   ```bash
   cd /path/to/your/projects
   # If using git:
   git clone <repository-url> askqformodels
   cd askqformodels
   ```

2. **Set Up Python Environment**:
   ```bash
   # Create virtual environment
   python3 -m venv venv
   
   # Activate virtual environment
   # On Linux/macOS:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start Ollama Service**:
   ```bash
   # In a separate terminal
   ollama serve
   ```

2. **Start the Application**:
   ```bash
   # Activate virtual environment if not already active
   source venv/bin/activate  # Linux/macOS
   # or
   venv\Scripts\activate     # Windows
   
   # Run the application
   python start.py
   ```

3. **Access the Web Interface**:
   - Open your web browser
   - Navigate to `http://localhost:8000`
   - You should see the "Ready to Compare AI Models" screen

### Verification Steps

1. **Check Model Availability**:
   - The top of the interface shows "X models available: [model names]"
   - Click "Refresh Models" if models don't appear

2. **Test Basic Functionality**:
   - Enter a simple question like "What is 2+2?"
   - Select "Brief" response length
   - Click "Ask All Models"
   - You should see streaming responses from available models

## 🎮 Usage Instructions

### Basic Usage

1. **Enter Your Question**: Type your question in the text area
2. **Configure Settings**:
   - **Processing Mode**: Choose batch, parallel, or sequential
   - **Response Length**: Select from brief to detailed
3. **Submit**: Click "Ask All Models" or press Ctrl+Enter
4. **Monitor Progress**: Watch real-time batch status updates
5. **Review Results**: Compare individual model responses
6. **Analyze Summary**: Read the comprehensive analysis

### Advanced Features

#### Stop Processing
- Click the red "Stop Processing" button to halt all models
- Useful for long-running queries or to change questions
- System automatically returns to ready state after 3 seconds

#### Response Length Customization
- Use "Custom" option to specify exact line count
- Adjust based on your specific needs
- Different models may interpret length differently

#### Model Refresh
- Click "Refresh Models" to detect newly installed Ollama models
- Useful after installing new models without restarting

### Understanding the Output

#### Individual Model Cards
- **Status Indicators**:
  - 🔵 Blue: Processing
  - 🟢 Green: Streaming
  - ✅ Blue: Completed
  - ❌ Red: Error/Stopped

#### Summary Sections
1. **Comprehensive Analysis**: Generated by the best-performing model
2. **Best Response Summary**: Basic comparison and recommendation

## 🔧 Configuration and Customization

### Model Configuration
Models are automatically detected from Ollama. To add/remove models:
```bash
# Add new model
ollama pull model-name

# Remove model
ollama rm model-name

# Refresh in app
# Click "Refresh Models" button in the web interface
```

### Performance Tuning

#### For Better Performance:
- Use "Batch" mode (default)
- Choose shorter response lengths
- Install faster models (phi3, tinyllama)

#### For Maximum Quality:
- Use "Parallel" mode if hardware allows
- Choose "Detailed" response length
- Install larger models (llama3.1, codellama)

#### For Resource-Constrained Systems:
- Use "Sequential" mode
- Choose "Brief" or "Short" response length
- Use smaller models (tinyllama, phi3)

### Environment Variables
The application supports environment variables for configuration:
```bash
# Port configuration (default: 8000)
export PORT=8080

# Ollama API URL (default: http://localhost:11434)
export OLLAMA_URL=http://custom-ollama:11434
```

## 🐛 Troubleshooting

### Common Issues

#### "No models available"
- **Cause**: Ollama not running or no models installed
- **Solution**: 
  ```bash
  ollama serve  # Start Ollama
  ollama list   # Check installed models
  ollama pull llama3.2  # Install a model
  ```

#### "Failed to connect to server"
- **Cause**: Port conflict or firewall issues
- **Solution**: 
  - Check if port 8000 is free: `netstat -an | grep 8000`
  - Try different port in `start.py`
  - Check firewall settings

#### Models not responding
- **Cause**: Insufficient memory or model issues
- **Solution**:
  - Check available RAM: models need 2-8GB each
  - Try smaller models or sequential mode
  - Restart Ollama service

#### WebSocket connection issues
- **Cause**: Browser compatibility or proxy issues
- **Solution**:
  - Use modern browser (Chrome, Firefox, Safari)
  - Disable VPN/proxy temporarily
  - Check browser console for errors

### Performance Issues

#### Slow responses
- Switch to faster models (phi3, tinyllama)
- Use shorter response lengths
- Reduce number of parallel models

#### High memory usage
- Use sequential processing mode
- Install fewer models
- Monitor system resources

### Debug Mode
Enable detailed logging by modifying `start.py`:
```python
uvicorn.run(
    app, 
    host="0.0.0.0", 
    port=8000, 
    log_level="debug"  # Add this line
)
```

## 🔒 Security Considerations

### Local Operation
- All processing is done locally
- No data sent to external services
- Models run on your hardware

### Network Security
- Application binds to localhost by default
- WebSocket connections are local only
- No external API dependencies

### Data Privacy
- Questions and responses stay on your machine
- No logging of sensitive information
- Session data cleared on restart

## 📁 Project Structure

```
askqformodels/
├── backend/
│   └── main.py              # FastAPI application
├── frontend/
│   └── index.html           # Web interface
├── requirements.txt         # Python dependencies
├── start.py                 # Application launcher
├── run.py                   # Alternative launcher
├── check_ollama.py         # Ollama diagnostic tool
├── .gitignore              # Git ignore rules
├── README.md               # Quick start guide
└── DOCUMENTATION.md        # This file
```

### Key Files

- **`backend/main.py`**: Core FastAPI application with WebSocket handling
- **`frontend/index.html`**: Complete web interface with CSS and JavaScript
- **`start.py`**: Main application launcher with proper path handling
- **`requirements.txt`**: All Python dependencies with versions
- **`check_ollama.py`**: Diagnostic tool for troubleshooting Ollama issues

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Follow PEP 8 for Python code
- Use meaningful variable names
- Add comments for complex logic
- Maintain backward compatibility

## 📄 License

This project is provided as-is for educational and research purposes. Please ensure compliance with the license terms of all included AI models and dependencies.

## 🆘 Support

For issues and questions:
1. Check this documentation
2. Review the troubleshooting section
3. Run `python check_ollama.py` for diagnostics
4. Check Ollama documentation at https://ollama.ai/
5. Create an issue in the project repository

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Compatibility**: Python 3.8+, Modern Browsers, Ollama 0.1.0+
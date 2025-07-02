from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import asyncio
import json
import httpx
import os

app = FastAPI()

class QuestionRequest(BaseModel):
    question: str

class ModelConfig:
    def __init__(self):
        self.models = {}
        self.load_available_models()
    
    async def get_available_models(self):
        """Get list of available Ollama models"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("http://localhost:11434/api/tags", timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    return [model["name"] for model in data.get("models", [])]
                else:
                    print(f"Failed to get models: {response.status_code}")
                    return []
        except Exception as e:
            print(f"Error getting available models: {e}")
            return []
    
    def load_available_models(self):
        """Load available models synchronously at startup"""
        import asyncio
        try:
            # Try to get existing event loop, or create a new one
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If loop is already running, schedule the coroutine
                    task = asyncio.create_task(self._load_models_async())
                    return
            except RuntimeError:
                # No event loop exists, create a new one
                pass
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            available_models = loop.run_until_complete(self.get_available_models())
            loop.close()
            
            for model_name in available_models:
                # Clean model name (remove version tags if present)
                clean_name = model_name.split(':')[0]
                self.models[clean_name] = {
                    "provider": "ollama",
                    "model_name": model_name,
                    "display_name": clean_name
                }
            
            print(f"Available models: {list(self.models.keys())}")
        except Exception as e:
            print(f"Error loading models: {e}")
            # Fallback to empty models dict
            self.models = {}
    
    async def _load_models_async(self):
        """Async helper for loading models"""
        try:
            available_models = await self.get_available_models()
            for model_name in available_models:
                clean_name = model_name.split(':')[0]
                self.models[clean_name] = {
                    "provider": "ollama",
                    "model_name": model_name,
                    "display_name": clean_name
                }
            print(f"Available models: {list(self.models.keys())}")
        except Exception as e:
            print(f"Error loading models: {e}")

model_config = ModelConfig()

@app.get("/api/models")
async def get_models():
    """Get list of available models"""
    return {
        "models": [
            {
                "name": config["display_name"],
                "full_name": config["model_name"],
                "provider": config["provider"]
            }
            for config in model_config.models.values()
        ]
    }

@app.post("/api/refresh-models")
async def refresh_models():
    """Refresh the list of available models"""
    available_models = await model_config.get_available_models()
    model_config.models.clear()
    
    for model_name in available_models:
        clean_name = model_name.split(':')[0]
        model_config.models[clean_name] = {
            "provider": "ollama",
            "model_name": model_name,
            "display_name": clean_name
        }
    
    return {
        "message": "Models refreshed successfully",
        "models": list(model_config.models.keys())
    }

async def stream_ollama_response(model_name: str, question: str, websocket: WebSocket, display_name: str = None):
    display_name = display_name or model_name.split(':')[0]  # Use clean name for display
    try:
        await websocket.send_text(json.dumps({
            "model": display_name,
            "status": "streaming",
            "content": ""
        }))
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Set a reasonable timeout for the request
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": model_name,
                    "prompt": question,
                    "stream": True,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "num_predict": 500  # Limit response length
                    }
                },
                timeout=120.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama API returned status {response.status_code}")
            
            full_response = ""
            line_count = 0
            
            async for line in response.aiter_lines():
                if line.strip():  # Only process non-empty lines
                    try:
                        data = json.loads(line)
                        
                        if "response" in data and data["response"]:
                            content = data["response"]
                            full_response += content
                            line_count += 1
                            
                            # Send update every few chunks to avoid flooding
                            if line_count % 3 == 0 or data.get("done", False):
                                await websocket.send_text(json.dumps({
                                    "model": display_name,
                                    "status": "streaming",
                                    "content": content,
                                    "full_response": full_response
                                }))
                        
                        if data.get("done", False):
                            break
                            
                        # Safety check - don't let responses get too long
                        if len(full_response) > 10000:
                            full_response += "\n\n[Response truncated - maximum length reached]"
                            break
                            
                    except json.JSONDecodeError:
                        # Skip malformed JSON lines
                        continue
            
            await websocket.send_text(json.dumps({
                "model": display_name,
                "status": "completed",
                "content": "",
                "full_response": full_response if full_response else "No response received"
            }))
            
            return full_response
            
    except asyncio.TimeoutError:
        error_msg = f"Model {display_name} timed out after 2 minutes"
        await websocket.send_text(json.dumps({
            "model": display_name,
            "status": "error",
            "error": error_msg
        }))
        return f"Error: {error_msg}"
    except Exception as e:
        error_msg = str(e)
        await websocket.send_text(json.dumps({
            "model": display_name,
            "status": "error",
            "error": error_msg
        }))
        return f"Error: {error_msg}"

async def run_model_with_timeout(model_name: str, question: str, websocket: WebSocket, display_name: str = None, timeout: int = 180):
    """Run a single model with individual timeout"""
    display_name = display_name or model_name.split(':')[0]
    try:
        return await asyncio.wait_for(
            stream_ollama_response(model_name, question, websocket, display_name),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        error_msg = f"Model {display_name} timed out after {timeout} seconds"
        await websocket.send_text(json.dumps({
            "model": display_name,
            "status": "error",
            "error": error_msg
        }))
        return f"Error: {error_msg}"

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("WebSocket connection attempt")
    await websocket.accept()
    print("WebSocket connection accepted")
    
    try:
        while True:
            print("Waiting for message...")
            data = await websocket.receive_text()
            print(f"Received data: {data}")
            
            try:
                request_data = json.loads(data)
                question = request_data.get("question", "").strip()
                
                if not question:
                    await websocket.send_text(json.dumps({
                        "status": "error",
                        "message": "No question provided"
                    }))
                    continue
                
                print(f"Processing question: {question}")
                
                # Limit to first 3 models to avoid overwhelming the system
                available_models = list(model_config.models.items())[:3]
                print(f"Selected models: {[(name, config['model_name']) for name, config in available_models]}")
                
                if not available_models:
                    await websocket.send_text(json.dumps({
                        "status": "error",
                        "message": "No models available"
                    }))
                    continue
                
                print(f"Using models: {[model[0] for model in available_models]}")
                
                # Send initial status
                await websocket.send_text(json.dumps({
                    "status": "starting",
                    "message": f"Starting processing with {len(available_models)} models"
                }))
                
                # Run models in parallel with individual timeouts
                tasks = []
                for model_name, config in available_models:
                    print(f"Starting task for model: {config['model_name']} (display: {model_name})")
                    task = asyncio.create_task(
                        run_model_with_timeout(config["model_name"], question, websocket, display_name=model_name, timeout=120)
                    )
                    tasks.append(task)
                
                # Wait for all tasks to complete or timeout
                print("Waiting for all tasks to complete...")
                results = await asyncio.gather(*tasks, return_exceptions=True)
                print(f"All tasks completed. Results: {len(results)}")
                
                # Send completion message
                completed_count = sum(1 for r in results if not isinstance(r, Exception) and not str(r).startswith("Error:"))
                await websocket.send_text(json.dumps({
                    "status": "all_completed",
                    "message": f"Processing complete. {completed_count}/{len(available_models)} models responded successfully."
                }))
                
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                await websocket.send_text(json.dumps({
                    "status": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                print(f"Processing error: {e}")
                await websocket.send_text(json.dumps({
                    "status": "error",
                    "message": f"Processing error: {str(e)}"
                }))
    
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_text(json.dumps({
                "status": "error", 
                "message": f"Server error: {str(e)}"
            }))
        except:
            pass

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
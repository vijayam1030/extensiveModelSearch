from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import httpx
import os

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200", "http://172.31.242.191:4200", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

def create_enhanced_prompt(question: str, response_length: str, custom_length: str = "10") -> str:
    """Create an enhanced prompt with specific length instructions"""
    
    length_instructions = {
        "brief": "Please provide a brief response in 1-2 sentences only.",
        "short": "Please provide a short response in 3-5 sentences.",
        "medium": "Please provide a medium-length response in 1-2 paragraphs.",
        "long": "Please provide a detailed response in 3-4 paragraphs.",
        "detailed": "Please provide a comprehensive and detailed response in 5 or more paragraphs.",
        "custom": f"Please provide a response that is approximately {custom_length} lines long."
    }
    
    instruction = length_instructions.get(response_length, length_instructions["medium"])
    
    # Create the enhanced prompt
    enhanced_prompt = f"""{instruction}

Question: {question}

Please answer the question above following the length requirement specified."""
    
    return enhanced_prompt

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

@app.post("/api/meta-summary")
async def generate_meta_summary(request: dict):
    """Generate a comprehensive summary using the best model"""
    from fastapi.responses import StreamingResponse
    
    try:
        model_name = request.get("model")
        prompt = request.get("prompt")
        
        if not model_name or not prompt:
            return {"error": "Missing model or prompt"}
        
        # Find the full model name
        model_config_entry = None
        for config in model_config.models.values():
            if config["display_name"] == model_name:
                model_config_entry = config
                break
        
        if not model_config_entry:
            return {"error": f"Model {model_name} not found"}
        
        full_model_name = model_config_entry["model_name"]
        
        async def generate_stream():
            try:
                async with httpx.AsyncClient(timeout=180.0) as client:
                    response = await client.post(
                        "http://localhost:11434/api/generate",
                        json={
                            "model": full_model_name,
                            "prompt": prompt,
                            "stream": True,
                            "options": {
                                "temperature": 0.3,  # Lower temperature for more focused analysis
                                "top_p": 0.9,
                                "num_predict": 1500,  # Longer for comprehensive analysis
                            }
                        },
                        timeout=180.0
                    )
                    
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': f'API returned {response.status_code}'})}\n\n"
                        return
                    
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                if "response" in data and data["response"]:
                                    yield f"data: {json.dumps({'content': data['response']})}\n\n"
                                if data.get("done", False):
                                    yield f"data: {json.dumps({'done': True})}\n\n"
                                    break
                            except json.JSONDecodeError:
                                continue
                                
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        return {"error": str(e)}

async def stream_ollama_response(model_name: str, question: str, websocket: WebSocket, display_name: str = None, response_length: str = "medium", session_id: str = ""):
    display_name = display_name or model_name.split(':')[0]  # Use clean name for display
    
    # Set appropriate token limits based on response length
    token_limits = {
        "brief": 100,
        "short": 200,
        "medium": 500,
        "long": 800,
        "detailed": 1200,
        "custom": 600  # Default for custom, can be adjusted
    }
    
    num_predict = token_limits.get(response_length, 500)
    
    try:
        await websocket.send_text(json.dumps({
            "model": display_name,
            "status": "streaming",
            "content": "",
            "sessionId": session_id
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
                        "num_predict": num_predict,
                        "stop": ["\n\n\n", "Question:", "---"]  # Stop at excessive whitespace or new questions
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
                                    "full_response": full_response,
                                    "sessionId": session_id
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
                "full_response": full_response if full_response else "No response received",
                "sessionId": session_id
            }))
            
            return full_response
            
    except asyncio.TimeoutError:
        error_msg = f"Model {display_name} timed out after 2 minutes"
        await websocket.send_text(json.dumps({
            "model": display_name,
            "status": "error",
            "error": error_msg,
            "sessionId": session_id
        }))
        return f"Error: {error_msg}"
    except Exception as e:
        error_msg = str(e)
        await websocket.send_text(json.dumps({
            "model": display_name,
            "status": "error",
            "error": error_msg,
            "sessionId": session_id
        }))
        return f"Error: {error_msg}"

async def run_model_with_timeout(model_name: str, question: str, websocket: WebSocket, display_name: str = None, response_length: str = "medium", session_id: str = "", timeout: int = 180):
    """Run a single model with individual timeout"""
    display_name = display_name or model_name.split(':')[0]
    try:
        return await asyncio.wait_for(
            stream_ollama_response(model_name, question, websocket, display_name, response_length, session_id),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        error_msg = f"Model {display_name} timed out after {timeout} seconds"
        await websocket.send_text(json.dumps({
            "model": display_name,
            "status": "error",
            "error": error_msg,
            "sessionId": session_id
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
                processing_mode = request_data.get("mode", "batch")  # batch, parallel, sequential
                response_length = request_data.get("responseLength", "medium")
                custom_length = request_data.get("customLength", "10")
                session_id = request_data.get("sessionId", "")
                
                if not question:
                    await websocket.send_text(json.dumps({
                        "status": "error",
                        "message": "No question provided",
                        "sessionId": session_id
                    }))
                    continue
                
                # Create enhanced prompt with length instructions
                enhanced_question = create_enhanced_prompt(question, response_length, custom_length)
                print(f"Processing question: {question} (mode: {processing_mode}, length: {response_length})")
                
                # Get all available models
                all_models = list(model_config.models.items())
                
                if processing_mode == "parallel":
                    # Run all models in parallel
                    available_models = all_models
                elif processing_mode == "sequential":
                    # Run models one by one
                    available_models = all_models
                else:  # batch mode (default)
                    # Run in batches of 3
                    available_models = all_models
                
                print(f"Selected models: {[(name, config['model_name']) for name, config in available_models]}")
                print(f"Total models to process: {len(available_models)}")
                
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
                    "message": f"Starting processing with {len(available_models)} models in {processing_mode} mode",
                    "sessionId": session_id
                }))
                
                if processing_mode == "sequential":
                    # Process models one by one
                    completed_count = 0
                    for i, (model_name, config) in enumerate(available_models):
                        await websocket.send_text(json.dumps({
                            "status": "batch_update",
                            "message": f"Processing model {i+1}/{len(available_models)}: {model_name}"
                        }))
                        
                        result = await run_model_with_timeout(
                            config["model_name"], enhanced_question, websocket, 
                            display_name=model_name, response_length=response_length, session_id=session_id, timeout=120
                        )
                        
                        if not isinstance(result, Exception) and not str(result).startswith("Error:"):
                            completed_count += 1
                    
                    await websocket.send_text(json.dumps({
                        "status": "all_completed",
                        "message": f"Sequential processing complete. {completed_count}/{len(available_models)} models responded successfully.",
                        "sessionId": session_id
                    }))
                
                elif processing_mode == "batch":
                    # Process in batches of 3
                    batch_size = 3
                    total_completed = 0
                    
                    for batch_idx in range(0, len(available_models), batch_size):
                        batch = available_models[batch_idx:batch_idx + batch_size]
                        batch_num = (batch_idx // batch_size) + 1
                        total_batches = (len(available_models) + batch_size - 1) // batch_size
                        
                        await websocket.send_text(json.dumps({
                            "status": "batch_update",
                            "message": f"Processing batch {batch_num}/{total_batches}: {', '.join([m[0] for m in batch])}"
                        }))
                        
                        # Run this batch in parallel
                        tasks = []
                        for model_name, config in batch:
                            print(f"Starting task for model: {config['model_name']} (display: {model_name})")
                            task = asyncio.create_task(
                                run_model_with_timeout(config["model_name"], enhanced_question, websocket, display_name=model_name, response_length=response_length, session_id=session_id, timeout=120)
                            )
                            tasks.append(task)
                        
                        # Wait for this batch to complete
                        results = await asyncio.gather(*tasks, return_exceptions=True)
                        batch_completed = sum(1 for r in results if not isinstance(r, Exception) and not str(r).startswith("Error:"))
                        total_completed += batch_completed
                        
                        print(f"Batch {batch_num} completed: {batch_completed}/{len(batch)} models succeeded")
                    
                    await websocket.send_text(json.dumps({
                        "status": "all_completed",
                        "message": f"Batch processing complete. {total_completed}/{len(available_models)} models responded successfully.",
                        "sessionId": session_id
                    }))
                
                else:  # parallel mode
                    # Run all models in parallel
                    tasks = []
                    for model_name, config in available_models:
                        print(f"Starting task for model: {config['model_name']} (display: {model_name})")
                        task = asyncio.create_task(
                            run_model_with_timeout(config["model_name"], enhanced_question, websocket, display_name=model_name, response_length=response_length, session_id=session_id, timeout=120)
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
                        "message": f"Parallel processing complete. {completed_count}/{len(available_models)} models responded successfully.",
                        "sessionId": session_id
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
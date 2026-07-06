import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from dotenv import load_dotenv
import uvicorn

# Load local environment parameters
load_dotenv()

from agents import ManagerAgent

app = FastAPI(title="AI Sales Intelligence Multi-Agent Service", version="1.0.0")

class AnalyzeRequest(BaseModel):
    data: List[Dict[str, Any]]

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Sales Intelligence Python Microservice",
        "has_gemini_key": bool(os.getenv("GEMINI_API_KEY"))
    }

@app.post("/api/agents/analyze")
def run_agents(payload: AnalyzeRequest):
    if not payload.data:
        raise HTTPException(status_code=400, detail="Data payload must contain customer records")
        
    try:
        manager = ManagerAgent()
        results = manager.process_crm_data(payload.data)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", 8000))
    print(f"Starting FastAPI AI Microservice on port {port}...")
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)

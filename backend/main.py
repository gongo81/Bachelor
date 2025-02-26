from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str

OLLAMA_API_URL = "http://localhost:11434/api/generate"

@app.post("/api/ask")
async def ask_llm(request: QuestionRequest):
    try:
        # Use the correct model name from `ollama list`
        payload = {
            "model": "deepseek-r1:14b",  # UPDATED MODEL NAME
            "prompt": request.question,
            "stream": False
        }

        response = requests.post(OLLAMA_API_URL, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Ollama API error")

        data = response.json()
        answer = data.get("response", "No response received from Ollama.")

        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

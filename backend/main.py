import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import vertexai
from vertexai.generative_models import GenerativeModel, Content, Part

load_dotenv()

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
LOCATION = os.getenv("GCP_LOCATION")

vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(
        "gemini-2.5-flash-lite-preview-09-2025",
        system_instruction="You are a concise technical assistant."
)

app = FastAPI()

app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    history: list

@app.post("/api/chat")
async def chat(req: ChatRequest):
    history = [
            Content(
                role=msg["role"],
                parts=[Part.from_text(msg["content"])]
            )
            for msg in req.history
    ]

    chat_session = model.start_chat(history=history)

    def stream():
        for chunk in chat_session.send_message(req.message, stream=True):
            yield chunk.text
    return StreamingResponse(stream(), media_type="text/plain")

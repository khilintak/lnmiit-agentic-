"""
FocusMate Local - FastAPI Backend Server
Serves both the REST Agent APIs and the Single-Window Modern Desk Frontend.
"""

import os
import time
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.ollama_client import LocalLLMClient
from app.agent import FocusMateAgent
from app.benchmark import run_3_repeat_runs, HARDWARE_SPECS

app = FastAPI(
    title="FocusMate Local - The Guided Work Desk",
    description="All-in-One Guided Study & Work Desk for ADHD / Deep Work. Single-Window Workspace with Local AI.",
    version="1.0.0"
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agent
llm_client = LocalLLMClient()
agent = FocusMateAgent(llm_client=llm_client)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class CatchAllRequest(BaseModel):
    input_text: str

class ChunkTextRequest(BaseModel):
    text: str
    source: Optional[str] = "Pasted Notes"

class UnstickRequest(BaseModel):
    question: str
    notes: Optional[str] = ""

class BreadcrumbSaveRequest(BaseModel):
    current_question_index: int
    current_question_title: str
    scratchpad_text: str
    completed_question_ids: List[str]
    session_title: Optional[str] = "Study Session"
    later_drawer_items: Optional[List[Dict[str, Any]]] = []

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/system-status")
def get_system_status():
    """Return local inference status, GPU details, and active model."""
    ollama_online = llm_client.is_available()
    models = llm_client.list_installed_models() if ollama_online else []
    return {
        "status": "online",
        "ollama_online": ollama_online,
        "active_model": llm_client.model if ollama_online else "Built-in Cognitive Engine",
        "installed_models": models,
        "hardware": HARDWARE_SPECS,
        "timestamp": time.time()
    }

@app.post("/api/catch-all")
def parse_catch_all(req: CatchAllRequest):
    """Universal Catch-All: Separates immediate study from later reminders."""
    try:
        return agent.parse_catch_all(req.input_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Extract and slice PDF into atomic, bite-sized questions."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    try:
        content = await file.read()
        chunks = agent.parse_pdf_to_chunks(content, filename=file.filename)
        return {
            "filename": file.filename,
            "total_chunks": len(chunks),
            "chunks": chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.post("/api/chunk-text")
def chunk_text(req: ChunkTextRequest):
    """Chunk raw assignment or question text into structured steps."""
    try:
        chunks = agent.chunk_text_to_questions(req.text, source=req.source)
        return {"total_chunks": len(chunks), "chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/unstick")
def unstick_me(req: UnstickRequest):
    """Generate ELI5 translation, fill-in-the-blank starter, and micro-steps."""
    try:
        return agent.generate_unstick_aid(req.question, current_notes=req.notes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/breadcrumb")
def get_breadcrumb():
    """Retrieve the last saved session breadcrumb."""
    bc = agent.get_breadcrumb()
    return {"has_breadcrumb": bc is not None, "breadcrumb": bc}

@app.post("/api/breadcrumb")
def save_breadcrumb(req: BreadcrumbSaveRequest):
    """Save mental breadcrumb state."""
    state = req.model_dump()
    result = agent.save_breadcrumb(state)
    return result

@app.post("/api/benchmark")
def run_benchmark():
    """Execute the mandatory 3-run repeat benchmark and return speed metrics."""
    return run_3_repeat_runs()

@app.post("/api/export")
def export_session(data: Dict[str, Any]):
    """Format completed questions and user answers into Markdown report."""
    title = data.get("session_title", "FocusMate Study Session")
    chunks = data.get("chunks", [])
    answers = data.get("answers", {})

    md = f"# {title}\n"
    md += f"*Exported by FocusMate Local on {time.strftime('%Y-%m-%d %H:%M:%S')}*\n\n"
    md += "---\n\n"

    for idx, c in enumerate(chunks, 1):
        q_id = c.get("id", f"q_{idx}")
        q_title = c.get("title", f"Question {idx}")
        q_body = c.get("body", "")
        ans = answers.get(q_id, "*No answer recorded.*")

        md += f"## {q_title}\n\n"
        md += f"**Problem Statement:**\n> {q_body}\n\n"
        md += f"**Student Solution / Notes:**\n```\n{ans}\n```\n\n"
        md += "---\n\n"

    return {"markdown": md}

# ---------------------------------------------------------------------------
# Mount Static Frontend
# ---------------------------------------------------------------------------
@app.get("/")
def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "FocusMate Local API is running. Place index.html in app/static."}

app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

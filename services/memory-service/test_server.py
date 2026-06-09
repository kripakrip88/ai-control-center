"""
Простой тестовый сервер для проверки API без Mem0
"""
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, Dict, List
import uvicorn

app = FastAPI(
    title="Memory Service API (Test Mode)",
    description="Test version without Mem0 dependency",
    version="1.0.0-test"
)

# Mock хранилище
memory_store = {}


class AddMemoryRequest(BaseModel):
    project_id: str
    content: str
    metadata: Optional[Dict] = None


class SearchMemoryRequest(BaseModel):
    project_id: str
    query: Optional[str] = None
    limit: int = 10


@app.get("/")
async def root():
    return {
        "service": "Memory Service (Test Mode)",
        "version": "1.0.0-test",
        "status": "running",
        "note": "This is a test version without Mem0"
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "test"}


@app.post("/api/memory/add")
async def add_memory(request: AddMemoryRequest):
    """Mock добавление памяти"""
    memory_id = f"{request.project_id}_{len(memory_store)}"
    memory_store[memory_id] = {
        "id": memory_id,
        "project_id": request.project_id,
        "content": request.content,
        "metadata": request.metadata or {}
    }
    return {
        "success": True,
        "data": {
            "memory_id": memory_id,
            "message": "Memory added (mock mode)"
        }
    }


@app.post("/api/memory/search")
async def search_memories(request: SearchMemoryRequest):
    """Mock поиск"""
    results = [
        mem for mem in memory_store.values()
        if mem["project_id"] == request.project_id
    ]
    return {
        "success": True,
        "data": results[:request.limit],
        "note": "Mock search - returns all memories for project"
    }


if __name__ == "__main__":
    print("🚀 Starting Memory Service (Test Mode)")
    print("📍 URL: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)

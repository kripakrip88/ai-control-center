from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn
import os

from .memory_manager import MemoryManager

app = FastAPI(
    title="Memory Service API",
    description="Vector memory service for AI assistants using Mem0 and Qdrant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

memory_manager = MemoryManager()


class AddMemoryRequest(BaseModel):
    project_id: str
    content: str
    metadata: Optional[Dict] = None


class SearchMemoryRequest(BaseModel):
    project_id: str
    query: Optional[str] = None
    limit: int = 10


class UpdateMemoryRequest(BaseModel):
    content: str


@app.get("/")
async def root():
    return {
        "service": "Memory Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/memory/add")
async def add_memory(request: AddMemoryRequest):
    """
    Добавить новое воспоминание для проекта.
    """
    try:
        result = memory_manager.add_memory(
            project_id=request.project_id,
            content=request.content,
            metadata=request.metadata
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/memory/search")
async def search_memories(request: SearchMemoryRequest):
    """
    Поиск воспоминаний по проекту (все или семантический поиск).
    """
    try:
        results = memory_manager.get_memories(
            project_id=request.project_id,
            query=request.query,
            limit=request.limit
        )
        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/memory/{memory_id}")
async def delete_memory(memory_id: str):
    """
    Удалить воспоминание по ID.
    """
    try:
        result = memory_manager.delete_memory(memory_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/memory/{memory_id}")
async def update_memory(memory_id: str, request: UpdateMemoryRequest):
    """
    Обновить содержимое воспоминания.
    """
    try:
        result = memory_manager.update_memory(memory_id, request.content)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

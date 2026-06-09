from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn
import os

from .simple_storage import SimpleMemoryStorage

app = FastAPI(
    title="Memory Service API",
    description="Simple vector memory service using Qdrant",
    version="2.0.0-minimal"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

storage = SimpleMemoryStorage()


class AddMemoryRequest(BaseModel):
    project_id: str
    content: str
    vector: Optional[List[float]] = None
    metadata: Optional[Dict] = None


class SearchMemoryRequest(BaseModel):
    project_id: str
    query: Optional[str] = None
    query_vector: Optional[List[float]] = None
    limit: int = 10


class UpdateMemoryRequest(BaseModel):
    content: str
    vector: Optional[List[float]] = None


@app.get("/")
async def root():
    return {
        "service": "Memory Service (Minimal)",
        "version": "2.0.0-minimal",
        "status": "running",
        "note": "Lightweight version without heavy ML dependencies"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/memory/add")
async def add_memory(request: AddMemoryRequest):
    """
    Добавить новое воспоминание.

    Если vector не указан - будет создан простой хеш-вектор.
    Для production используйте внешний embedding сервис.
    """
    try:
        result = storage.add_memory(
            project_id=request.project_id,
            content=request.content,
            vector=request.vector,
            metadata=request.metadata
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/memory/search")
async def search_memories(request: SearchMemoryRequest):
    """
    Поиск воспоминаний.

    Можно передать query_vector (рекомендуется) или query (создаст хеш-вектор).
    """
    try:
        results = storage.search_memories(
            project_id=request.project_id,
            query_vector=request.query_vector,
            query_text=request.query,
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
        result = storage.delete_memory(memory_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/memory/{memory_id}")
async def update_memory(memory_id: str, request: UpdateMemoryRequest):
    """
    Обновить содержимое воспоминания.
    """
    try:
        result = storage.update_memory(
            memory_id,
            request.content,
            request.vector
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

"""
Простое хранилище памяти без ML зависимостей.
Использует только Qdrant для векторного хранилища.
Embeddings генерируются внешним сервисом или клиентом.
"""
import os
from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import hashlib
import uuid


class SimpleMemoryStorage:
    """
    Упрощенное хранилище памяти без встроенных LLM и embeddings.
    Клиент должен передавать готовые векторы.
    """

    def __init__(self):
        self.client = QdrantClient(
            host=os.environ.get("QDRANT_HOST", "localhost"),
            port=int(os.environ.get("QDRANT_PORT", "6333"))
        )
        self.collection_name = "simple_memory"
        self._ensure_collection()

    def _ensure_collection(self):
        """Создать коллекцию если её нет"""
        try:
            collections = self.client.get_collections()
            collection_names = [c.name for c in collections.collections]

            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=384,  # Стандартный размер для sentence-transformers
                        distance=Distance.COSINE
                    )
                )
        except Exception as e:
            print(f"Error ensuring collection: {e}")

    def add_memory(
        self,
        project_id: str,
        content: str,
        vector: Optional[List[float]] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Добавить память.

        Args:
            project_id: ID проекта
            content: Текстовое содержимое
            vector: Вектор embeddings (если None - создается заглушка)
            metadata: Дополнительные метаданные
        """
        # Если вектор не передан - создаем простой хеш-вектор
        if vector is None:
            # Простая заглушка: хеш строки → вектор
            hash_int = int(hashlib.md5(content.encode()).hexdigest(), 16)
            vector = [(hash_int >> i) % 100 / 100.0 for i in range(384)]

        memory_id = str(uuid.uuid4())

        payload = {
            "project_id": project_id,
            "content": content,
            "metadata": metadata or {}
        }

        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=memory_id,
                    vector=vector,
                    payload=payload
                )
            ]
        )

        return {
            "id": memory_id,
            "project_id": project_id,
            "content": content,
            "metadata": metadata
        }

    def search_memories(
        self,
        project_id: str,
        query_vector: Optional[List[float]] = None,
        query_text: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        """
        Поиск воспоминаний.

        Args:
            project_id: ID проекта
            query_vector: Вектор запроса
            query_text: Текст запроса (если vector не передан)
            limit: Максимальное количество результатов
        """
        # Если вектор не передан - создаем из текста
        if query_vector is None and query_text:
            hash_int = int(hashlib.md5(query_text.encode()).hexdigest(), 16)
            query_vector = [(hash_int >> i) % 100 / 100.0 for i in range(384)]
        elif query_vector is None:
            # Если ничего не передано - возвращаем все
            return self.get_all_memories(project_id, limit)

        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter={
                "must": [
                    {
                        "key": "project_id",
                        "match": {"value": project_id}
                    }
                ]
            },
            limit=limit
        )

        return [
            {
                "id": str(result.id),
                "score": result.score,
                **result.payload
            }
            for result in results
        ]

    def get_all_memories(self, project_id: str, limit: int = 100) -> List[Dict]:
        """Получить все воспоминания проекта"""
        results = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter={
                "must": [
                    {
                        "key": "project_id",
                        "match": {"value": project_id}
                    }
                ]
            },
            limit=limit
        )

        return [
            {
                "id": str(point.id),
                **point.payload
            }
            for point in results[0]
        ]

    def delete_memory(self, memory_id: str) -> Dict:
        """Удалить память"""
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=[memory_id]
        )
        return {"id": memory_id, "deleted": True}

    def update_memory(
        self,
        memory_id: str,
        content: str,
        vector: Optional[List[float]] = None
    ) -> Dict:
        """Обновить содержимое памяти"""
        # Получаем текущую точку
        point = self.client.retrieve(
            collection_name=self.collection_name,
            ids=[memory_id]
        )

        if not point:
            raise ValueError(f"Memory {memory_id} not found")

        old_payload = point[0].payload

        # Создаем новый вектор если не передан
        if vector is None:
            hash_int = int(hashlib.md5(content.encode()).hexdigest(), 16)
            vector = [(hash_int >> i) % 100 / 100.0 for i in range(384)]

        # Обновляем
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                PointStruct(
                    id=memory_id,
                    vector=vector,
                    payload={
                        **old_payload,
                        "content": content
                    }
                )
            ]
        )

        return {
            "id": memory_id,
            "content": content
        }

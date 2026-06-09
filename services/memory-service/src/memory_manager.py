import os
from typing import List, Dict, Optional
from mem0 import Memory

class MemoryManager:
    """
    Управляет долговременной памятью для AI-ассистентов через Mem0 и Qdrant.
    """

    def __init__(self):
        config = {
            "llm": {
                "provider": "anthropic",
                "config": {
                    "model": "claude-sonnet-4-5",
                    "api_key": os.environ.get("ANTHROPIC_API_KEY"),
                }
            },
            "embedder": {
                "provider": "huggingface",
                "config": {
                    "model": "sentence-transformers/all-MiniLM-L6-v2"
                }
            },
            "vector_store": {
                "provider": "qdrant",
                "config": {
                    "host": os.environ.get("QDRANT_HOST", "localhost"),
                    "port": int(os.environ.get("QDRANT_PORT", "6333")),
                    "embedding_model_dims": 384
                }
            }
        }

        self.memory = Memory.from_config(config)

    def add_memory(self, project_id: str, content: str, metadata: Optional[Dict] = None) -> Dict:
        """
        Сохранить память для проекта.

        Args:
            project_id: Идентификатор проекта (user_id в Mem0)
            content: Текст для запоминания
            metadata: Дополнительные метаданные

        Returns:
            Результат сохранения
        """
        result = self.memory.add(content, user_id=project_id, metadata=metadata)
        return {
            "project_id": project_id,
            "content": content,
            "metadata": metadata,
            "result": result
        }

    def get_memories(self, project_id: str, query: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """
        Получить все воспоминания для проекта или найти по запросу.

        Args:
            project_id: Идентификатор проекта
            query: Поисковый запрос (если None - вернуть все)
            limit: Максимальное количество результатов

        Returns:
            Список воспоминаний
        """
        if query:
            # Семантический поиск
            results = self.memory.search(query, user_id=project_id, limit=limit)
        else:
            # Все воспоминания
            results = self.memory.get_all(filters={"user_id": project_id})

        return results.get("results", [])

    def delete_memory(self, memory_id: str) -> Dict:
        """
        Удалить конкретное воспоминание.

        Args:
            memory_id: ID воспоминания

        Returns:
            Результат удаления
        """
        result = self.memory.delete(memory_id)
        return {"memory_id": memory_id, "deleted": result}

    def update_memory(self, memory_id: str, content: str) -> Dict:
        """
        Обновить содержимое воспоминания.

        Args:
            memory_id: ID воспоминания
            content: Новое содержимое

        Returns:
            Результат обновления
        """
        result = self.memory.update(memory_id, content)
        return {"memory_id": memory_id, "content": content, "result": result}

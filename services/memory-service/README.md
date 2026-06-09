# Memory Service

Векторная база данных для хранения долговременной памяти AI-ассистентов.

## 🎯 Назначение

Memory Service обеспечивает:
- **Долговременную память** для AI-ботов и ассистентов
- **Семантический поиск** по контексту разговоров
- **Персонализацию** - AI "помнит" ваши предпочтения и решения
- **Контекстный поиск** - находит похожие ситуации из прошлого

## 🔧 Технологии

- **Python 3.11** - язык программирования
- **FastAPI** - веб-фреймворк для HTTP API
- **Mem0** - библиотека управления памятью для LLM
- **Qdrant** - векторная база данных
- **Anthropic Claude** - LLM для обработки контекста
- **Sentence Transformers** - эмбеддинги для векторного поиска

## 📁 Структура

```
memory-service/
├── src/
│   ├── main.py              # FastAPI приложение
│   ├── memory_manager.py    # Логика работы с памятью
│   └── __init__.py
├── tests/                   # Тесты
├── Dockerfile              # Docker образ
├── requirements.txt        # Python зависимости
└── README.md              # Этот файл
```

## 🚀 Быстрый старт

### Локальная разработка

1. **Создать виртуальное окружение:**
```bash
cd services/memory-service
python3.11 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# или
.venv\Scripts\activate  # Windows
```

2. **Установить зависимости:**
```bash
pip install -r requirements.txt
```

3. **Настроить переменные окружения:**
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key
export QDRANT_HOST=localhost
export QDRANT_PORT=6333
```

4. **Запустить Qdrant:**
```bash
docker run -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_data:/qdrant/storage qdrant/qdrant
```

5. **Запустить сервис:**
```bash
python -m uvicorn src.main:app --reload --port 8000
```

### Запуск через Docker Compose

Из корня монорепозитория:

```bash
# Запустить все сервисы (включая Memory Service)
docker-compose -f infra/docker/docker-compose.dev.yml up -d

# Или только Memory Service + Qdrant
docker-compose -f infra/docker/docker-compose.dev.yml up -d qdrant memory-service

# Посмотреть логи
docker logs -f aicontrol-memory-service
```

## 📡 API Endpoints

### Проверка статуса
```bash
GET http://localhost:8000/
GET http://localhost:8000/health
```

### Добавить память
```bash
POST http://localhost:8000/api/memory/add
Content-Type: application/json

{
  "project_id": "erp-project",
  "content": "Пользователь предпочитает использовать PostgreSQL для хранения данных",
  "metadata": {
    "category": "preferences",
    "timestamp": "2026-06-09"
  }
}
```

### Поиск воспоминаний
```bash
POST http://localhost:8000/api/memory/search
Content-Type: application/json

{
  "project_id": "erp-project",
  "query": "какую базу данных предпочитает пользователь?",
  "limit": 5
}
```

**Без query** - вернёт все воспоминания проекта:
```bash
POST http://localhost:8000/api/memory/search
Content-Type: application/json

{
  "project_id": "erp-project",
  "limit": 10
}
```

### Обновить память
```bash
PUT http://localhost:8000/api/memory/{memory_id}
Content-Type: application/json

{
  "content": "Обновлённое содержимое воспоминания"
}
```

### Удалить память
```bash
DELETE http://localhost:8000/api/memory/{memory_id}
```

## 💡 Примеры использования

### Python
```python
import requests

API_URL = "http://localhost:8000"

# Добавить память
response = requests.post(f"{API_URL}/api/memory/add", json={
    "project_id": "my-bot",
    "content": "Пользователь работает в компании PMK Park",
    "metadata": {"type": "user_info"}
})
print(response.json())

# Семантический поиск
response = requests.post(f"{API_URL}/api/memory/search", json={
    "project_id": "my-bot",
    "query": "где работает пользователь?",
    "limit": 3
})
memories = response.json()["data"]
for mem in memories:
    print(f"- {mem['memory']}")
```

### curl
```bash
# Добавить память
curl -X POST http://localhost:8000/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "telegram-bot",
    "content": "Пользователь предпочитает получать уведомления утром"
  }'

# Поиск
curl -X POST http://localhost:8000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "telegram-bot",
    "query": "когда отправлять уведомления?"
  }'
```

## 🔐 Безопасность

- **ANTHROPIC_API_KEY** - обязательна для работы Mem0
- **CORS** - настроен для разработки (`allow_origins=["*"]`)
- В продакшене:
  - Ограничить CORS только для доверенных доменов
  - Добавить аутентификацию (JWT токены)
  - Использовать HTTPS

## 📊 Мониторинг

### Health Check
```bash
curl http://localhost:8000/health
```

### Логи Docker
```bash
docker logs -f aicontrol-memory-service
```

### Qdrant UI
Откройте http://localhost:6333/dashboard для просмотра векторов

## 🧪 Тестирование

```bash
# Запустить тесты
pytest tests/

# С покрытием кода
pytest --cov=src tests/
```

## 🐛 Troubleshooting

### Ошибка подключения к Qdrant
```
Error: Connection refused to qdrant:6333
```
**Решение:** Убедитесь что Qdrant запущен:
```bash
docker ps | grep qdrant
```

### Ошибка ANTHROPIC_API_KEY
```
Error: ANTHROPIC_API_KEY is not set
```
**Решение:** Установите API ключ в `.env` файле:
```bash
echo "ANTHROPIC_API_KEY=sk-ant-your-key" >> .env
```

### Медленный поиск
Если поиск работает медленно - проверьте размер векторной базы:
```bash
curl http://localhost:6333/collections
```

## 📚 Интеграция с другими сервисами

### ERP Web
```typescript
// apps/erp-web/src/services/memory.service.ts
const MEMORY_API = process.env.MEMORY_SERVICE_URL;

async function rememberUserPreference(userId: string, preference: string) {
  await fetch(`${MEMORY_API}/api/memory/add`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      project_id: `user-${userId}`,
      content: preference
    })
  });
}
```

### Telegram Bot
```python
# apps/telegram-bot/memory_client.py
import os
import requests

MEMORY_API = os.getenv("MEMORY_SERVICE_URL")

def recall_conversation(chat_id: int, query: str):
    response = requests.post(f"{MEMORY_API}/api/memory/search", json={
        "project_id": f"telegram-{chat_id}",
        "query": query,
        "limit": 5
    })
    return response.json()["data"]
```

## 🛠️ Разработка

### Добавление новых фич

1. Создайте новый endpoint в `src/main.py`
2. Добавьте метод в `MemoryManager` (`src/memory_manager.py`)
3. Напишите тесты в `tests/`
4. Обновите документацию

### Форматирование кода
```bash
# Установить dev зависимости
pip install black isort flake8

# Форматирование
black src/
isort src/

# Линтинг
flake8 src/
```

## 📄 Лицензия

Proprietary - PMK Park & DV Lab

# Memory Service - Быстрый старт

## 🚀 Как запустить (самое простое)

### Вариант 1: Docker Compose (рекомендуется)

Из корня репозитория:

```bash
# 1. Убедитесь что .env файл настроен
cp .env.example .env
# Откройте .env и добавьте ваш ANTHROPIC_API_KEY

# 2. Запустить Memory Service + Qdrant
docker-compose -f infra/docker/docker-compose.dev.yml up -d qdrant memory-service

# 3. Проверить что работает
curl http://localhost:8000/health
```

**Готово!** Сервис доступен на http://localhost:8000

### Вариант 2: Локально (для разработки)

```bash
cd services/memory-service

# 1. Создать виртуальное окружение
python3.11 -m venv .venv
source .venv/bin/activate

# 2. Установить зависимости
pip install -r requirements.txt

# 3. Запустить Qdrant в Docker
docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant

# 4. Настроить переменные
export ANTHROPIC_API_KEY=sk-ant-your-key-here
export QDRANT_HOST=localhost
export QDRANT_PORT=6333

# 5. Запустить сервис
python -m uvicorn src.main:app --reload --port 8000
```

## ✅ Проверка работы

```bash
# Health check
curl http://localhost:8000/health

# Добавить память
curl -X POST http://localhost:8000/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test",
    "content": "Пользователь любит Python и FastAPI"
  }'

# Поиск
curl -X POST http://localhost:8000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test",
    "query": "какие технологии нравятся пользователю?"
  }'
```

## 🌐 Интерфейсы

- **API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **Qdrant UI:** http://localhost:6333/dashboard

## 🛑 Остановка

```bash
# Docker Compose
docker-compose -f infra/docker/docker-compose.dev.yml down

# Или только Memory Service
docker stop aicontrol-memory-service aicontrol-qdrant
```

## 📚 Дальше

См. [README.md](README.md) для полной документации.

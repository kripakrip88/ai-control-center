# Personal AI Assistant Platform

> **n8n-центричная платформа управления знаниями, задачами и автоматизациями**

## 🎯 Главный принцип

**n8n — центральный оркестратор системы.**

Вся бизнес-логика должна быть визуально представлена в n8n workflows.
Backend-сервисы выполняют только специализированные функции, которые n8n не может делать сам.

## 🏗 Архитектура

```
n8n (оркестратор)
├── Knowledge Hub API     → прием и поиск данных
├── AI Gateway           → обработка через LLM
├── PostgreSQL           → хранение структурированных данных
├── Qdrant              → embeddings + семантический поиск
├── Redis               → кеш и очереди
└── Telegram Bot        → пользовательский интерфейс
```

## 📋 Компоненты

### 1. n8n Workflows
- **Telegram Import** — импорт сообщений из групп
- **Knowledge Analysis** — AI анализ контента
- **Embedding Generation** — создание векторных представлений
- **Recommendation Generation** — формирование рекомендаций
- **Review Queue** — система повторений (3, 14, 45, 90 дней)

### 2. Knowledge Hub API
REST API для работы с знаниями:
- `POST /knowledge/ingest` — добавление нового контента
- `POST /knowledge/search` — поиск по базе знаний
- `POST /knowledge/recommendations` — получение рекомендаций

### 3. AI Gateway
Единая точка работы с LLM (OpenAI, Claude):
- Summarization
- Classification
- Clustering
- Embeddings
- Reranking

### 4. Telegram Bot
Команды:
- `/today` — дайджест дня
- `/review` — материалы на повторение
- `/search <запрос>` — поиск по базе
- `/stats` — статистика
- `/topic <тема>` — фильтр по теме

## 🚀 Первая реализация

### Источник данных v1: Telegram Groups

История группы → Импорт → AI анализ → Сохранение → Кластеризация → Рекомендации

### Knowledge Object
```json
{
  "id": "uuid",
  "source": "telegram",
  "raw_content": "...",
  "clean_content": "...",
  "summary": "...",
  "topics": ["topic1", "topic2"],
  "entities": ["entity1"],
  "importance": 0.85,
  "created_at": "2026-06-09T10:00:00Z",
  "last_reviewed": null,
  "review_count": 0,
  "embedding_id": "qdrant_vector_id"
}
```

## 🛠 Требования к расширяемости

Новый источник данных подключается через:
1. Новый workflow в n8n
2. Без изменения существующих сервисов
3. Примеры: Pinterest, Pocket, YouTube, RSS

## 📦 Docker Services

```yaml
services:
  - n8n
  - knowledge-api
  - ai-gateway
  - telegram-bot
  - postgres
  - qdrant
  - redis
```

Каждый сервис имеет:
- `/health` — проверка здоровья
- `/version` — версия сервиса
- `/docs` — Swagger документация

## ❌ Что запрещено

- ❌ Переносить бизнес-логику в Python если она реализуема в n8n
- ❌ Создавать монолитные сервисы
- ❌ Жестко связывать сервисы между собой

## ✅ Что важно

Через 6 месяцев владелец системы должен иметь возможность:
- Открыть n8n
- Визуально увидеть все процессы
- Изменить логику без изучения кода

## 📚 Документация

- [Architecture](docs/architecture/) — архитектурные решения
- [Workflows](docs/workflows/) — описание каждого n8n workflow
- [Integrations](docs/integrations/) — как подключать новые источники

## 🔗 Связанные проекты

- [ERP Metal](../../../erp-metal) — система учета металлопроката
- [AI Polygon](../ai-polygon) — AI обработка документов

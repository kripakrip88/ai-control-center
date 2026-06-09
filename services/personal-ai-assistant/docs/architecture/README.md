# Архитектура Personal AI Assistant

## Принципы проектирования

### 1. n8n как центр управления

**Все автоматизации визуализируются через n8n workflows.**

n8n отвечает за:
- Оркестрацию процессов
- Маршрутизацию данных между сервисами
- Бизнес-логику (условия, циклы, расписания)
- Интеграции с внешними системами

Backend-сервисы отвечают за:
- Специализированные функции (AI, поиск, БД)
- Предоставление REST API
- Хранение данных

### 2. Слабая связанность

Каждый сервис:
- Независим от других
- Имеет свой REST API
- Может быть заменен без изменения остальных

### 3. Расширяемость

Новый источник данных = новый workflow в n8n.
Без изменения кода существующих сервисов.

## Компоненты системы

### n8n (Оркестратор)
- **Роль**: центральная точка управления
- **Порт**: 5678
- **База данных**: PostgreSQL
- **Функции**: 
  - Планирование задач (cron)
  - HTTP webhooks
  - Интеграции (Telegram, API)
  - Визуальное представление процессов

### Knowledge Hub API
- **Роль**: единая точка работы с знаниями
- **Порт**: 3001
- **База данных**: PostgreSQL
- **Endpoints**:
  - `POST /knowledge/ingest` — добавить контент
  - `GET /knowledge/search` — поиск
  - `GET /knowledge/recommendations` — рекомендации
  - `GET /health`, `/version`, `/docs`

### AI Gateway
- **Роль**: работа с LLM (OpenAI, Claude)
- **Порт**: 3002
- **Функции**:
  - Summarization
  - Classification
  - Clustering
  - Embeddings
  - Reranking
- **Endpoints**:
  - `POST /ai/summarize`
  - `POST /ai/classify`
  - `POST /ai/embed`
  - `POST /ai/rerank`

### Telegram Bot
- **Роль**: пользовательский интерфейс
- **Функции**:
  - Прием команд от пользователя
  - Отправка дайджестов
  - Интерактивные уведомления
- **Команды**: /today, /review, /search, /stats, /topic

### PostgreSQL
- **Роль**: хранение структурированных данных
- **Порт**: 5432
- **Схемы**:
  - `knowledge` — основная таблица знаний
  - `topics` — темы и категории
  - `entities` — извлеченные сущности
  - `review_schedule` — расписание повторений
  - `user_interactions` — история взаимодействий

### Qdrant
- **Роль**: векторная база данных
- **Порт**: 6333
- **Функции**:
  - Хранение embeddings
  - Семантический поиск
  - Кластеризация

### Redis
- **Роль**: кеш и очереди
- **Порт**: 6379
- **Функции**:
  - Кеширование результатов AI
  - Очереди обработки
  - Rate limiting

## Потоки данных

### 1. Импорт из Telegram

```
Telegram Group
    ↓
n8n: Telegram Import Workflow
    ↓
POST /knowledge/ingest
    ↓
Knowledge Hub API
    ↓
PostgreSQL (raw_content)
    ↓
n8n: Trigger Analysis
```

### 2. AI Анализ

```
n8n: Knowledge Analysis Workflow
    ↓
POST /ai/summarize + /ai/classify
    ↓
AI Gateway → OpenAI/Claude
    ↓
Knowledge Hub API (update)
    ↓
PostgreSQL (summary, topics, entities)
```

### 3. Генерация Embeddings

```
n8n: Embedding Generation Workflow
    ↓
POST /ai/embed
    ↓
AI Gateway → OpenAI
    ↓
Qdrant (vector storage)
    ↓
PostgreSQL (embedding_id)
```

### 4. Рекомендации

```
n8n: Recommendation Workflow (cron: daily)
    ↓
GET /knowledge/recommendations
    ↓
Knowledge Hub API
    ↓
Qdrant (semantic search)
    ↓
PostgreSQL (filtering)
    ↓
Telegram Bot (send digest)
```

### 5. Повторение (Review)

```
n8n: Review Queue Workflow (cron: daily)
    ↓
PostgreSQL (find due reviews: 3, 14, 45, 90 days)
    ↓
Telegram Bot (send for review)
    ↓
User interaction
    ↓
PostgreSQL (update last_reviewed, review_count)
```

## Принципы разделения ответственности

### ✅ В n8n (визуальная логика)
- Условия (if/else)
- Циклы обработки
- Расписания (cron)
- Маршрутизация между сервисами
- Интеграции (Telegram, webhooks)
- Обработка ошибок (retry, fallback)

### ✅ В Backend (код)
- Сложные вычисления
- Работа с БД (транзакции, миграции)
- AI обработка (вызовы LLM API)
- Векторный поиск (Qdrant)
- Валидация данных

### ❌ Запрещено в Backend
- Бизнес-правила (например: "если importance > 0.8 → отправить в Telegram")
- Расписания (например: "каждый день в 9:00")
- Роутинг данных между сервисами

## Безопасность

- API Keys хранятся в переменных окружения
- n8n Credentials для внешних сервисов
- Rate limiting через Redis
- Валидация входных данных на уровне API

## Мониторинг

Каждый сервис предоставляет:
- `/health` — HTTP 200 если сервис работает
- `/version` — версия сервиса
- Логи в JSON формате (stdout)

## Масштабирование

- **Горизонтальное**: можно запускать несколько инстансов API
- **Вертикальное**: увеличение ресурсов для AI Gateway
- **Очереди**: Redis для асинхронной обработки

## Следующие шаги

1. Реализация базовой структуры сервисов
2. Docker Compose конфигурация
3. Схема PostgreSQL
4. Базовые n8n workflows
5. Telegram Bot базовая версия

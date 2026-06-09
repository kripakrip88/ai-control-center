# Структура проекта Personal AI Assistant

## Общая структура

```
personal-ai-assistant/
├── README.md                           # Главная документация
├── docs/                               # Документация
│   ├── architecture/                   # Архитектурные решения
│   │   └── README.md
│   ├── workflows/                      # Описание n8n workflows
│   │   ├── README.md
│   │   ├── 01-telegram-import.md
│   │   ├── 02-knowledge-analysis.md
│   │   ├── 03-embedding-generation.md
│   │   ├── 04-daily-recommendations.md
│   │   ├── 05-review-queue.md
│   │   ├── 06-search-request.md
│   │   └── 07-stats-request.md
│   ├── integrations/                   # Как подключать источники
│   │   ├── README.md
│   │   ├── telegram.md
│   │   ├── pocket.md
│   │   └── bookmarks.md
│   └── PROJECT_STRUCTURE.md            # Этот файл
│
├── services/                           # Backend сервисы
│   ├── knowledge-api/                  # Knowledge Hub API
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── db/
│   │   └── README.md
│   │
│   ├── ai-gateway/                     # AI Gateway
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── providers/              # OpenAI, Claude
│   │   │   └── cache/
│   │   └── README.md
│   │
│   └── telegram-bot/                   # Telegram Bot
│       ├── Dockerfile
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── commands/
│       │   └── handlers/
│       └── README.md
│
├── infra/                              # Инфраструктура
│   ├── docker-compose.yml              # Основной compose файл
│   ├── .env.example                    # Пример переменных окружения
│   ├── postgres/
│   │   └── init/
│   │       ├── 01-create-databases.sql
│   │       └── 02-knowledge-schema.sql
│   └── n8n/
│       └── workflows/                  # Экспортированные workflows
│           ├── telegram-import.json
│           ├── knowledge-analysis.json
│           ├── embedding-generation.json
│           ├── daily-recommendations.json
│           ├── review-queue.json
│           ├── search-request.json
│           └── stats-request.json
│
└── scripts/                            # Утилиты
    ├── setup.sh                        # Первоначальная настройка
    ├── backup.sh                       # Бэкап данных
    └── restore.sh                      # Восстановление
```

## Описание компонентов

### `/docs/`
Вся документация проекта. Автоматически обновляется при изменении workflows.

**Принцип**: документация должна быть актуальной и понятной через 6 месяцев.

### `/services/`
Backend сервисы в контейнерах.

**Принцип**: каждый сервис независим и предоставляет REST API.

#### `knowledge-api/`
Центральный API для работы с базой знаний.

**Endpoints**:
- `POST /knowledge/ingest` — добавить новый контент
- `GET /knowledge/search` — поиск
- `GET /knowledge/recommendations` — рекомендации
- `GET /knowledge/:id` — получить по ID
- `PATCH /knowledge/:id` — обновить
- `GET /health`, `/version`, `/docs`

**Стек**: Node.js, Express, TypeScript, PostgreSQL, Qdrant

#### `ai-gateway/`
Единая точка работы с LLM API.

**Endpoints**:
- `POST /ai/summarize` — создать саммари
- `POST /ai/classify` — классифицировать (topics, entities)
- `POST /ai/embed` — создать embeddings
- `POST /ai/rerank` — переранжировать результаты
- `GET /health`, `/version`, `/docs`

**Стек**: Node.js, Express, TypeScript, OpenAI SDK, Anthropic SDK, Redis (кеш)

#### `telegram-bot/`
Telegram бот для взаимодействия с пользователем.

**Команды**:
- `/start` — приветствие
- `/today` — дайджест дня
- `/review` — материалы на повторение
- `/search <query>` — поиск
- `/stats` — статистика
- `/topic <name>` — фильтр по теме

**Стек**: Node.js, Telegraf (Telegram Bot Framework)

### `/infra/`
Конфигурация инфраструктуры.

#### `docker-compose.yml`
Описание всех сервисов:
- n8n (оркестратор)
- postgres (БД)
- qdrant (векторная БД)
- redis (кеш)
- knowledge-api
- ai-gateway
- telegram-bot

#### `postgres/init/`
SQL скрипты для инициализации БД.

Выполняются автоматически при первом запуске контейнера.

#### `n8n/workflows/`
Экспортированные workflows из n8n в JSON формате.

**Зачем**: версионирование, backup, миграция между окружениями.

### `/scripts/`
Утилиты для управления проектом.

## Процесс разработки

### 1. Создание нового workflow

```bash
# 1. Создать workflow в n8n UI
# 2. Экспортировать в JSON
# 3. Сохранить в infra/n8n/workflows/<name>.json
# 4. Создать документацию в docs/workflows/<name>.md
# 5. Обновить docs/workflows/README.md
```

### 2. Добавление нового сервиса

```bash
# 1. Создать папку в services/<service-name>/
# 2. Добавить Dockerfile
# 3. Добавить в docker-compose.yml
# 4. Создать README.md в сервисе
# 5. Обновить docs/architecture/README.md
```

### 3. Подключение нового источника данных

```bash
# 1. Создать workflow в n8n
# 2. Использовать POST /knowledge/ingest
# 3. Создать docs/integrations/<source>.md
# 4. Обновить docs/integrations/README.md
```

## Запуск проекта

### Первый запуск

```bash
# 1. Скопировать переменные окружения
cd infra
cp .env.example .env

# 2. Отредактировать .env (добавить API ключи)
nano .env

# 3. Запустить контейнеры
docker-compose up -d

# 4. Проверить статус
docker-compose ps

# 5. Открыть n8n
open http://localhost:5678
```

### Проверка здоровья сервисов

```bash
# n8n
curl http://localhost:5678/healthz

# knowledge-api
curl http://localhost:3001/health

# ai-gateway
curl http://localhost:3002/health

# postgres
docker exec -it personal-ai-postgres pg_isready

# qdrant
curl http://localhost:6333/healthz

# redis
docker exec -it personal-ai-redis redis-cli ping
```

## База данных

### Подключение к PostgreSQL

```bash
docker exec -it personal-ai-postgres psql -U n8n -d knowledge
```

### Полезные запросы

```sql
-- Статистика по источникам
SELECT * FROM knowledge_stats;

-- Материалы на повторение
SELECT * FROM get_reviews_due(10);

-- Последние добавленные
SELECT id, source, summary, created_at
FROM knowledge
ORDER BY created_at DESC
LIMIT 10;

-- По темам
SELECT topics, COUNT(*)
FROM knowledge
WHERE topics IS NOT NULL
GROUP BY topics;
```

## Резервное копирование

```bash
# Backup PostgreSQL
docker exec personal-ai-postgres pg_dump -U n8n knowledge > backup_knowledge_$(date +%Y%m%d).sql

# Backup Qdrant
docker exec personal-ai-qdrant tar -czf /tmp/qdrant_backup.tar.gz /qdrant/storage
docker cp personal-ai-qdrant:/tmp/qdrant_backup.tar.gz ./qdrant_backup_$(date +%Y%m%d).tar.gz

# Backup n8n workflows
docker exec personal-ai-n8n tar -czf /tmp/n8n_backup.tar.gz /home/node/.n8n
docker cp personal-ai-n8n:/tmp/n8n_backup.tar.gz ./n8n_backup_$(date +%Y%m%d).tar.gz
```

## Мониторинг

### Логи

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f knowledge-api

# Последние 100 строк
docker-compose logs --tail=100 n8n
```

### Метрики

- n8n: встроенная статистика выполнения workflows
- PostgreSQL: `pg_stat_statements`
- Qdrant: `/metrics` endpoint
- Redis: `INFO` команда

## Обновление

```bash
# Обновить образы
docker-compose pull

# Перезапустить с новыми образами
docker-compose up -d

# Проверить версии
curl http://localhost:3001/version
curl http://localhost:3002/version
```

## Troubleshooting

### n8n не запускается

```bash
# Проверить логи
docker-compose logs n8n

# Проверить PostgreSQL
docker-compose logs postgres

# Пересоздать контейнер
docker-compose up -d --force-recreate n8n
```

### PostgreSQL проблемы

```bash
# Проверить подключение
docker exec personal-ai-postgres pg_isready -U n8n

# Проверить логи
docker-compose logs postgres

# Вручную создать БД
docker exec -it personal-ai-postgres psql -U n8n -c "CREATE DATABASE knowledge;"
```

### Qdrant не индексирует

```bash
# Проверить коллекции
curl http://localhost:6333/collections

# Проверить логи
docker-compose logs qdrant
```

## Следующие шаги

1. Реализовать базовые сервисы (knowledge-api, ai-gateway, telegram-bot)
2. Создать первые workflows в n8n
3. Подключить Telegram Groups
4. Настроить автоматическое обновление документации

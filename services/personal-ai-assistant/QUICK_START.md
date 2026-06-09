# Quick Start: Personal AI Assistant

> Быстрый старт для запуска платформы

## 🎯 Что это?

**Personal AI Assistant** — n8n-центричная платформа управления знаниями.

Главный принцип: **вся бизнес-логика в n8n workflows**, код только для того, что n8n не может.

## 📦 Что уже готово?

✅ Структура проекта
✅ Docker Compose для всех сервисов
✅ PostgreSQL схема с таблицами
✅ Документация (архитектура, workflows, интеграции)
✅ Roadmap реализации

## 🚀 Запуск (когда будут готовы сервисы)

### Шаг 1: Настройка окружения

```bash
cd /Users/antonkarneev/Projects/ai-control-center/services/personal-ai-assistant/infra

# Скопировать пример конфигурации
cp .env.example .env

# Отредактировать .env и добавить:
# - POSTGRES_PASSWORD
# - N8N_PASSWORD
# - TELEGRAM_BOT_TOKEN
# - CLAUDE_API_KEY (для LLM)
# Embeddings используют HuggingFace локально, API ключ не нужен
nano .env
```

### Шаг 2: Запуск

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps

# Проверить логи
docker-compose logs -f
```

### Шаг 3: Доступ к сервисам

- **n8n**: http://localhost:5678
  - Login: `admin`
  - Password: из `.env` (`N8N_PASSWORD`)

- **Knowledge API**: http://localhost:3001
  - Swagger: http://localhost:3001/docs

- **AI Gateway**: http://localhost:3002
  - Swagger: http://localhost:3002/docs

- **PostgreSQL**: `localhost:5432`
  - Database: `knowledge`
  - User: из `.env`

- **Qdrant**: http://localhost:6333
  - Dashboard: http://localhost:6333/dashboard

- **Redis**: `localhost:6379`

### Шаг 4: Проверка

```bash
# Health checks
curl http://localhost:5678/healthz        # n8n
curl http://localhost:3001/health         # knowledge-api
curl http://localhost:3002/health         # ai-gateway
curl http://localhost:6333/healthz        # qdrant

# PostgreSQL
docker exec -it personal-ai-postgres psql -U n8n -d knowledge -c "\dt"
```

## 📚 Следующие шаги

### 1. Изучить документацию

Начни с:
- [README.md](README.md) — общая информация
- [docs/architecture/](docs/architecture/) — архитектура системы
- [docs/workflows/](docs/workflows/) — описание n8n workflows
- [ROADMAP.md](ROADMAP.md) — план реализации

### 2. Реализовать базовые сервисы

Сейчас нужно создать:
- `services/knowledge-api/` — Knowledge Hub API
- `services/ai-gateway/` — AI Gateway
- `services/telegram-bot/` — Telegram Bot

Смотри **Phase 1** в [ROADMAP.md](ROADMAP.md)

### 3. Создать первые workflows в n8n

После того как сервисы будут готовы:
1. Открыть http://localhost:5678
2. Создать workflow: Telegram Import
3. Создать workflow: Knowledge Analysis
4. Создать workflow: Embedding Generation

Смотри **Phase 2** в [ROADMAP.md](ROADMAP.md)

## 🛠 Полезные команды

### Docker

```bash
# Перезапустить все
docker-compose restart

# Остановить все
docker-compose down

# Удалить все данные (осторожно!)
docker-compose down -v

# Пересобрать образы
docker-compose build

# Логи конкретного сервиса
docker-compose logs -f knowledge-api
```

### PostgreSQL

```bash
# Подключиться к БД
docker exec -it personal-ai-postgres psql -U n8n -d knowledge

# Выполнить SQL файл
docker exec -i personal-ai-postgres psql -U n8n -d knowledge < backup.sql

# Бэкап
docker exec personal-ai-postgres pg_dump -U n8n knowledge > backup.sql
```

### Qdrant

```bash
# Список коллекций
curl http://localhost:6333/collections

# Создать коллекцию (пример)
curl -X PUT http://localhost:6333/collections/knowledge \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    }
  }'
```

## 📋 Структура проекта

```
personal-ai-assistant/
├── README.md                    # Главная документация
├── ROADMAP.md                   # План реализации
├── QUICK_START.md              # Этот файл
│
├── docs/                       # Документация
│   ├── architecture/           # Архитектура
│   ├── workflows/              # n8n workflows
│   ├── integrations/           # Источники данных
│   └── PROJECT_STRUCTURE.md    # Детальная структура
│
├── services/                   # Backend сервисы
│   ├── knowledge-api/          # Knowledge Hub API (TODO)
│   ├── ai-gateway/             # AI Gateway (TODO)
│   └── telegram-bot/           # Telegram Bot (TODO)
│
└── infra/                      # Инфраструктура
    ├── docker-compose.yml      # Docker Compose
    ├── .env.example            # Пример переменных
    ├── postgres/init/          # PostgreSQL схема
    └── n8n/workflows/          # Экспортированные workflows (TODO)
```

## ❓ FAQ

### Как добавить новый источник данных?

1. Создать workflow в n8n
2. Использовать `POST /knowledge/ingest`
3. Создать документацию в `docs/integrations/`

Подробнее: [docs/integrations/README.md](docs/integrations/README.md)

### Как изменить логику процессов?

Открыть n8n → найти нужный workflow → изменить визуально.

**Не нужно менять код!** Вся логика в n8n.

### Где хранятся данные?

- **PostgreSQL**: структурированные данные (knowledge, topics, entities)
- **Qdrant**: векторные представления (embeddings)
- **Redis**: кеш AI результатов

### Как сделать бэкап?

```bash
# PostgreSQL
docker exec personal-ai-postgres pg_dump -U n8n knowledge > backup_$(date +%Y%m%d).sql

# Qdrant
docker exec personal-ai-qdrant tar -czf /tmp/qdrant.tar.gz /qdrant/storage
docker cp personal-ai-qdrant:/tmp/qdrant.tar.gz ./qdrant_backup_$(date +%Y%m%d).tar.gz

# n8n workflows
docker exec personal-ai-n8n tar -czf /tmp/n8n.tar.gz /home/node/.n8n
docker cp personal-ai-n8n:/tmp/n8n.tar.gz ./n8n_backup_$(date +%Y%m%d).tar.gz
```

## 🐛 Troubleshooting

### n8n не запускается

```bash
# Проверить логи
docker-compose logs n8n

# Проверить PostgreSQL
docker-compose logs postgres

# Пересоздать контейнер
docker-compose up -d --force-recreate n8n
```

### API не отвечает

```bash
# Проверить статус контейнера
docker-compose ps

# Проверить логи
docker-compose logs knowledge-api

# Перезапустить
docker-compose restart knowledge-api
```

### PostgreSQL ошибки

```bash
# Проверить подключение
docker exec personal-ai-postgres pg_isready -U n8n

# Пересоздать схему
docker exec -i personal-ai-postgres psql -U n8n -d knowledge < infra/postgres/init/02-knowledge-schema.sql
```

## 📞 Поддержка

Если что-то не работает:
1. Проверь логи: `docker-compose logs -f`
2. Проверь `.env` файл (все ли ключи заполнены?)
3. Перезапусти: `docker-compose restart`
4. Смотри документацию: [docs/](docs/)

## 🎯 Главное правило

> **Бизнес-логика → n8n. Код → только специализированные функции.**

Если можешь сделать в n8n — делай в n8n. Если нет — пиши код.

---

**Текущий статус**: Phase 1 (Фундамент) — структура готова, нужна реализация сервисов.

**Следующий шаг**: Реализовать Knowledge Hub API (см. ROADMAP.md Phase 1.2)

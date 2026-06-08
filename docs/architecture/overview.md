# Архитектура AI Control Center

## Обзор

AI Control Center — это единый монорепозиторий, объединяющий:

- **ERP систему** - управление производством (Node.js)
- **AI Полигон** - извлечение данных из документов, анализ (NestJS)  
- **Memory Service** - векторная память для AI (Python + Qdrant)
- **Telegram боты** - ассистенты (TypeScript)

## Принципы архитектуры

### 1. Модульность
Каждый сервис независим и может разрабатываться/деплоиться отдельно.

### 2. Shared Context
Общие типы, конфигурация и утилиты доступны всем модулям через пакеты `@ai-control/*`.

### 3. Event-Driven
Асинхронная коммуникация через Transactional Outbox Pattern.

### 4. Multi-Tenancy
Все данные изолированы по `companyId`.

## Структура монорепозитория

```
ai-control-center/
├── apps/              # Приложения
│   ├── erp-web/      # ERP система
│   └── telegram-bot/ # Telegram боты
├── services/          # Микросервисы
│   ├── ai-polygon/   # AI сервис
│   └── memory-service/ # Память
├── packages/          # Общие библиотеки
│   ├── shared-types/ # Типы
│   ├── database/     # Prisma
│   ├── auth/         # Аутентификация
│   ├── event-bus/    # События
│   └── api-client/   # HTTP клиенты
└── infra/            # Инфраструктура
    └── docker/       # Docker Compose
```

## Коммуникация между сервисами

### HTTP (синхронная)
```
ERP → AI Polygon: POST /api/extract-bom
AI Polygon → ERP: POST /api/internal/bom-extracted
```

### Events (асинхронная)
```
ERP → OutboxEvent → Worker → Subscribers
```

## Технологический стек

**Backend:**
- Node.js 20 (ERP, боты)
- NestJS (AI сервисы)
- Python 3.11 (Memory)
- PostgreSQL 15
- Prisma ORM

**AI/ML:**
- Anthropic Claude
- Ollama (локальный LLM)
- Qdrant (векторная БД)
- Mem0 (управление памятью)

**Инфраструктура:**
- Docker Compose
- pnpm workspaces
- GitHub Actions
- Nginx

# AI Control Center - Context Document

## Описание проекта

AI Control Center — это единый монорепозиторий для управления:
- ERP системой производственного завода
- AI сервисами для извлечения данных из документов
- Системой векторной памяти для AI
- Telegram ассистентами

## Архитектурные решения

### Monorepo структура

Выбран подход с единым репозиторием и независимыми модулями:
- **apps/** - приложения (ERP, Telegram боты)
- **services/** - микросервисы (AI, Memory)
- **packages/** - общие библиотеки

### Package Manager: pnpm

Используем pnpm workspaces для:
- Быстрой установки зависимостей
- Экономии дискового пространства
- Shared зависимостей между модулями

### База данных: PostgreSQL + Prisma

- Единая PostgreSQL инстанция
- Разные схемы для разных доменов (erp, ai, telegram)
- Prisma ORM для type-safe доступа
- Миграции в `packages/database/prisma/migrations`

### Inter-service Communication

**Синхронная (HTTP):**
- ERP → AI: POST /api/extract-bom
- AI → ERP: POST /api/internal/bom-extracted

**Асинхронная (Events):**
- Transactional Outbox Pattern
- OutboxEvent таблица
- Worker процесс обрабатывает события

### Аутентификация

- JWT токены
- Multi-tenancy через `companyId`
- Role-based access control (ADMIN, MANAGER, ENGINEER, VIEWER)
- Middleware в `packages/auth`

### Shared Libraries

| Пакет | Описание |
|-------|----------|
| `@ai-control/shared-types` | TypeScript типы |
| `@ai-control/database` | Prisma клиент |
| `@ai-control/auth` | Аутентификация |
| `@ai-control/shared-config` | Конфигурация |
| `@ai-control/event-bus` | События |
| `@ai-control/api-client` | HTTP клиенты |

## Технологический стек

### Backend
- Node.js 20
- NestJS (AI сервис)
- Python 3.11 (Memory service)
- PostgreSQL 15
- Prisma ORM

### AI/ML
- Anthropic Claude API
- Ollama (локальный Llama)
- Qdrant (векторная БД)
- Mem0 (управление памятью)
- Tesseract OCR

### Infrastructure
- Docker & Docker Compose
- pnpm workspaces
- GitHub Actions
- Nginx (reverse proxy)

## Окружения

### Development
- Docker Compose для всех сервисов
- Hot-reload для Node.js сервисов
- Volume mounts для live editing
- Порты локально доступны

### Staging
- Separate БД: `aicontrol_db_staging`
- Deploy на push в `develop` ветку
- Тестирование интеграций

### Production
- Deploy на push в `main` ветку
- Независимые деплои per-service
- Мониторинг через логи
- Backup БД ежедневно

## Миграция из multi-repo

Проект создан путем объединения:
1. **erp-metal** → `apps/erp-web`
2. **metalpro-ai-polygon** → `services/ai-polygon`
3. **ai-memory** → `services/memory-service`

История коммитов сохранена через git subtree.

## Разработка

### Запуск локально

```bash
# Установить зависимости
pnpm install

# Запустить все в Docker
pnpm docker:up

# Или отдельные сервисы
pnpm dev:erp
pnpm dev:ai
```

### Работа с БД

```bash
# Миграции
pnpm db:migrate

# Prisma Studio
pnpm db:studio

# Генерация клиента
pnpm db:generate
```

### Тестирование

```bash
# Все тесты
pnpm test

# Конкретный сервис
pnpm --filter erp-web test
```

## CI/CD

### GitHub Actions workflows

- **ci.yml** - проверка кода, тесты, линтинг
- **deploy-erp.yml** - деплой ERP сервиса
- **deploy-ai.yml** - деплой AI сервиса
- **deploy-memory.yml** - деплой Memory сервиса

### Change Detection

Workflows запускаются только при изменениях в соответствующих директориях:
- `apps/erp-web/**` → deploy-erp
- `services/ai-polygon/**` → deploy-ai
- `packages/**` → пересборка всех зависимых сервисов

## Мониторинг и логирование

### Логи

- Структурированные JSON логи
- Уровни: debug, info, warn, error
- Контекст: userId, companyId, requestId

### Audit Trail

- Таблица `audit_logs`
- Записываются все критичные операции
- Fire-and-forget (не блокирует основной flow)

### Health Checks

- GET /health на каждом сервисе
- Docker healthcheck в compose файле
- Проверка зависимостей (БД, Qdrant, Ollama)

## Безопасность

### Аутентификация
- JWT токены с expiry
- bcrypt для паролей
- Rate limiting (TODO)

### Authorization
- Role-based access
- Tenant isolation через companyId
- Middleware проверяет права

### Data Privacy
- Multi-tenancy на уровне БД
- Все запросы фильтруются по companyId
- Sensitive данные не логируются

## Roadmap

### Ближайшие планы
- [ ] Миграция кода из старых репозиториев
- [ ] Настройка CI/CD
- [ ] Production деплой
- [ ] Telegram боты

### Будущее
- [ ] Kubernetes deployment
- [ ] Distributed tracing
- [ ] API Gateway
- [ ] Rate limiting
- [ ] Redis cache layer

## Контакты

- **Проект:** AI Control Center
- **Владелец:** Anton Karneev
- **Организация:** PMK Park & DV Lab
- **Email:** kripakrip88@gmail.com

## Ссылки

- GitHub: (будет обновлено после миграции)
- Документация: [docs/](docs/)
- Исходные репозитории:
  - [erp-metal](https://github.com/kripakrip88/erp-metal)
  - [metalpro-ai-polygon](https://github.com/kripakrip88/metalpro-ai-polygon)
  - [ai-memory](https://github.com/kripakrip88/ai-memory)

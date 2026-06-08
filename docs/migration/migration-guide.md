# План миграции в монорепозиторий

## Текущее состояние

Три независимых репозитория:
1. **erp-metal** - Node.js ERP система
2. **metalpro-ai-polygon** - NestJS AI сервис
3. **ai-memory** - Python сервис памяти

## Цель

Объединить все в один монорепозиторий `ai-control-center` с:
- Независимыми деплоями каждого сервиса
- Общими типами и конфигурацией
- Единым Docker Compose для локальной разработки

## Этапы миграции

### Этап 1: Подготовка (неделя 1)

**Задачи:**
- [x] Создать структуру монорепозитория
- [x] Настроить pnpm workspace
- [x] Создать shared пакеты
- [x] Создать единую Prisma схему
- [ ] Настроить Docker Compose

**Результат:**
Базовая структура готова, можно начинать миграцию сервисов.

### Этап 2: Миграция ERP (неделя 2)

**Задачи:**
1. Скопировать код из `erp-metal` в `apps/erp-web`
2. Обновить импорты на `@ai-control/*` пакеты
3. Переместить Prisma схему в `packages/database`
4. Переместить middleware аутентификации в `packages/auth`
5. Обновить package.json зависимости
6. Протестировать локально

**Команды:**
```bash
cd /Users/antonkarneev/Projects
cp -r erp-metal/* ai-control-center/apps/erp-web/

cd ai-control-center
pnpm install
pnpm dev:erp
```

### Этап 3: Миграция AI сервиса (неделя 3)

**Задачи:**
1. Скопировать `metalpro-ai-polygon/backend` в `services/ai-polygon`
2. Обновить импорты на shared пакеты
3. Обновить Dockerfile для работы из монорепозитория
4. Настроить inter-service communication
5. Протестировать интеграцию с ERP

**Команды:**
```bash
cp -r metalpro-ai-polygon/backend/* ai-control-center/services/ai-polygon/
pnpm dev:ai
```

### Этап 4: Интеграция Memory Service (неделя 4)

**Задачи:**
1. Переместить `ai-memory` в `services/memory-service`
2. Добавить FastAPI HTTP обертку
3. Создать TypeScript клиент в `packages/api-client`
4. Интегрировать с ERP и AI сервисами

### Этап 5: Docker Orchestration (неделя 5)

**Задачи:**
1. Создать `docker-compose.yml` для всех сервисов
2. Настроить volumes для uploads
3. Добавить healthchecks
4. Создать скрипт `scripts/dev.sh`

**Результат:**
```bash
pnpm docker:up  # запускает всё сразу
```

### Этап 6: CI/CD (неделя 6)

**Задачи:**
1. Создать GitHub Actions workflows
2. Настроить path-based триггеры
3. Независимые деплои per-service
4. Тестирование в staging

### Этап 7: Production Migration (неделя 7)

**Задачи:**
1. Backup всех баз данных
2. Деплой в staging
3. Интеграционное тестирование
4. Деплой в production
5. Мониторинг

## Rollback Plan

Если что-то пойдет не так:

1. Откатить DNS/nginx на старые репозитории
2. Восстановить БД из backup
3. Перезапустить старые PM2 процессы

Старые репозитории оставить read-only на 1 месяц.

## Checklist финальной миграции

- [ ] Backup production БД
- [ ] Backup staging БД  
- [ ] Деплой в staging
- [ ] Smoke тесты
- [ ] Интеграционные тесты
- [ ] Проверка мониторинга
- [ ] Деплой в production
- [ ] Проверка всех API
- [ ] Проверка аутентификации
- [ ] Проверка inter-service коммуникации
- [ ] Обновить документацию
- [ ] Уведомить команду

# Руководство по разработке

## Требования

- **Node.js** 20+
- **pnpm** 8+
- **Docker** и Docker Compose
- **Python** 3.11+ (для memory service)

## Первоначальная настройка

### 1. Клонирование репозитория

```bash
git clone git@github.com:kripakrip88/ai-control-center.git
cd ai-control-center
```

### 2. Установка зависимостей

```bash
# Установить все Node.js зависимости
pnpm install

# Сгенерировать Prisma клиент
pnpm db:generate
```

### 3. Настройка окружения

```bash
# Скопировать example файл
cp .env.example .env

# Отредактировать .env
# Минимально необходимые переменные:
# - ANTHROPIC_API_KEY
# - JWT_SECRET
# - POSTGRES_PASSWORD
```

### 4. Запуск с Docker

```bash
# Запустить все сервисы
pnpm docker:up

# Или в фоновом режиме
pnpm docker:up -d

# Посмотреть логи
pnpm docker:logs
```

### 5. Инициализация базы данных

```bash
# Применить миграции
pnpm db:migrate

# Открыть Prisma Studio для просмотра данных
pnpm db:studio
```

## Локальная разработка

### Запуск без Docker

```bash
# В одном терминале - PostgreSQL
docker-compose -f infra/docker/docker-compose.yml up postgres qdrant ollama

# В другом - ERP сервис
pnpm dev:erp

# В третьем - AI сервис
pnpm dev:ai

# Или всё сразу
pnpm dev
```

### Работа с отдельным пакетом

```bash
# Перейти в пакет
cd packages/shared-types

# Запустить watch mode
pnpm dev

# Собрать пакет
pnpm build
```

### Работа с базой данных

```bash
# Создать миграцию
cd packages/database
pnpm prisma migrate dev --name add_new_field

# Применить миграции
pnpm db:migrate

# Сбросить базу (ОСТОРОЖНО!)
pnpm prisma migrate reset
```

## Использование shared пакетов

### Пример: использование типов

```typescript
// В вашем сервисе
import { Order, OrderStatus } from '@ai-control/shared-types'
import { getPrismaClient } from '@ai-control/database'

const prisma = getPrismaClient()

const order: Order = await prisma.order.create({
  data: {
    orderNumber: 'ORD-001',
    status: OrderStatus.DRAFT,
    companyId: 'company-id',
  },
})
```

### Пример: аутентификация

```typescript
import { authenticate } from '@ai-control/auth'

// В Express middleware
app.use('/api', authenticate, yourRoutes)
```

### Пример: события

```typescript
import { publishEvent, EventType } from '@ai-control/event-bus'

await publishEvent({
  type: EventType.ORDER_CREATED,
  aggregateType: 'Order',
  aggregateId: order.id,
  payload: { orderId: order.id, orderNumber: order.orderNumber },
  companyId: order.companyId,
})
```

## Тестирование

```bash
# Запустить все тесты
pnpm test

# Тесты конкретного сервиса
pnpm --filter erp-web test

# Watch mode
pnpm --filter erp-web test --watch
```

## Линтинг и форматирование

```bash
# Проверить код
pnpm lint

# Исправить автоматически
pnpm lint --fix

# Форматирование Prisma схемы
cd packages/database
pnpm prisma:format
```

## Отладка

### Просмотр логов Docker

```bash
# Все сервисы
pnpm docker:logs

# Конкретный сервис
docker-compose -f infra/docker/docker-compose.yml logs -f erp-web
```

### Подключение к БД

```bash
# Через Prisma Studio
pnpm db:studio

# Через psql
docker exec -it ai-control-center-postgres-1 psql -U aicontrol -d aicontrol_db
```

## Полезные команды

```bash
# Очистить все build артефакты
pnpm clean

# Пересобрать Docker образы
pnpm docker:build

# Остановить все контейнеры
pnpm docker:down

# Удалить volumes (ОСТОРОЖНО - удалит данные!)
docker-compose -f infra/docker/docker-compose.yml down -v
```

## Структура workspace

```
packages/
├── shared-types/      # @ai-control/shared-types
├── database/          # @ai-control/database
├── auth/              # @ai-control/auth
├── shared-config/     # @ai-control/shared-config
├── event-bus/         # @ai-control/event-bus
└── api-client/        # @ai-control/api-client
```

При изменении кода в любом пакете изменения автоматически подхватываются другими пакетами благодаря `workspace:*` зависимостям.

## Troubleshooting

### pnpm install fails

```bash
# Очистить lock file и кэш
rm -rf node_modules pnpm-lock.yaml
pnpm install --force
```

### Prisma generate fails

```bash
cd packages/database
rm -rf node_modules
pnpm install
pnpm prisma:generate
```

### Docker container не стартует

```bash
# Проверить логи
docker-compose logs <service-name>

# Пересобрать образ
docker-compose build --no-cache <service-name>
```

### База данных не подключается

Проверьте:
1. PostgreSQL контейнер запущен: `docker ps | grep postgres`
2. Правильный DATABASE_URL в .env
3. Healthcheck проходит: `docker inspect ai-control-center-postgres-1`

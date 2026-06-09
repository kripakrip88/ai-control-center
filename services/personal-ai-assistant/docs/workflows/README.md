# n8n Workflows

> Документация по всем workflows в системе Personal AI Assistant

## Принципы проектирования workflows

### 1. Один workflow = одна ответственность
Не создавайте гигантские workflows. Разбивайте на логические этапы.

❌ **Плохо**: один workflow "Telegram → AI → Embeddings → Recommendations"
✅ **Хорошо**: четыре отдельных workflow с четкими границами

### 2. Каждый workflow должен быть понятен через 6 месяцев
Используйте:
- Понятные названия узлов
- Sticky Notes для пояснений
- Логические группировки

### 3. Переиспользуемость
Если логика повторяется → вынести в отдельный workflow и вызывать через HTTP Request или Execute Workflow.

## Список workflows

### 1. Telegram Import
**Цель**: Импорт сообщений из Telegram групп в систему

**Триггер**: Webhook (Telegram Bot API)

**Шаги**:
1. Получение сообщения из Telegram
2. Фильтрация (только текстовые сообщения)
3. Извлечение метаданных (автор, время, группа)
4. POST `/knowledge/ingest`
5. Возврат ACK в Telegram

**Переменные**:
- `TELEGRAM_BOT_TOKEN` — токен бота
- `TELEGRAM_ALLOWED_GROUPS` — список разрешенных групп

**Статус**: 🔴 Не реализован

---

### 2. Knowledge Analysis
**Цель**: AI анализ нового контента

**Триггер**: Webhook от Knowledge Hub API (после ingest)

**Шаги**:
1. Получение нового knowledge ID
2. GET knowledge content
3. POST `/ai/summarize` (AI Gateway)
4. POST `/ai/classify` (AI Gateway) → topics, entities
5. Оценка важности (importance score)
6. PATCH knowledge с результатами анализа
7. Trigger: Embedding Generation

**Переменные**:
- `AI_MODEL` — модель для анализа (default: gpt-4o-mini)

**Статус**: 🔴 Не реализован

---

### 3. Embedding Generation
**Цель**: Создание векторных представлений для поиска

**Триггер**: Webhook от Knowledge Analysis

**Шаги**:
1. Получение knowledge ID
2. GET knowledge (clean_content + summary)
3. POST `/ai/embed` (AI Gateway)
4. Сохранение в Qdrant
5. PATCH knowledge (embedding_id)

**Переменные**:
- `EMBEDDING_MODEL` — модель (default: text-embedding-3-small)

**Статус**: 🔴 Не реализован

---

### 4. Daily Recommendations
**Цель**: Ежедневная генерация рекомендаций

**Триггер**: Cron Schedule (каждый день в 08:00)

**Шаги**:
1. GET `/knowledge/recommendations?limit=10`
2. Форматирование дайджеста
3. Отправка в Telegram Bot
4. Сохранение статистики отправки

**Переменные**:
- `DIGEST_TIME` — время отправки (default: 08:00)
- `DIGEST_LIMIT` — количество рекомендаций (default: 10)

**Статус**: 🔴 Не реализован

---

### 5. Review Queue
**Цель**: Система интервальных повторений (spaced repetition)

**Триггер**: Cron Schedule (каждый день в 09:00)

**Шаги**:
1. Запрос PostgreSQL: найти knowledge с `last_reviewed + interval`
   - Интервалы: 3, 14, 45, 90 дней
2. Для каждого найденного:
   - Форматирование для повторения
   - Отправка в Telegram
3. Ожидание callback от Telegram (reviewed / skip)
4. UPDATE last_reviewed, review_count

**Переменные**:
- `REVIEW_INTERVALS` — интервалы в днях (default: [3, 14, 45, 90])

**Статус**: 🔴 Не реализован

---

### 6. Search Request
**Цель**: Обработка поиска из Telegram

**Триггер**: Webhook (Telegram команда /search)

**Шаги**:
1. Получение query из Telegram
2. POST `/knowledge/search` с параметрами
3. Форматирование результатов
4. Отправка в Telegram (inline keyboard для детализации)

**Статус**: 🔴 Не реализован

---

### 7. Stats Request
**Цель**: Статистика по базе знаний

**Триггер**: Webhook (Telegram команда /stats)

**Шаги**:
1. GET общее количество knowledge
2. GET количество по sources
3. GET количество по topics
4. GET статистику review (сколько повторений)
5. Форматирование и отправка

**Статус**: 🔴 Не реализован

---

## Структура workflow файлов

Каждый workflow документируется в отдельном файле:

```
workflows/
├── 01-telegram-import.md
├── 02-knowledge-analysis.md
├── 03-embedding-generation.md
├── 04-daily-recommendations.md
├── 05-review-queue.md
├── 06-search-request.md
└── 07-stats-request.md
```

## Экспорт из n8n

После создания workflow в n8n:
1. Export workflow → JSON
2. Сохранить в `infra/n8n/workflows/<name>.json`
3. Обновить документацию в `docs/workflows/<name>.md`

## Переменные окружения

Все чувствительные данные через Environment Variables в n8n:
- `TELEGRAM_BOT_TOKEN`
- `OPENAI_API_KEY`
- `CLAUDE_API_KEY`
- `KNOWLEDGE_API_URL`
- `AI_GATEWAY_URL`

## Мониторинг workflows

n8n предоставляет:
- Execution history
- Error tracking
- Performance metrics

Рекомендуется настроить webhook для критичных ошибок → уведомление в Telegram.

## Следующие шаги

1. Создать детальную документацию по каждому workflow
2. Реализовать workflows в n8n
3. Экспортировать в JSON для версионирования
4. Настроить мониторинг

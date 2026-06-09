# Интеграции

> Как подключать новые источники данных к Personal AI Assistant

## Принцип подключения источников

### Правило: один источник = один workflow в n8n

Добавление нового источника **НЕ требует** изменения кода существующих сервисов.

Достаточно:
1. Создать новый workflow в n8n
2. Использовать существующий `POST /knowledge/ingest`
3. Настроить метаданные источника

## Текущие интеграции

### 1. Telegram Groups ✅ (v1)

**Статус**: В разработке

**Workflow**: `telegram-import.json`

**Источник данных**:
- Telegram Bot API
- Webhook для получения сообщений

**Формат данных**:
```json
{
  "source": "telegram",
  "source_id": "chat_id:message_id",
  "raw_content": "текст сообщения",
  "metadata": {
    "chat_id": -1001234567890,
    "chat_title": "AI Discussions",
    "message_id": 12345,
    "author": "username",
    "timestamp": "2026-06-09T10:00:00Z",
    "has_media": false
  }
}
```

**Особенности**:
- Только текстовые сообщения в v1
- Фильтрация по whitelist групп
- Rate limiting: 1 сообщение в секунду

---

### 2. Pocket 🔄 (планируется)

**Статус**: Запланировано

**Workflow**: `pocket-import.json`

**Источник данных**:
- Pocket API
- Polling (cron: каждый час)

**Формат данных**:
```json
{
  "source": "pocket",
  "source_id": "pocket_item_id",
  "raw_content": "article text",
  "metadata": {
    "url": "https://example.com/article",
    "title": "Article Title",
    "excerpt": "Short description",
    "tags": ["tag1", "tag2"],
    "saved_at": "2026-06-09T10:00:00Z",
    "word_count": 1500
  }
}
```

**Что нужно**:
1. Pocket API credentials
2. OAuth flow для авторизации
3. Webhook для real-time синхронизации

---

### 3. Browser Bookmarks 🔄 (планируется)

**Статус**: Запланировано

**Workflow**: `bookmarks-import.json`

**Источник данных**:
- Browser Extension (Chrome/Firefox)
- REST API для синхронизации

**Формат данных**:
```json
{
  "source": "bookmarks",
  "source_id": "bookmark_id",
  "raw_content": "page content (parsed)",
  "metadata": {
    "url": "https://example.com",
    "title": "Page Title",
    "folder": "AI/Research",
    "tags": ["research", "ai"],
    "saved_at": "2026-06-09T10:00:00Z"
  }
}
```

**Что нужно**:
1. Browser Extension
2. Content extraction (Readability.js)
3. Sync API endpoint

---

### 4. YouTube (планируется)

**Статус**: Идея

**Workflow**: `youtube-import.json`

**Источник данных**:
- YouTube Data API
- Playlist или Saved Videos

**Формат данных**:
```json
{
  "source": "youtube",
  "source_id": "video_id",
  "raw_content": "transcript",
  "metadata": {
    "video_id": "dQw4w9WgXcQ",
    "title": "Video Title",
    "channel": "Channel Name",
    "duration": 360,
    "saved_at": "2026-06-09T10:00:00Z"
  }
}
```

**Что нужно**:
1. YouTube API Key
2. Transcript API (youtube-transcript-api)

---

### 5. RSS Feeds (планируется)

**Статус**: Идея

**Workflow**: `rss-import.json`

**Источник данных**:
- RSS/Atom feeds
- Polling (cron: каждые 30 минут)

**Формат данных**:
```json
{
  "source": "rss",
  "source_id": "feed_url:item_guid",
  "raw_content": "article content",
  "metadata": {
    "feed_url": "https://example.com/feed",
    "feed_title": "Blog Name",
    "article_url": "https://example.com/post",
    "title": "Post Title",
    "author": "Author Name",
    "published_at": "2026-06-09T10:00:00Z"
  }
}
```

---

## Как добавить новый источник

### Шаг 1: Планирование

Определить:
- Название источника (например: `notion`)
- Метод получения данных (webhook, polling, API)
- Формат метаданных
- Частота синхронизации

### Шаг 2: Создание workflow в n8n

1. Открыть n8n → Create New Workflow
2. Настроить триггер:
   - **Webhook** для real-time (Telegram, Browser Extension)
   - **Cron** для polling (RSS, Pocket)
3. Добавить логику обработки:
   - Извлечение данных
   - Трансформация в единый формат
   - Вызов `POST /knowledge/ingest`

### Шаг 3: Настройка метаданных

Обязательные поля:
```json
{
  "source": "название_источника",
  "source_id": "уникальный_ID_в_источнике",
  "raw_content": "исходный_контент",
  "metadata": {
    // специфичные поля источника
  }
}
```

### Шаг 4: Тестирование

1. Запустить workflow вручную
2. Проверить в PostgreSQL → таблица `knowledge`
3. Проверить AI анализ → `summary`, `topics`
4. Проверить embeddings → Qdrant

### Шаг 5: Документация

Создать файл `docs/integrations/<source>.md`:
- Описание источника
- Формат данных
- Инструкция по настройке
- Примеры

### Шаг 6: Экспорт

1. Export workflow → JSON
2. Сохранить в `infra/n8n/workflows/<source>-import.json`
3. Добавить в README

---

## Стандартный формат для Knowledge API

### POST /knowledge/ingest

**Request**:
```json
{
  "source": "string",           // название источника
  "source_id": "string",         // уникальный ID
  "raw_content": "string",       // исходный контент
  "metadata": {                  // произвольные метаданные
    "key": "value"
  }
}
```

**Response**:
```json
{
  "id": "uuid",
  "source": "telegram",
  "created_at": "2026-06-09T10:00:00Z",
  "status": "processing"
}
```

---

## Примеры интеграций

### Пример 1: Webhook (Telegram)

```javascript
// n8n HTTP Request Node
{
  "method": "POST",
  "url": "{{ $env.KNOWLEDGE_API_URL }}/knowledge/ingest",
  "body": {
    "source": "telegram",
    "source_id": "{{ $json.chat.id }}:{{ $json.message_id }}",
    "raw_content": "{{ $json.text }}",
    "metadata": {
      "chat_title": "{{ $json.chat.title }}",
      "author": "{{ $json.from.username }}"
    }
  }
}
```

### Пример 2: Polling (RSS)

```javascript
// n8n Cron Trigger: 0 */30 * * * (каждые 30 минут)
// RSS Feed Node → Parse → Transform → HTTP Request

{
  "method": "POST",
  "url": "{{ $env.KNOWLEDGE_API_URL }}/knowledge/ingest",
  "body": {
    "source": "rss",
    "source_id": "{{ $json.feed_url }}:{{ $json.guid }}",
    "raw_content": "{{ $json.content }}",
    "metadata": {
      "feed_title": "{{ $json.feed_title }}",
      "article_url": "{{ $json.link }}"
    }
  }
}
```

---

## Checklist для новой интеграции

- [ ] Workflow создан в n8n
- [ ] Формат данных соответствует стандарту
- [ ] Тестирование (минимум 10 записей)
- [ ] Документация в `docs/integrations/<source>.md`
- [ ] Export workflow → `infra/n8n/workflows/`
- [ ] Обновлен `README.md` в integrations
- [ ] Добавлены необходимые credentials в n8n

---

## Следующие шаги

1. Завершить интеграцию Telegram Groups
2. Реализовать Pocket
3. Создать Browser Extension для Bookmarks

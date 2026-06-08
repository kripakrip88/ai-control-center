# Настройка Telegram бота через n8n

## Быстрый старт

### 1. Запуск n8n

```bash
cd /Users/antonkarneev/Projects/ai-control-center

# Запустить n8n
bash scripts/start-n8n.sh

# Или вручную
docker-compose -f infra/docker/docker-compose.dev.yml up -d postgres n8n
```

### 2. Доступ к интерфейсу

Откройте в браузере: **http://localhost:5678**

**Данные для входа:**
- Логин: `admin`
- Пароль: `n8n_admin_2024`

(Можно изменить в `.env` файле: `N8N_USER` и `N8N_PASSWORD`)

---

## Создание Telegram бота в n8n

### Шаг 1: Получение токена бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям:
   - Придумайте имя бота (например: "AI Control Assistant")
   - Придумайте username (например: "aicontrol_assistant_bot")
4. Получите токен вида: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. **Сохраните токен** - он понадобится в n8n

### Шаг 2: Создание Workflow в n8n

1. **Откройте n8n:** http://localhost:5678
2. **Войдите** с данными admin/n8n_admin_2024
3. **Создайте новый Workflow:**
   - Нажмите "+ Workflow" в левом верхнем углу
   - Назовите его "Telegram Bot Assistant"

### Шаг 3: Добавление Telegram Trigger

1. **Добавьте ноду Telegram Trigger:**
   - Нажмите "+" на canvas
   - Найдите "Telegram Trigger"
   - Выберите её

2. **Настройте Credentials:**
   - В ноде нажмите "Create New Credentials"
   - Вставьте токен бота (из BotFather)
   - Нажмите "Create"

3. **Настройте триггер:**
   - Updates: `Message`
   - Нажмите "Listen for Test Event"
   - Отправьте сообщение боту в Telegram
   - n8n должен поймать событие

### Шаг 4: Добавление логики обработки

#### Вариант A: Простой Echo бот

```
[Telegram Trigger] → [Code Node] → [Telegram Node]
```

**Code Node:**
```javascript
// Получаем текст сообщения
const messageText = $input.item.json.message.text;
const chatId = $input.item.json.message.chat.id;

// Формируем ответ
return {
  json: {
    chatId: chatId,
    text: `Вы написали: ${messageText}`
  }
};
```

**Telegram Node:**
- Operation: `Send Message`
- Chat ID: `{{$json.chatId}}`
- Text: `{{$json.text}}`

#### Вариант B: Интеграция с AI (Claude API)

```
[Telegram Trigger] → [HTTP Request to Claude API] → [Telegram Send]
```

**HTTP Request Node:**
- Method: `POST`
- URL: `https://api.anthropic.com/v1/messages`
- Authentication: Header Auth
  - Name: `x-api-key`
  - Value: `{{$env.ANTHROPIC_API_KEY}}`
- Headers:
  - `anthropic-version`: `2023-06-01`
  - `content-type`: `application/json`
- Body:
```json
{
  "model": "claude-sonnet-4-5",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "{{$json.message.text}}"
    }
  ]
}
```

**Telegram Send Node:**
- Chat ID: `{{$node["Telegram Trigger"].json.message.chat.id}}`
- Text: `{{$json.content[0].text}}`

#### Вариант C: Webhook к вашему AI сервису

```
[Telegram Trigger] → [HTTP Request to AI Service] → [Telegram Send]
```

**HTTP Request:**
- Method: `POST`
- URL: `http://ai-polygon:4000/api/telegram/message`
- Body:
```json
{
  "chatId": "{{$json.message.chat.id}}",
  "userId": "{{$json.message.from.id}}",
  "userName": "{{$json.message.from.first_name}}",
  "text": "{{$json.message.text}}"
}
```

### Шаг 5: Активация бота

1. **Сохраните Workflow:** Ctrl+S или кнопка "Save"
2. **Активируйте:** Переключатель "Active" в правом верхнем углу
3. **Протестируйте:** Напишите боту в Telegram

---

## Продвинутые возможности

### 1. Команды бота

Добавьте Switch ноду после Telegram Trigger:

```
[Telegram Trigger] → [Switch] → [разные обработчики]
```

**Switch Node условия:**
- Если `message.text` = `/start` → Welcome сообщение
- Если `message.text` = `/help` → Список команд
- Если `message.text` начинается с `/order` → Создание заказа
- Иначе → AI обработка

### 2. Обработка документов

```
[Telegram Trigger (Document)] → [Download File] → [HTTP to AI Service] → [Response]
```

### 3. Inline кнопки

**Telegram Send Node:**
```json
{
  "chatId": "{{$json.chatId}}",
  "text": "Выберите действие:",
  "reply_markup": {
    "inline_keyboard": [
      [
        {"text": "Создать заказ", "callback_data": "create_order"}
      ],
      [
        {"text": "Мои заказы", "callback_data": "my_orders"}
      ]
    ]
  }
}
```

Добавьте отдельный Telegram Trigger для `callback_query`.

### 4. Сохранение контекста

Используйте `Postgres Node` для сохранения истории диалогов:

```sql
INSERT INTO telegram_chats (chat_id, user_id, message, created_at)
VALUES ({{$json.message.chat.id}}, {{$json.message.from.id}}, '{{$json.message.text}}', NOW())
```

---

## Интеграция с ERP системой

### Создание заказа через бота

**Workflow:**
```
[Telegram: /order] → [Ask for details] → [Parse response] → [HTTP to ERP API] → [Confirm]
```

**HTTP Node к ERP:**
```javascript
POST http://erp-web:3000/api/orders
Headers:
  Authorization: Bearer {{$env.ERP_API_TOKEN}}
Body:
{
  "orderNumber": "TG-{{$json.message.message_id}}",
  "status": "DRAFT",
  "companyId": "{{$env.DEFAULT_COMPANY_ID}}",
  "notes": "Создано через Telegram бота: {{$json.message.text}}"
}
```

---

## Полезные команды

### Логи n8n
```bash
docker-compose -f infra/docker/docker-compose.dev.yml logs -f n8n
```

### Перезапуск
```bash
docker-compose -f infra/docker/docker-compose.dev.yml restart n8n
```

### Остановка
```bash
docker-compose -f infra/docker/docker-compose.dev.yml down
```

### Backup workflows
```bash
docker exec aicontrol-n8n n8n export:workflow --all --output=/backup/workflows.json
```

### Восстановление
```bash
docker exec aicontrol-n8n n8n import:workflow --input=/backup/workflows.json
```

---

## Troubleshooting

### Бот не отвечает

1. Проверьте что workflow активен (зеленый переключатель)
2. Проверьте логи: `docker logs aicontrol-n8n`
3. Убедитесь что токен правильный
4. Проверьте что бот не забанен через BotFather

### Webhook ошибки

Если n8n за NAT/firewall, Telegram не сможет отправлять webhook'и.

**Решение:** Используйте Polling вместо Webhook:
- В Telegram Trigger выберите "Updates: Message"
- n8n сам будет опрашивать Telegram API

### PostgreSQL connection failed

```bash
# Проверьте что PostgreSQL запущен
docker ps | grep postgres

# Проверьте переменные окружения
docker-compose -f infra/docker/docker-compose.dev.yml config
```

---

## Примеры готовых ботов

### 1. AI Ассистент с памятью

Использует Qdrant для векторного поиска по истории:
```
[Message] → [Embed text] → [Search Qdrant] → [Context + AI] → [Reply]
```

### 2. OCR бот для документов

```
[Document received] → [Download] → [Tesseract OCR] → [AI extraction] → [Save to ERP]
```

### 3. Статус заказов

```
[/status ORDER-123] → [Query ERP DB] → [Format response] → [Reply with status]
```

---

## Следующие шаги

1. ✅ Запустите n8n: `bash scripts/start-n8n.sh`
2. ✅ Создайте бота через BotFather
3. ✅ Настройте первый Workflow
4. 🚀 Интегрируйте с вашими сервисами (ERP, AI)

**Вопросы?** Пишите в Issues или чат поддержки.

# Roadmap: Personal AI Assistant Platform

> План поэтапной реализации n8n-центричной платформы управления знаниями

## 🎯 Главная цель

Создать систему, которой владелец (не программист) сможет **самостоятельно управлять** через n8n workflows через 6 месяцев.

---

## Phase 1: Фундамент (MVP) ⏱ 2-3 недели

### 1.1 Инфраструктура
- [x] Структура проекта
- [x] Docker Compose конфигурация
- [x] PostgreSQL схема
- [x] Документация (architecture, workflows, integrations)
- [ ] Скрипты setup/backup/restore
- [ ] `.env` конфигурация

**Результат**: `docker-compose up` запускает все сервисы

### 1.2 Knowledge Hub API (базовая версия)
- [ ] Основной сервер (Express + TypeScript)
- [ ] `POST /knowledge/ingest` — прием данных
- [ ] `GET /knowledge/:id` — получение по ID
- [ ] `GET /health`, `/version`, `/docs`
- [ ] Подключение к PostgreSQL
- [ ] Базовые миграции

**Результат**: API принимает и сохраняет данные

### 1.3 AI Gateway (базовая версия)
- [ ] Основной сервер (Express + TypeScript)
- [ ] `POST /ai/summarize` — OpenAI integration
- [ ] `POST /ai/classify` — извлечение topics
- [ ] Redis кеширование
- [ ] `GET /health`, `/version`, `/docs`

**Результат**: API делает summarization и classification

### 1.4 Telegram Bot (базовая версия)
- [ ] Telegraf setup
- [ ] Команда `/start`
- [ ] Команда `/search` (базовый поиск)
- [ ] Webhook для импорта сообщений

**Результат**: Бот отвечает на команды

---

## Phase 2: Первый источник данных (Telegram) ⏱ 1-2 недели

### 2.1 n8n Workflow: Telegram Import
- [ ] Настройка Telegram Bot в n8n
- [ ] Webhook триггер
- [ ] Фильтрация сообщений (только текст)
- [ ] Извлечение метаданных
- [ ] POST к Knowledge API
- [ ] Экспорт workflow → JSON

**Результат**: Сообщения из Telegram сохраняются в БД

### 2.2 n8n Workflow: Knowledge Analysis
- [ ] Триггер на новый knowledge
- [ ] Вызов AI Gateway (summarize)
- [ ] Вызов AI Gateway (classify)
- [ ] Обновление knowledge в БД
- [ ] Экспорт workflow → JSON

**Результат**: Новые записи автоматически анализируются

### 2.3 n8n Workflow: Embedding Generation
- [ ] Добавить `POST /ai/embed` в AI Gateway
- [ ] Подключение к Qdrant
- [ ] Workflow: триггер → embed → save to Qdrant
- [ ] Экспорт workflow → JSON

**Результат**: Все записи имеют embeddings для поиска

### 2.4 Тестирование
- [ ] Импорт 100+ сообщений из тестовой группы
- [ ] Проверка анализа
- [ ] Проверка embeddings в Qdrant

---

## Phase 3: Поиск и рекомендации ⏱ 1 неделя

### 3.1 Семантический поиск
- [ ] `GET /knowledge/search` в Knowledge API
- [ ] Интеграция с Qdrant (vector search)
- [ ] Фильтры (по источнику, темам, датам)
- [ ] Telegram команда `/search`

**Результат**: Поиск работает через Telegram

### 3.2 Daily Recommendations
- [ ] `GET /knowledge/recommendations` в Knowledge API
- [ ] n8n Workflow: Daily Recommendations (cron)
- [ ] Форматирование дайджеста
- [ ] Отправка в Telegram
- [ ] Экспорт workflow → JSON

**Результат**: Каждый день приходит дайджест

### 3.3 Статистика
- [ ] Команда `/stats` в Telegram Bot
- [ ] Использование `knowledge_stats` view
- [ ] Визуализация (текстовая)

**Результат**: `/stats` показывает статистику базы

---

## Phase 4: Review System (Spaced Repetition) ⏱ 1 неделя

### 4.1 Review Queue Logic
- [ ] Функция `calculate_next_review()` (уже есть в схеме)
- [ ] Триггер обновления `next_review_at`
- [ ] `GET /knowledge/reviews/due` endpoint

### 4.2 n8n Workflow: Review Queue
- [ ] Cron триггер (ежедневно)
- [ ] Запрос материалов на повторение
- [ ] Отправка в Telegram с inline кнопками
- [ ] Callback handler (reviewed / skip)
- [ ] Обновление `last_reviewed`, `review_count`
- [ ] Экспорт workflow → JSON

**Результат**: Система интервальных повторений работает

### 4.3 Telegram команда `/review`
- [ ] Ручной запрос материалов на повторение
- [ ] Интерактивный интерфейс

**Результат**: Можно вручную запросить повторение

---

## Phase 5: Расширение источников ⏱ 2 недели

### 5.1 Pocket Integration
- [ ] Документация в `docs/integrations/pocket.md`
- [ ] n8n Workflow: Pocket Import (polling)
- [ ] OAuth для Pocket API
- [ ] Экспорт workflow → JSON

**Результат**: Статьи из Pocket автоматически импортируются

### 5.2 Browser Bookmarks
- [ ] Browser Extension (Chrome/Firefox)
- [ ] Sync API endpoint в Knowledge API
- [ ] n8n Workflow: Bookmarks Import
- [ ] Документация
- [ ] Экспорт workflow → JSON

**Результат**: Закладки импортируются одним кликом

---

## Phase 6: Улучшения и оптимизация ⏱ 1-2 недели

### 6.1 UI улучшения (Telegram)
- [ ] Inline keyboards для навигации
- [ ] Pagination для результатов поиска
- [ ] Rich formatting (markdown)
- [ ] Команда `/topic` с фильтрацией

### 6.2 Производительность
- [ ] Индексы в PostgreSQL
- [ ] Batch обработка embeddings
- [ ] Redis кеширование для поиска
- [ ] Rate limiting

### 6.3 Мониторинг
- [ ] Health checks для всех сервисов
- [ ] Логирование (JSON формат)
- [ ] Webhook уведомления об ошибках в n8n
- [ ] Prometheus/Grafana (опционально)

---

## Phase 7: Документация и передача управления ⏱ 1 неделя

### 7.1 Финальная документация
- [ ] Детальное описание каждого workflow
- [ ] Скриншоты из n8n
- [ ] Видео-гайд по управлению
- [ ] FAQ и Troubleshooting

### 7.2 Автоматизация документации
- [ ] Скрипт автогенерации docs из n8n workflows
- [ ] CI/CD для обновления документации

### 7.3 Обучение владельца
- [ ] Как создать новый workflow
- [ ] Как подключить новый источник
- [ ] Как изменить логику процессов
- [ ] Как читать логи и отлавливать ошибки

**Результат**: Владелец может самостоятельно управлять системой

---

## Будущие улучшения (Post-MVP)

### Дополнительные источники
- [ ] YouTube (с транскрипцией)
- [ ] RSS Feeds
- [ ] Twitter/X
- [ ] Notion
- [ ] Google Drive
- [ ] Emails (IMAP)

### Расширенная аналитика
- [ ] Визуализация графа знаний
- [ ] Автоматическая кластеризация
- [ ] Рекомендации "похожие материалы"
- [ ] Trending topics

### AI улучшения
- [ ] Multi-model support (Claude + GPT-4 + Llama)
- [ ] Fine-tuning на личных данных
- [ ] Автоматическое создание связей между записями
- [ ] RAG (Retrieval-Augmented Generation)

### Интеграции
- [ ] Obsidian plugin
- [ ] Notion sync
- [ ] Web клиппер (расширение браузера)
- [ ] Mobile app (React Native)

### Безопасность
- [ ] Шифрование данных at rest
- [ ] OAuth авторизация
- [ ] RBAC (если появятся другие пользователи)

---

## Метрики успеха

### Фаза 1-4 (MVP)
- ✅ Система работает в Docker
- ✅ Telegram импорт работает автоматически
- ✅ AI анализ работает
- ✅ Поиск находит релевантные результаты
- ✅ Review system отправляет повторения

### Фаза 5-6 (Расширение)
- ✅ Минимум 2 источника данных подключено
- ✅ 1000+ записей в базе знаний
- ✅ Все workflows визуализированы в n8n

### Фаза 7 (Передача)
- ✅ Владелец самостоятельно создал новый workflow
- ✅ Владелец подключил новый источник без помощи
- ✅ Документация актуальна и понятна

---

## Текущий статус

**Дата**: 2026-06-09

**Фаза**: Phase 1 (Фундамент)

**Готово**:
- [x] Структура проекта
- [x] Docker Compose
- [x] PostgreSQL схема
- [x] Документация (architecture, workflows, integrations)

**В работе**:
- [ ] Knowledge Hub API
- [ ] AI Gateway
- [ ] Telegram Bot

**Следующий шаг**: Реализовать базовую версию Knowledge Hub API

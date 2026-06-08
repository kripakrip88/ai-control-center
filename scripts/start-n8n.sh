#!/bin/bash

# Скрипт для быстрого запуска n8n

echo "🚀 Запуск n8n для AI Control Center..."
echo ""

cd "$(dirname "$0")/.."

# Проверка .env файла
if [ ! -f .env ]; then
    echo "⚠️  .env файл не найден. Создаю из .env.example..."
    cp .env.example .env
    echo "✅ Создан .env файл. Проверьте настройки!"
    echo ""
fi

# Запуск только n8n и PostgreSQL
docker-compose -f infra/docker/docker-compose.dev.yml up -d postgres n8n

echo ""
echo "⏳ Ожидание запуска сервисов..."
sleep 5

# Проверка статуса
if docker ps | grep -q "aicontrol-n8n"; then
    echo ""
    echo "✅ n8n успешно запущен!"
    echo ""
    echo "📍 Доступ к n8n:"
    echo "   URL: http://localhost:5678"
    echo "   Логин: admin"
    echo "   Пароль: n8n_admin_2024"
    echo ""
    echo "💡 Для настройки Telegram бота:"
    echo "   1. Откройте http://localhost:5678"
    echo "   2. Войдите с указанными выше данными"
    echo "   3. Создайте новый Workflow"
    echo "   4. Добавьте Telegram Trigger"
    echo ""
    echo "📋 Полезные команды:"
    echo "   docker-compose -f infra/docker/docker-compose.dev.yml logs -f n8n  # Логи"
    echo "   docker-compose -f infra/docker/docker-compose.dev.yml down        # Остановить"
    echo ""
else
    echo ""
    echo "❌ Ошибка запуска n8n. Проверьте логи:"
    echo "   docker-compose -f infra/docker/docker-compose.dev.yml logs n8n"
    echo ""
fi

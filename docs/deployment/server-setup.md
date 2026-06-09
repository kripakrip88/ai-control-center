# Настройка Production сервера для AI Control Center

## 🎯 Цель

Развернуть все сервисы на **erppark.ru** (5.35.92.112) чтобы пользоваться с любого устройства.

---

## 📋 Что будет работать на сервере

| Сервис | Порт | URL | Назначение |
|--------|------|-----|------------|
| **Memory Service** | 8000 | http://erppark.ru:8000 | mem0 API для долгосрочной памяти |
| **ERP Web** | 3000 | http://erppark.ru:3000 | Основная ERP система |
| **AI Polygon** | 4000 | http://erppark.ru:4000 | AI сервис для извлечения данных |
| **n8n** | 5678 | http://erppark.ru:5678 | Workflow автоматизация |
| **Qdrant** | 6333 | http://erppark.ru:6333 | Векторная БД (внутренний) |
| **Ollama** | 11434 | http://erppark.ru:11434 | LLM (внутренний) |
| **PostgreSQL** | 5432 | localhost:5432 | База данных (внутренний) |

---

## 🚀 Быстрый старт (автоматический деплой)

### 1. Добавить GitHub Secrets

Перейти: https://github.com/kripakrip88/ai-control-center/settings/secrets/actions

Добавить 3 секрета:
- `DEPLOY_HOST` = `5.35.92.112` или `erppark.ru`
- `DEPLOY_USER` = `root` (или имя пользователя SSH)
- `DEPLOY_SSH_KEY` = приватный SSH ключ для доступа к серверу

**Как получить SSH ключ** - см. [github-secrets-setup.md](github-secrets-setup.md)

### 2. Запустить деплой

Два варианта:

**A) Автоматически при push:**
```bash
git add .
git commit -m "feat: add production deployment"
git push origin main
```

**B) Вручную через GitHub Actions:**
1. Открыть: https://github.com/kripakrip88/ai-control-center/actions
2. Выбрать **Deploy Memory Service**
3. Нажать **Run workflow** → **Run workflow**

---

## 🛠 Ручная настройка сервера (если нужно)

### Подключение к серверу

```bash
ssh root@erppark.ru
# или
ssh root@5.35.92.112
```

### 1. Установка зависимостей

```bash
# Обновление системы
apt update && apt upgrade -y

# Docker (если еще не установлен)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# pnpm
npm install -g pnpm

# Python 3.11 (если еще нет)
add-apt-repository ppa:deadsnakes/ppa -y
apt install -y python3.11 python3.11-venv python3.11-dev

# Ollama
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Клонирование репозитория

```bash
# Создание директории
mkdir -p /var/www
cd /var/www

# Клонирование
git clone https://github.com/kripakrip88/ai-control-center.git
cd ai-control-center

# Копирование .env
cp .env.example .env
nano .env  # Отредактировать настройки
```

### 3. Настройка .env для production

```bash
# Основные настройки
NODE_ENV=production
POSTGRES_PASSWORD=СИЛЬНЫЙ_ПАРОЛЬ_ЗДЕСЬ
N8N_PASSWORD=СИЛЬНЫЙ_ПАРОЛЬ_ЗДЕСЬ
ANTHROPIC_API_KEY=sk-ant-api03-... # Ваш ключ

# Хосты (для Docker внутри сети)
POSTGRES_HOST=postgres
QDRANT_HOST=qdrant
OLLAMA_BASE_URL=http://ollama:11434
```

### 4. Запуск инфраструктуры (Docker)

```bash
cd /var/www/ai-control-center/infra/docker

# Запуск всех инфраструктурных сервисов
docker-compose -f docker-compose.prod.yml up -d postgres qdrant ollama n8n

# Проверка что все запущено
docker ps
```

### 5. Скачивание модели Ollama

```bash
# Дождаться запуска Ollama (~30 сек)
sleep 30

# Скачать модель llama3.2 (~2GB, может занять 10-30 минут)
docker exec aicontrol-ollama ollama pull llama3.2

# Проверка
docker exec aicontrol-ollama ollama list
```

### 6. Запуск Memory Service

**Вариант A: Через systemd (рекомендуется)**

```bash
cd /var/www/ai-control-center/services/memory-service

# Создание виртуального окружения
python3.11 -m venv .venv
source .venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Создание systemd сервиса
sudo tee /etc/systemd/system/memory-service.service > /dev/null <<EOF
[Unit]
Description=Memory Service (mem0 + Qdrant)
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/ai-control-center/services/memory-service
Environment="PATH=/var/www/ai-control-center/services/memory-service/.venv/bin:/usr/bin"
Environment="QDRANT_HOST=localhost"
Environment="QDRANT_PORT=6333"
Environment="OLLAMA_BASE_URL=http://localhost:11434"
ExecStart=/var/www/ai-control-center/services/memory-service/.venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Запуск
sudo systemctl daemon-reload
sudo systemctl enable memory-service
sudo systemctl start memory-service

# Проверка
sudo systemctl status memory-service
curl http://localhost:8000/health
```

**Вариант B: Через Docker**

```bash
cd /var/www/ai-control-center/services/memory-service
docker build -t memory-service .
docker run -d \
  --name memory-service \
  --network docker_aicontrol-net \
  -p 8000:8000 \
  -e QDRANT_HOST=qdrant \
  -e QDRANT_PORT=6333 \
  -e OLLAMA_BASE_URL=http://ollama:11434 \
  --restart unless-stopped \
  memory-service
```

### 7. Настройка Nginx (опционально)

Для доступа через красивые URL (https://erppark.ru/memory вместо :8000):

```nginx
# /etc/nginx/sites-available/aicontrol
server {
    listen 80;
    server_name erppark.ru;

    # Memory Service
    location /memory/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # ERP
    location /erp/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # AI Polygon
    location /ai/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # n8n
    location /n8n/ {
        proxy_pass http://localhost:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

Активация:
```bash
sudo ln -s /etc/nginx/sites-available/aicontrol /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Проверка что все работает

### Memory Service
```bash
curl http://erppark.ru:8000/health

# Добавить память
curl -X POST http://erppark.ru:8000/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test",
    "content": "Тестовая память с сервера!"
  }'

# Поиск
curl -X POST http://erppark.ru:8000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test",
    "query": "тест"
  }'
```

### Docker сервисы
```bash
docker ps  # Должны быть запущены: postgres, qdrant, ollama, n8n

curl http://localhost:6333/  # Qdrant
curl http://localhost:11434/  # Ollama
curl http://localhost:5678/  # n8n
```

### Логи
```bash
# Memory Service
sudo journalctl -u memory-service -f

# Docker сервисы
docker logs -f aicontrol-qdrant
docker logs -f aicontrol-ollama
docker logs -f aicontrol-n8n
```

---

## 📱 Использование с разных устройств

После деплоя вы можете использовать сервисы откуда угодно:

### С компьютера
```bash
curl http://erppark.ru:8000/api/memory/add -X POST ...
```

### С телефона (через Telegram бот)
Telegram бот будет обращаться к `http://erppark.ru:8000` автоматически.

### Через API из других приложений
```javascript
fetch('http://erppark.ru:8000/api/memory/search', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    project_id: 'my-app',
    query: 'что-то важное'
  })
})
```

---

## 🔧 Обслуживание

### Обновление кода
```bash
cd /var/www/ai-control-center
git pull origin main
sudo systemctl restart memory-service
```

### Перезапуск сервисов
```bash
# Memory Service
sudo systemctl restart memory-service

# Docker сервисы
cd /var/www/ai-control-center/infra/docker
docker-compose -f docker-compose.prod.yml restart
```

### Резервное копирование
```bash
# PostgreSQL
docker exec aicontrol-postgres pg_dump -U aicontrol aicontrol_db > backup.sql

# Qdrant
docker exec aicontrol-qdrant tar czf - /qdrant/storage > qdrant-backup.tar.gz

# n8n workflows
docker exec aicontrol-n8n tar czf - /home/node/.n8n > n8n-backup.tar.gz
```

---

## 🎉 Готово!

После выполнения всех шагов:
- ✅ Memory Service доступен на **http://erppark.ru:8000**
- ✅ Все работает с любого устройства
- ✅ Автоматический деплой при push в GitHub
- ✅ Systemd автоматически перезапускает сервисы при сбоях

Используйте с компьютера, телефона, планшета - откуда угодно! 🚀

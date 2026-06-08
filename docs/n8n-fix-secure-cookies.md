# Исправление проблемы с n8n secure cookies

## Проблема
n8n не пускает по HTTP, требует HTTPS или отключения secure cookies.

## Решение 1: Отключить secure cookies (быстро)

На сервере отредактируйте docker-compose.yml или .env:

### Вариант A: В docker-compose.yml

Найдите секцию n8n и добавьте переменную:

```yaml
n8n:
  image: n8nio/n8n:latest
  environment:
    - N8N_SECURE_COOKIE=false  # <- добавьте эту строку
    - N8N_HOST=0.0.0.0
    - N8N_PORT=5678
    # ... остальные переменные
```

### Вариант B: В .env файле

Добавьте или измените:

```bash
N8N_SECURE_COOKIE=false
```

### Перезапустите n8n:

```bash
cd /path/to/your/project
docker-compose restart n8n

# или
docker restart <n8n-container-name>
```

## Решение 2: Настроить HTTPS (рекомендуется для production)

### С помощью Nginx + Let's Encrypt:

1. Установите certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Получите SSL сертификат:
```bash
sudo certbot --nginx -d erppark.ru
```

3. Nginx конфигурация для n8n:

```nginx
server {
    listen 80;
    server_name erppark.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name erppark.ru;

    ssl_certificate /etc/letsencrypt/live/erppark.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erppark.ru/privkey.pem;

    location /n8n/ {
        proxy_pass http://localhost:5678/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

4. Обновите docker-compose.yml:
```yaml
n8n:
  environment:
    - N8N_PROTOCOL=https
    - N8N_HOST=erppark.ru
    - N8N_PORT=443
    - N8N_PATH=/n8n/
    - WEBHOOK_URL=https://erppark.ru/n8n/
```

5. Перезапустите:
```bash
sudo systemctl reload nginx
docker-compose restart n8n
```

Теперь доступ: **https://erppark.ru/n8n/**

## Проверка

После любого решения:
1. Откройте https://erppark.ru:5678 (или https://erppark.ru/n8n/)
2. Должна открыться форма логина без ошибки
3. Войдите: admin / metaln8n

## Troubleshooting

### Ошибка все еще есть?
```bash
# Проверьте переменные окружения
docker exec <n8n-container> env | grep N8N

# Смотрите логи
docker logs <n8n-container>
```

### Проверка SSL сертификата
```bash
openssl s_client -connect erppark.ru:443 -servername erppark.ru
```

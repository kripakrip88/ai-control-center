# Получение реальных credentials для БД

На сервере выполни команды чтобы найти настройки БД:

```bash
# Проверь старый ERP репозиторий
cat /var/www/erp-metal/.env 2>/dev/null | grep DATABASE

# Или старый AI Polygon
cat /opt/metalpro-ai-polygon/.env 2>/dev/null | grep DATABASE
cat /root/metalpro-ai-polygon/.env 2>/dev/null | grep DATABASE

# Или глобальные env
env | grep DATABASE

# Или посмотри PostgreSQL пользователей
sudo -u postgres psql -c "\du"

# Список баз данных
sudo -u postgres psql -c "\l"
```

После найденных credentials обнови GitHub Secret `DATABASE_URL` или скажи мне значения.

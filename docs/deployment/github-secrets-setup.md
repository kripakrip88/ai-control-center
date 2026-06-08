# Настройка GitHub Secrets для автодеплоя

## 📋 Необходимые Secrets

Для работы GitHub Actions нужно добавить 3 секрета в репозиторий:

| Secret Name | Описание | Где взять |
|-------------|----------|-----------|
| `DEPLOY_HOST` | IP адрес или домен сервера | `5.35.92.112` или `erppark.ru` |
| `DEPLOY_USER` | SSH пользователь | обычно `root` или `deploy` |
| `DEPLOY_SSH_KEY` | Приватный SSH ключ | с вашего сервера |

---

## 🔧 Как добавить Secrets

### Шаг 1: Откройте настройки репозитория

1. Перейдите на https://github.com/kripakrip88/ai-control-center
2. Нажмите **Settings** (вверху справа)
3. В левом меню выберите **Secrets and variables** → **Actions**

### Шаг 2: Добавьте DEPLOY_HOST

1. Нажмите **New repository secret**
2. Name: `DEPLOY_HOST`
3. Secret: `5.35.92.112` (или `erppark.ru`)
4. Нажмите **Add secret**

### Шаг 3: Добавьте DEPLOY_USER

1. Нажмите **New repository secret**
2. Name: `DEPLOY_USER`
3. Secret: `root` (или имя пользователя на сервере)
4. Нажмите **Add secret**

### Шаг 4: Добавьте DEPLOY_SSH_KEY

**Где взять SSH ключ:**

#### Вариант A: Использовать существующий ключ

Если у вас уже есть SSH ключ для деплоя (из старых репо):

1. Откройте старый репозиторий: https://github.com/kripakrip88/erp-metal/settings/secrets/actions
2. Скопируйте значение `DEPLOY_SSH_KEY` оттуда

#### Вариант B: Получить ключ с сервера

На вашем локальном компьютере (если у вас есть доступ к серверу):

```bash
# Показать приватный ключ
cat ~/.ssh/id_rsa

# Или если ключ называется по-другому
cat ~/.ssh/deploy_key
```

Скопируйте **весь** вывод, включая:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...весь ключ...
-----END OPENSSH PRIVATE KEY-----
```

#### Вариант C: Создать новый SSH ключ

На сервере:

```bash
# Создать новый ключ
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Добавить публичный ключ в authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Показать приватный ключ (это то что нужно для GitHub)
cat ~/.ssh/github_deploy
```

**Добавление в GitHub:**

1. Нажмите **New repository secret**
2. Name: `DEPLOY_SSH_KEY`
3. Secret: вставьте весь приватный SSH ключ
4. Нажмите **Add secret**

---

## ✅ Проверка

После добавления всех секретов вы должны видеть:

```
DEPLOY_HOST         Set 2 minutes ago
DEPLOY_USER         Set 1 minute ago
DEPLOY_SSH_KEY      Set 30 seconds ago
```

---

## 🧪 Тестирование деплоя

### Автоматический деплой (при push)

Просто сделайте изменение и запушьте:

```bash
# Небольшое изменение для теста
echo "# Test" >> apps/erp-web/README.md
git add apps/erp-web/README.md
git commit -m "test: trigger ERP deployment"
git push origin main
```

Workflow **Deploy ERP to Production** запустится автоматически.

### Ручной деплой

1. Перейдите на https://github.com/kripakrip88/ai-control-center/actions
2. Выберите **Deploy All Services**
3. Нажмите **Run workflow**
4. Введите `deploy-all` для подтверждения
5. Нажмите **Run workflow**

---

## 🔍 Просмотр логов деплоя

1. Перейдите на https://github.com/kripakrip88/ai-control-center/actions
2. Кликните на последний workflow run
3. Раскройте шаги для просмотра логов
4. Ищите ошибки (красным цветом)

---

## ⚠️ Troubleshooting

### Ошибка: "Permission denied (publickey)"

**Проблема:** GitHub не может подключиться к серверу.

**Решение:**
1. Проверьте что `DEPLOY_SSH_KEY` содержит **приватный** ключ (не публичный!)
2. Проверьте что публичный ключ добавлен в `~/.ssh/authorized_keys` на сервере
3. Проверьте права на файлы:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

### Ошибка: "Host key verification failed"

**Решение:** Добавьте в workflow опцию `StrictHostKeyChecking=no` (уже добавлено в наших workflows)

### Ошибка: "npm install failed"

**Проблема:** На сервере нет Node.js или npm.

**Решение:** Установите на сервере:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```

### Ошибка: "docker-compose: command not found"

**Проблема:** Docker Compose не установлен.

**Решение:**
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

---

## 📊 Сравнение с предыдущими деплоями

| Параметр | Старые репо | Новый монорепо |
|----------|-------------|----------------|
| Репозиториев | 2 (erp-metal, metalpro-ai-polygon) | 1 (ai-control-center) |
| Workflows | 8 (4+4) | 4 |
| Путь на сервере | `/var/www/erp-metal`, `/opt/metalpro-ai-polygon` | `/var/www/ai-control-center` |
| Независимые деплои | ✅ Да | ✅ Да (по path filters) |
| Общие зависимости | ❌ Дублируются | ✅ Shared packages |

---

## 🎯 Следующие шаги

1. ✅ Добавить Secrets в GitHub
2. ✅ Протестировать деплой
3. Создать `/var/www/ai-control-center` на сервере
4. Исправить n8n secure cookies
5. Обновить nginx конфиги (если нужно)
6. Архивировать старые репо

---

## 📞 Нужна помощь?

Если что-то не работает:
1. Проверьте логи в GitHub Actions
2. Подключитесь к серверу и проверьте логи:
   ```bash
   pm2 logs erp-metal
   docker-compose logs ai-polygon
   ```
3. Создайте issue в репозитории

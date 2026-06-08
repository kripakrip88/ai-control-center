# Получение SSH ключа с сервера

Ты уже на сервере. Выполни эти команды по порядку:

## Шаг 1: Посмотри какие SSH ключи есть

```bash
ls -la ~/.ssh/
```

## Шаг 2: Покажи приватный ключ

```bash
# Основной ключ (RSA)
cat ~/.ssh/id_rsa

# Или если видишь другие файлы из шага 1
cat ~/.ssh/id_ed25519
```

## Шаг 3: Скопируй ВЕСЬ вывод

Должен начинаться с:
```
-----BEGIN OPENSSH PRIVATE KEY-----
```

И заканчиваться:
```
-----END OPENSSH PRIVATE KEY-----
```

**Скопируй ВСЁ между этими строками включительно!**

## Шаг 4: Добавь в GitHub

1. Открой: https://github.com/kripakrip88/ai-control-center/settings/secrets/actions
2. Кликни на `DEPLOY_SSH_KEY`
3. Нажми "Update secret"
4. Вставь скопированный ключ
5. Сохрани

---

## Если ключа нет (создать новый)

```bash
# Создать новый ключ специально для GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""

# Добавить публичный ключ в authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Показать приватный ключ (скопируй это в GitHub)
cat ~/.ssh/github_actions
```

Этот новый ключ будет использоваться только для деплоя через GitHub Actions.

-- Создание дополнительных баз данных
-- (используется если POSTGRES_MULTIPLE_DATABASES установлен)

-- База данных для Knowledge Hub
SELECT 'CREATE DATABASE knowledge'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'knowledge')\gexec

-- База данных для n8n (уже создается через POSTGRES_DB)
SELECT 'CREATE DATABASE n8n'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')\gexec

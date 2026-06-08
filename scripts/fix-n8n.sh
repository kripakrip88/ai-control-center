#!/bin/bash
# Script to fix n8n secure cookie issue

echo "=== Checking n8n status ==="

# Find n8n docker container
CONTAINER=$(docker ps --filter "ancestor=n8nio/n8n" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
  echo "❌ n8n container not found!"
  echo "Checking all containers:"
  docker ps
  exit 1
fi

echo "✅ Found n8n container: $CONTAINER"

# Find docker-compose file
echo ""
echo "=== Looking for docker-compose.yml ==="
COMPOSE_FILE=""

for path in /opt/metalpro-ai-polygon /opt/n8n /root/metalpro-ai-polygon /var/www/metalpro-ai-polygon; do
  if [ -f "$path/docker-compose.yml" ]; then
    COMPOSE_FILE="$path/docker-compose.yml"
    echo "✅ Found: $COMPOSE_FILE"
    break
  fi
done

if [ -z "$COMPOSE_FILE" ]; then
  echo "❌ docker-compose.yml not found!"
  echo "Checking common paths:"
  find /opt /root /var/www -name "docker-compose.yml" -type f 2>/dev/null | head -5
  exit 1
fi

# Check if N8N_SECURE_COOKIE is set
echo ""
echo "=== Checking N8N_SECURE_COOKIE setting ==="
if grep -q "N8N_SECURE_COOKIE" "$COMPOSE_FILE"; then
  echo "✅ N8N_SECURE_COOKIE already configured"
  grep "N8N_SECURE_COOKIE" "$COMPOSE_FILE"
else
  echo "❌ N8N_SECURE_COOKIE not set - will add it"

  # Backup original
  cp "$COMPOSE_FILE" "${COMPOSE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

  # Add N8N_SECURE_COOKIE=false to n8n service environment
  sed -i '/n8n:/,/restart:/ {
    /environment:/a\      - N8N_SECURE_COOKIE=false
  }' "$COMPOSE_FILE"

  echo "✅ Added N8N_SECURE_COOKIE=false"
fi

# Show current n8n env
echo ""
echo "=== Current n8n environment ==="
grep -A 20 "n8n:" "$COMPOSE_FILE" | grep -E "^\s*-\s*N8N_"

# Ask to restart
echo ""
read -p "Restart n8n container? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd "$(dirname $COMPOSE_FILE)"
  docker-compose restart n8n
  echo "✅ n8n restarted!"
  echo ""
  echo "Access n8n at: http://erppark.ru:5678"
  echo "Login: admin / metaln8n"
fi

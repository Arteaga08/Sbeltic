#!/bin/bash
set -e

NAS_USER="Dr_Carlos_Nevarez"
NAS_HOST="192.168.100.64"
NAS_PATH="/volume1/docker/sbeltic/sbeltic-system"
LOCAL_PATH="/Users/manuelarteaga/Documents/sbeltic-system"

echo "🔄 Sincronizando código al NAS..."

cd "${LOCAL_PATH}"

tar czf - \
  --exclude './node_modules' \
  --exclude './frontend/node_modules' \
  --exclude './backend/node_modules' \
  --exclude './.next' \
  --exclude './frontend/.next' \
  --exclude './.git' \
  --exclude './.DS_Store' \
  --exclude './.env' \
  --exclude './backend/.env' \
  --exclude './backend/.env.local' \
  --exclude './backend/.env.production' \
  --exclude './backend/.env.development' \
  --exclude './frontend/.env' \
  --exclude './frontend/.env.local' \
  --exclude './frontend/.env.production' \
  --exclude './backend/uploads' \
  --exclude './*.log' \
  --exclude './Respaldo*' \
  --exclude '.claude' \
  . | ssh "${NAS_USER}@${NAS_HOST}" "cd ${NAS_PATH} && tar xzf - 2>/dev/null"; true

echo "✅ Código sincronizado al NAS"

#!/bin/bash
set -e

NAS_USER="Dr_Carlos_Nevarez"
NAS_HOST="192.168.100.64"
NAS_PATH="/volume1/docker/sbeltic/sbeltic-system"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Iniciando deploy al NAS Sbeltic..."

# 1. Sincronizar código
"${SCRIPT_DIR}/sync-to-nas.sh"

# 2. Rebuild + restart en el NAS
echo "🔨 Reconstruyendo contenedores en el NAS..."
ssh -t "${NAS_USER}@${NAS_HOST}" "cd ${NAS_PATH} && sudo /usr/local/bin/docker compose up -d --build"

echo "✅ Deploy completo"
echo "🌐 Aplicación disponible en: http://${NAS_HOST}:3000"

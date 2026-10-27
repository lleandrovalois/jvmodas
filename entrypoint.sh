#!/bin/sh
set -e

# Se o banco SQLite persistente não existir no volume montado (/app/data), inicializa a partir do template
if [ ! -f /app/data/jvmodas.db ]; then
  echo "📦 Criando banco de dados jvmodas.db a partir do template inicial..."
  cp /app/initial.db /app/data/jvmodas.db
  chmod 664 /app/data/jvmodas.db || true
  echo "✅ Banco de dados inicializado com sucesso!"
fi

exec "$@"

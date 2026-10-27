#!/bin/sh
set -e

# Se o banco SQLite persistente não existir no volume montado (/app/data), inicializa a partir do template
if [ ! -f /app/data/jvmodas.db ]; then
  echo "📦 Criando banco de dados jvmodas.db a partir do template inicial..."
  cp /app/initial.db /app/data/jvmodas.db
  chmod 664 /app/data/jvmodas.db || true
  echo "✅ Banco de dados inicializado com sucesso!"
else
  # Garante migração de colunas para bancos pré-existentes
  sqlite3 /app/data/jvmodas.db "ALTER TABLE cms_settings ADD COLUMN backgroundColor TEXT DEFAULT '#0f172a';" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "ALTER TABLE cms_settings ADD COLUMN cardColor TEXT DEFAULT '#1e293b';" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "ALTER TABLE cms_settings ADD COLUMN textColor TEXT DEFAULT '#f8fafc';" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "ALTER TABLE cms_settings ADD COLUMN buttonTextColor TEXT DEFAULT '#ffffff';" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "ALTER TABLE cms_settings ADD COLUMN activePreset TEXT DEFAULT 'dark-fitness';" 2>/dev/null || true
fi

exec "$@"

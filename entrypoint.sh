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

  # Garante criação da tabela categories e coluna categoryId em products
  sqlite3 /app/data/jvmodas.db "CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, description TEXT, isActive BOOLEAN NOT NULL DEFAULT 1, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories(slug);" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "ALTER TABLE products ADD COLUMN categoryId TEXT REFERENCES categories(id) ON DELETE RESTRICT;" 2>/dev/null || true

  # Popula categorias padrão se não existirem
  sqlite3 /app/data/jvmodas.db "INSERT OR IGNORE INTO categories (id, name, slug, description, isActive) VALUES ('cat_leggings', 'Leggings', 'leggings', 'Leggings de alta compressão e zero transparência.', 1);" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "INSERT OR IGNORE INTO categories (id, name, slug, description, isActive) VALUES ('cat_tops', 'Tops', 'tops', 'Tops fitness com alta sustentação.', 1);" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "INSERT OR IGNORE INTO categories (id, name, slug, description, isActive) VALUES ('cat_conjuntos', 'Conjuntos', 'conjuntos', 'Conjuntos seamless e canelados.', 1);" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "INSERT OR IGNORE INTO categories (id, name, slug, description, isActive) VALUES ('cat_shorts', 'Shorts', 'shorts', 'Shorts duplos e ciclistas com bolsos.', 1);" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "INSERT OR IGNORE INTO categories (id, name, slug, description, isActive) VALUES ('cat_macacoes', 'Macacões', 'macacoes', 'Macacões modeladores de peça única.', 1);" 2>/dev/null || true
  sqlite3 /app/data/jvmodas.db "INSERT OR IGNORE INTO categories (id, name, slug, description, isActive) VALUES ('cat_acessorios', 'Acessórios', 'acessorios', 'Acessórios e complementos esportivos.', 1);" 2>/dev/null || true

  # Vincula categoryId em produtos antigos onde categoryId estiver nulo
  sqlite3 /app/data/jvmodas.db "UPDATE products SET categoryId = (SELECT id FROM categories WHERE LOWER(categories.name) = LOWER(products.category)) WHERE categoryId IS NULL AND category IS NOT NULL;" 2>/dev/null || true
fi

exec "$@"

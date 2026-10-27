# ===================================================
# Multi-stage Dockerfile para Next.js 16 (Standalone)
# Otimizado para Ubuntu 24.04 com Docker Compose e SQLite
# ===================================================

# 1. Dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# 2. Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Gera o Prisma Client com suporte a linux-musl
RUN npx prisma generate

# Inicializa banco SQLite de template com o seed completo
ENV DATABASE_URL="file:/app/prisma/initial.db"
RUN npx prisma db push --skip-generate && npx tsx prisma/seed.ts

# Compila o Next.js no modo standalone
RUN npm run build

# 3. Runner de Produção
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl sqlite

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/jvmodas.db"

# Cria usuário não-root por segurança e garante permissão no volume do SQLite
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copia arquivos estáticos públicos e o build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia o banco inicializado e o script de inicialização
COPY --from=builder /app/prisma/initial.db /app/initial.db
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

VOLUME ["/app/data"]

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]

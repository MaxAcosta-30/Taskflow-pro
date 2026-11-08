# =============================================================
#  TaskFlow Pro — Dockerfile (Next.js App)
#  Multi-stage build para imagen optimizada en producción
# =============================================================

# ── Etapa 1: Dependencias ─────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Todas las dependencias: la build necesita TypeScript, Tailwind y el CLI de Prisma del proyecto.
RUN npm ci --ignore-scripts && \
    npx prisma generate


# ── Etapa 2: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder
# Prisma detecta la versión de OpenSSL al cargar el cliente: sin openssl busca un motor que no existe.
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build


# ── Etapa 3: Runner (imagen final mínima) ─────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario sin privilegios para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=deps    /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps    /app/node_modules/@prisma ./node_modules/@prisma

# Script de inicio con migraciones
COPY docker/app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]

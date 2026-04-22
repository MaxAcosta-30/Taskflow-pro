# =============================================================
#  TaskFlow Pro — Dockerfile (Worker BullMQ)
# =============================================================

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate


FROM node:20-alpine AS runner
RUN apk add --no-cache curl

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 worker

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY workers ./workers
COPY lib ./lib
COPY types ./types
COPY tsconfig.json ./

USER worker

CMD ["node_modules/.bin/tsx", "workers/index.ts"]

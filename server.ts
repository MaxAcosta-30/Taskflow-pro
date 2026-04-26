// =============================================================
//  server.ts — Custom Next.js + Socket.io Server
//
//  Reemplaza `next dev` / `next start`. Crea un servidor HTTP
//  compartido donde Next.js maneja las rutas HTTP y Socket.io
//  maneja las conexiones WebSocket, en el mismo proceso y puerto.
//
//  Por qué es necesario:
//  Socket.io necesita un http.Server persistente. Las API routes
//  de Next.js son funciones serverless stateless y no pueden
//  mantener el estado del servidor WS. Con server.ts ambos
//  comparten el mismo proceso Node.js y el mismo puerto.
//
//  Arranque:
//    dev  → tsx watch server.ts        (hot-reload via tsx)
//    prod → NODE_ENV=production tsx server.ts
// =============================================================

import { createServer } from 'http'
import { parse }        from 'url'
import path             from 'path'

// ── Cargar variables de entorno ──────────────────────────────
// tsx no carga .env automáticamente — lo hacemos antes de importar
// cualquier módulo que lea process.env
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require('dotenv') as typeof import('dotenv')
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })  // fallback

// eslint-disable-next-line @typescript-eslint/no-require-imports
const next = require('next') as (opts: { dev: boolean; port: number }) => {
  prepare: () => Promise<void>
  getRequestHandler: () => (req: import('http').IncomingMessage, res: import('http').ServerResponse, parsedUrl: import('url').UrlWithParsedQuery) => Promise<void>
}

import { initSocketServer } from './lib/socket/index'

const dev  = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app    = next({ dev, port })
const handle = app.getRequestHandler()

void app.prepare().then(() => {
  // ── Servidor HTTP compartido ─────────────────────────────────
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? '/', true)
    void handle(req, res, parsedUrl)
  })

  // ── Inicializar Socket.io sobre el mismo servidor HTTP ───────
  // initSocketServer es idempotente — solo crea la instancia una vez
  initSocketServer(httpServer)

  // ── Escuchar ─────────────────────────────────────────────────
  httpServer.listen(port, () => {
    const mode = dev ? 'development' : 'production'
    console.log('')
    console.log(`  ✅  TaskFlow Pro ready in ${mode}`)
    console.log(`  🌐  App:       http://localhost:${port}`)
    console.log(`  🔌  Socket.io: http://localhost:${port}/socket.io`)
    console.log('')
  })

  // ── Graceful shutdown ────────────────────────────────────────
  const shutdown = (signal: string) => {
    console.log(`\n> Received ${signal}, shutting down...`)
    httpServer.close(() => {
      console.log('> HTTP server closed')
      process.exit(0)
    })
    // Forzar cierre después de 10s si hay conexiones colgadas
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
})

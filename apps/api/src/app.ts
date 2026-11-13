import Fastify from 'fastify'
import { pool } from './db/client.js'
import { healthRoutes } from './routes/health.js'

// Builds the app WITHOUT starting a server. index.ts starts it for real;
// tests call app.inject() to send fake requests straight in, no network or port needed.
export function buildApp({ logger = true }: { logger?: boolean } = {}) {
  const app = Fastify({ logger })

  // Every API route lives under /api, so Caddy can send /api/* here and everything else to Next.js.
  app.register(healthRoutes, { prefix: '/api' })

  // When the app closes, close the database connections cleanly.
  app.addHook('onClose', async () => {
    await pool.end()
  })

  return app
}

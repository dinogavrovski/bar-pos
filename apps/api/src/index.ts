import Fastify from 'fastify'
import { pool } from './db/client.js'
import { healthRoutes } from './routes/health.js'

const app = Fastify({ logger: true })

// Every API route lives under /api, so Caddy can send /api/* here and everything else to Next.js.
app.register(healthRoutes, { prefix: '/api' })

// When the server shuts down, close the database connections cleanly.
app.addHook('onClose', async () => {
  await pool.end()
})

const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

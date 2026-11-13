import type { FastifyPluginAsync } from 'fastify'
import { sql } from 'drizzle-orm'
import { db } from '../db/client.js'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  // Liveness: "is the process running and able to answer?"
  // Touches nothing else, so it only fails if the API itself is stuck or dead.
  app.get('/health/live', async () => {
    return { status: 'ok' }
  })

  // Readiness: "can this instance do real work right now?" Needs the database.
  app.get('/health/ready', async (request, reply) => {
    try {
      // The cheapest possible query: proves we can get a connection and Postgres answers.
      await db.execute(sql`select 1`)
      return { status: 'ok', db: 'up' }
    } catch (err) {
      request.log.error({ err }, 'readiness check: database unreachable')
      // 503 Service Unavailable = "I'm alive but can't serve right now, try later".
      return reply.code(503).send({ status: 'error', db: 'down' })
    }
  })
}

import { afterAll, describe, expect, it } from 'vitest'
import { buildApp } from '../app.js'

// Integration test: real Fastify app + real Postgres (local Docker, or the CI service container).
const app = buildApp({ logger: false })

// Close the app (and with it the DB pool) so the test process can exit.
afterAll(async () => {
  await app.close()
})

describe('health routes', () => {
  it('GET /api/health/live answers 200 without touching the database', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health/live' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('GET /api/health/ready answers 200 when the database is reachable', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health/ready' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok', db: 'up' })
  })

  it('unknown routes answer 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/nope' })

    expect(res.statusCode).toBe(404)
  })
})

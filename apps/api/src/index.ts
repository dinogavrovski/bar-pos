import { buildApp } from './app.js'

const app = buildApp()

// Graceful shutdown. `docker stop` sends SIGTERM, Ctrl+C sends SIGINT.
// app.close() stops accepting new requests, lets in-flight ones finish,
// then runs the onClose hook (closing the DB pool).
// Docker waits 10s, then kills the process anyway with SIGKILL.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, 'shutting down')
    await app.close()
    process.exit(0)
  })
}

const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

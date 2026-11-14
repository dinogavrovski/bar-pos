import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema/index.js'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env)')

// A pool keeps a few connections open and reuses them, instead of connecting per query.
export const pool = new pg.Pool({
  connectionString: url,
  // If the database is unreachable, fail after 2s instead of hanging forever.
  connectionTimeoutMillis: 2000,
})

// An idle connection can break (e.g. the database restarts). Without a listener,
// Node treats that 'error' event as unhandled and crashes the whole API.
pool.on('error', (err) => {
  console.error('Postgres pool error (idle client):', err.message)
})

// casing must match drizzle.config.ts, or queries will use different column names than the migrations created.
export const db = drizzle(pool, { schema, casing: 'snake_case' })

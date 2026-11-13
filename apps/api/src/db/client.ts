import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.js'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env)')

// A pool keeps a few connections open and reuses them, instead of connecting per query.
export const pool = new pg.Pool({ connectionString: url })

// casing must match drizzle.config.ts, or queries will use different column names than the migrations created.
export const db = drizzle(pool, { schema, casing: 'snake_case' })

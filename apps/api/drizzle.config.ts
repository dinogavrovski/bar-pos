import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit runs outside the API process, so it loads the root .env itself.
// In CI (and later production) there is no .env: the variables are set directly.
if (existsSync('../../.env')) process.loadEnvFile('../../.env')

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env)')

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts', // all tables, re-exported from one file
  out: './drizzle', // where generated SQL migration files go (committed to git)
  dbCredentials: { url },
  casing: 'snake_case', // createdAt in TS -> created_at in SQL (must match client.ts)
  strict: true, // ask for confirmation on destructive changes
  verbose: true,
})

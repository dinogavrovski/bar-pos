import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

// Locally, read DATABASE_URL from the root .env. In CI there is no .env file:
// the workflow sets the variables directly, so we skip loading instead of crashing.
if (existsSync('../../.env')) process.loadEnvFile('../../.env')

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})

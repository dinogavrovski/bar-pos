import { defineConfig } from 'vitest/config'

// Unit tests only: shared has no database, so these run in milliseconds without Docker.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})

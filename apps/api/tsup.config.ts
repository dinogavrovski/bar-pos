import { defineConfig } from 'tsup'

// Bundles the API into dist/index.js for production.
// Why bundle: packages/shared is raw TypeScript, which plain Node can't run.
// tsup (esbuild) compiles our code AND the shared package into one JS file,
// while normal npm dependencies (fastify, pg, drizzle) stay as imports from node_modules.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node24',
  platform: 'node',
  outDir: 'dist',
  clean: true, // wipe dist before each build
  sourcemap: true, // stack traces point at the .ts lines (useful later for Sentry)
  noExternal: ['@barpos/shared'], // inline the workspace package instead of importing it
})

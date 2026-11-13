import path from 'node:path'
import type { NextConfig } from 'next'

const config: NextConfig = {
  // Compile the raw TypeScript in packages/shared as part of the Next build.
  transpilePackages: ['@barpos/shared'],

  // `next build` also writes .next/standalone: a minimal server.js plus only the
  // node_modules files it actually uses. That folder is all the Docker image needs.
  output: 'standalone',
  // In a monorepo, trace files from the repo root so packages/shared and hoisted deps are found.
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Linting runs from the repo root (and later in CI), not inside `next build`.
  eslint: { ignoreDuringBuilds: true },
}

export default config

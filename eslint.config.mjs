// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import nextPlugin from '@next/eslint-plugin-next'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  // Never lint build output or dependencies.
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/next-env.d.ts'],
  },

  // Base rules for every TS/JS file in the monorepo.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // API: runs in Node.
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // Shared package: runs in both Node and the browser, so it gets neither set of globals.

  // Web: React + Next.js rules, browser globals.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    settings: { next: { rootDir: 'apps/web' } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Config files at the root are Node scripts.
  {
    files: ['*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },

  // Must be last: turns off every rule that would fight with Prettier's formatting.
  prettier,
)

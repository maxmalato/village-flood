import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Caminho explícito: o Vitest roda a partir da raiz do monorepo.
  plugins: [svelte({ configFile: fileURLToPath(new URL('./svelte.config.js', import.meta.url)) })],
  test: {
    // Testes de unidade ficam em src/. Os testes E2E (e2e/*.e2e.ts) rodam pelo Playwright.
    include: ['src/**/*.test.ts'],
  },
})

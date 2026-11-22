import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Caminho explícito: o Vitest roda a partir da raiz do monorepo.
  plugins: [svelte({ configFile: fileURLToPath(new URL('./svelte.config.js', import.meta.url)) })],
  // Salas online: /api (HTTP e WebSocket) vai para o servidor local (`pnpm --filter
  // @village-flood/server dev`, porta 8787). Em produção, o próprio Worker serve o site e a API.
  server: { proxy: { '/api': { target: 'http://localhost:8787', ws: true } } },
  preview: { proxy: { '/api': { target: 'http://localhost:8787', ws: true } } },
  test: {
    // Testes de unidade ficam em src/. Os testes E2E (e2e/*.e2e.ts) rodam pelo Playwright.
    include: ['src/**/*.test.ts'],
  },
})

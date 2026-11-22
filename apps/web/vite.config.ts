import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  // Arquivos públicos vêm direto de assets/logo (fonte única dos ícones e da logo).
  publicDir: dir('../../assets/logo'),
  plugins: [
    // Caminho explícito: o Vitest roda a partir da raiz do monorepo.
    svelte({ configFile: dir('./svelte.config.js') }),
    // PWA: instalável e com o modo local funcionando offline depois do primeiro acesso.
    // O registro é um script gerado pelo plugin (sem workbox-window no pacote do jogo).
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: {
        name: 'Enchente na Vila',
        short_name: 'Enchente',
        description:
          'Jogo cooperativo: levem os moradores até a igreja antes que o rio suba. Co-op game: bring the residents to the church before the river rises.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0e2433',
        theme_color: '#0e2433',
        icons: [
          { src: 'logo-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo-icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'logo-icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // a logo horizontal não aparece no jogo: fica fora do cache offline
        globIgnores: ['**/logo-horizontal*'],
        navigateFallback: 'index.html',
        // A API das salas nunca vem do cache: online precisa de conexão.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // a versão nova assume as abas abertas na hora (o jogo não guarda nada no cache)
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  // Salas online: /api (HTTP e WebSocket) vai para o servidor local (`pnpm --filter
  // @village-flood/server dev`, porta 8787). Em produção, o próprio Worker serve o site e a API.
  server: { proxy: { '/api': { target: 'http://localhost:8787', ws: true } } },
  preview: { proxy: { '/api': { target: 'http://localhost:8787', ws: true } } },
  test: {
    // Testes de unidade ficam em src/. Os testes E2E (e2e/*.e2e.ts) rodam pelo Playwright.
    include: ['src/**/*.test.ts'],
  },
})

import { defineConfig, devices } from '@playwright/test'

// Caminho opcional de um Chromium já instalado (ex.: ambientes sem download de navegador).
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Salas online (vários aparelhos): basta um tamanho de tela; o layout já é testado no local.
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testIgnore: ['**/online.e2e.ts', '**/table.e2e.ts'],
    },
  ],
  webServer: [
    {
      command: 'pnpm build && pnpm preview --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
    },
    {
      // Servidor de salas local (Worker + Durable Objects no workerd), com prazos curtos para o
      // teste não esperar 20 s pelo bot. O site chega a ele pelo proxy /api do Vite.
      command:
        'pnpm --filter @village-flood/server exec wrangler dev --port 8787 --ip 127.0.0.1 ' +
        '--var TAKEOVER_MS:3000 --var BOT_STEP_MS:60 --persist-to .wrangler/e2e',
      url: 'http://127.0.0.1:8787/api/health',
      reuseExistingServer: !process.env.CI,
      env: { WRANGLER_SEND_METRICS: 'false' },
      timeout: 120_000,
    },
  ],
})

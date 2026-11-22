import { cloudflareTest } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'

// Os testes do servidor rodam dentro do runtime dos Workers (workerd), com os bindings do
// wrangler.jsonc. Tempos curtos para o bot assumir e jogar.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: { bindings: { TAKEOVER_MS: '200', BOT_STEP_MS: '20' } },
    }),
  ],
})

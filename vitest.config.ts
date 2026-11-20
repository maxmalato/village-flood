import { defineConfig } from 'vitest/config'

// Cada pacote é um projeto do Vitest. A simulação em lote não roda aqui:
// ela tem o próprio comando (`pnpm simulate`).
export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*'],
  },
})

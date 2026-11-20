import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'

describe('server', () => {
  it('responde ao /health com a versão do protocolo', async () => {
    const response = await exports.default.fetch('https://example.com/health')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, protocol: 'village-flood/v1' })
  })

  it('responde 404 para rota desconhecida', async () => {
    const response = await exports.default.fetch('https://example.com/nada')
    expect(response.status).toBe(404)
  })
})

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { GAME_ID } from './index.ts'

describe('engine', () => {
  it('expõe o identificador do jogo', () => {
    expect(GAME_ID).toBe('village-flood')
  })

  // Teste mínimo para garantir que o fast-check está configurado.
  // As propriedades reais (spec, seção 10) entram na Etapa 1.
  it('fast-check roda propriedades', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        expect(n + 0).toBe(n)
      }),
    )
  })
})

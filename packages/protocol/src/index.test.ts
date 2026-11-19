import { describe, expect, it } from 'vitest'
import { PROTOCOL_ID, PROTOCOL_VERSION } from './index.ts'

describe('protocol', () => {
  it('monta o identificador a partir do jogo e da versão', () => {
    expect(PROTOCOL_ID).toBe(`village-flood/v${PROTOCOL_VERSION}`)
  })
})

import { describe, expect, it } from 'vitest'
import { BOTS_GAME_ID } from './index.ts'

describe('bots', () => {
  it('dependem do motor do jogo', () => {
    expect(BOTS_GAME_ID).toBe('village-flood')
  })
})

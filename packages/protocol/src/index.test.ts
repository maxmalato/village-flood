import { newGame } from '@village-flood/engine'
import { describe, expect, it } from 'vitest'
import { parseAction, parsePingTarget, parseRole, parseRoomConfig, PROTOCOL_ID } from './index.ts'

describe('protocolo', () => {
  it('identifica o jogo e a versão', () => {
    expect(PROTOCOL_ID).toBe('village-flood/v1')
  })

  it('aceita ações bem formadas e recusa o resto', () => {
    expect(parseAction({ type: 'move', to: 'C3' })).toEqual({ type: 'move', to: 'C3' })
    expect(parseAction({ type: 'radio-call' })).toEqual({ type: 'radio-call' })
    expect(parseAction({ type: 'move', to: 'Z' })).toBeNull()
    expect(parseAction({ type: 'move', to: 'C3', extra: 1 })).toBeNull()
    expect(parseAction({ type: 'voar' })).toBeNull()
    expect(parseAction('end-turn')).toBeNull()
  })

  it('valida configuração e papel', () => {
    expect(parseRoomConfig({ difficulty: 'storm' })).toEqual({ difficulty: 'storm' })
    expect(parseRoomConfig({ difficulty: 'impossível' })).toBeNull()
    expect(parseRole('medic')).toBe('medic')
    expect(parseRole('pirata')).toBeNull()
  })

  it('ping só em quadra do mapa', () => {
    const state = newGame({
      difficulty: 'normal',
      seed: 1,
      seats: [
        { seat: 's1', role: 'medic' },
        { seat: 's2', role: 'engineer' },
      ],
    })
    expect(parsePingTarget(state, 'C3')).toBe('C3')
    expect(parsePingTarget(state, 'G9')).toBeNull()
    expect(parsePingTarget(state, 7)).toBeNull()
  })
})

import type { GameEvent } from '@village-flood/engine'
import { describe, expect, it } from 'vitest'
import { CUES, cueFor } from './sound.ts'

describe('sons', () => {
  it('cada grupo de eventos toca só o som mais importante', () => {
    const events: GameEvent[] = [
      { type: 'moved', seat: 'seat-1', from: 'A1', to: 'A2', cost: 1 },
      { type: 'delivered', seat: 'seat-1', residentIds: ['r1'] },
    ]
    expect(cueFor(events)).toBe('delivered')
    expect(
      cueFor([
        { type: 'rain-drawn', card: 'rain', rise: 2 },
        { type: 'tile-flooded', tileId: 'A1' },
        { type: 'lost', reason: 'level' },
      ]),
    ).toBe('lost')
    expect(cueFor([{ type: 'turn-ended', seat: 'seat-1', turn: 1 }])).toBeNull()
  })

  it('"sua vez" só toca no aparelho de quem vai jogar', () => {
    const started: GameEvent[] = [{ type: 'turn-started', seat: 'seat-2', turn: 2 }]
    expect(cueFor(started)).toBeNull()
    expect(cueFor(started, 'seat-1')).toBeNull()
    expect(cueFor(started, 'seat-2')).toBe('your-turn')
  })

  it('todo som é curto (até 1,5 s)', () => {
    for (const notes of Object.values(CUES)) {
      const end = Math.max(...notes.map((n) => n.at + n.dur))
      expect(end).toBeLessThanOrEqual(1.5)
    }
  })
})

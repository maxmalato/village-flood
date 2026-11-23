import { newGame, type GameState } from '@village-flood/engine'
import { describe, expect, it } from 'vitest'
import { gameSummary } from './summary.ts'
import type { SeatInfo } from './view.ts'

const seats: SeatInfo[] = [
  { seat: 'seat-1', name: 'Ana', role: 'firefighter', bot: false, color: '#B39DDB' },
  { seat: 'seat-2', name: 'Bruno', role: 'medic', bot: false, color: '#4FC3F7' },
  { seat: 'seat-3', name: 'Carla', role: 'neighbor', bot: true, color: '#FF8A65' },
]

function finished(phase: GameState['phase'], lossReason?: GameState['lossReason']): GameState {
  const state = newGame({
    difficulty: 'easy',
    seed: 3,
    seats: seats.map((s) => ({ seat: s.seat, role: s.role })),
    variation: { scenario: 0, mirrored: false },
  })
  return {
    ...state,
    phase,
    turn: 18,
    ...(lossReason ? { lossReason } : {}),
    residents: state.residents.map((r, i) =>
      i < 9
        ? { ...r, status: 'safe' as const }
        : i === 9
          ? { ...r, status: 'stranded' as const }
          : r,
    ),
  }
}

describe('resumo da partida', () => {
  it('traz modo, dificuldade, assentos, papéis, resultado e a linha da tabela, sem nomes', () => {
    const text = gameSummary(
      {
        state: finished('won'),
        seats,
        stats: { 'seat-1': { rescues: 4, heals: 0, radioCalls: 0, swept: 1 } },
        mode: 'local',
        durationMs: 31 * 60_000,
      },
      'pt-BR',
    )
    expect(text).toContain(
      'Modo: neste aparelho · Dificuldade: Tranquilo · Assentos: 2 pessoa(s) + 1 bot(s)',
    )
    expect(text).toContain('Papéis: Bombeiro, Médica, Vizinha (bot)')
    expect(text).toContain('Resultado: venceu · Turno final: 18 · Salvos: 9 (meta 8) · Ilhados: 1')
    expect(text).toContain('Voluntário apanhado pela água: sim (1) · Duração: 31 min')
    expect(text).toContain(
      '| | neste aparelho | Tranquilo | 2 + 1 | Bombeiro, Médica, Vizinha (bot) | venceu | — | 18 | 9 | 1 | sim (1) |',
    )
    for (const name of ['Ana', 'Bruno', 'Carla']) expect(text).not.toContain(name)
  })

  it('derrota com motivo, mesa, duração desconhecida e em inglês', () => {
    const text = gameSummary(
      { state: finished('lost', 'level'), seats, stats: {}, mode: 'table', durationMs: null },
      'en',
    )
    expect(text).toContain('Result: lost (river at the top)')
    expect(text).toContain('Mode: table')
    expect(text).toContain('Volunteer swept away: no · Duration: not recorded')
    expect(text).toContain('| lost | river at the top |')
  })

  it('no online, quem tem um bot no lugar continua contando como pessoa', () => {
    const [ana, bruno, carla] = seats as [SeatInfo, SeatInfo, SeatInfo]
    const online: SeatInfo[] = [
      { ...ana, presence: 'connected' },
      { ...bruno, bot: true, presence: 'bot' },
      { ...carla },
    ]
    const text = gameSummary(
      { state: finished('won'), seats: online, stats: {}, mode: 'online', durationMs: 60_000 },
      'pt-BR',
    )
    expect(text).toContain('Assentos: 2 pessoa(s) + 1 bot(s)')
    expect(text).toContain('Papéis: Bombeiro, Médica, Vizinha (bot)')
  })
})

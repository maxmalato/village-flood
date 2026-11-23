import { newGame, transition, type GameState } from '@village-flood/engine'
import { describe, expect, it } from 'vitest'
import {
  actionTile,
  costLabel,
  eventMessages,
  forecastLines,
  globalActions,
  previewCost,
  riverMarks,
  tileActions,
  tileInfo,
  tileViews,
  type SeatInfo,
} from './view.ts'

const seats: SeatInfo[] = [
  { seat: 'seat-1', name: 'Ana', role: 'firefighter', bot: false, color: '#B39DDB' },
  { seat: 'seat-2', name: 'Bruno', role: 'radio-host', bot: true, color: '#4FC3F7' },
]

function game(): GameState {
  return newGame({
    difficulty: 'normal',
    seed: 7,
    seats: seats.map((s) => ({ seat: s.seat, role: s.role })),
    variation: { scenario: 0, mirrored: false },
  })
}

const options = {
  seats,
  selected: null,
  suggested: null,
  showReach: true,
  locale: 'pt-BR' as const,
}

describe('tileViews', () => {
  it('mostra os peões no cais e as quadras alcançáveis com custo', () => {
    const tiles = tileViews(game(), options)
    const dock = tiles.find((t) => t.id === 'B3')
    expect(dock?.pawns.map((p) => p.initial)).toEqual(['A', 'B'])
    expect(dock?.pawns[0]?.active).toBe(true)
    expect(
      tiles
        .filter((t) => t.cost !== null)
        .map((t) => t.id)
        .sort(),
    ).toEqual(['A3', 'B2', 'B4', 'C3'])
  })

  it('descreve a quadra para leitores de tela', () => {
    const a4 = tileViews(game(), options).find((t) => t.id === 'A4')
    expect(a4?.aria).toBe('A4, altura 1, seca, casa, 2 morador(es) esperando')
    const b3 = tileViews(game(), { ...options, locale: 'en' }).find((t) => t.id === 'B3')
    expect(b3?.aria).toContain('dock')
    expect(b3?.aria).toContain('volunteers: Ana, Bruno')
  })

  it('não mostra alcance quando é a vez de um bot', () => {
    expect(tileViews(game(), { ...options, showReach: false }).every((t) => t.cost === null)).toBe(
      true,
    )
  })
})

describe('ações', () => {
  it('mede o custo pelo próprio motor', () => {
    expect(previewCost(game(), { type: 'move', to: 'C3' })).toBe(1)
    expect(previewCost(game(), { type: 'move', to: 'F6' })).toBeNull()
    expect(costLabel('pt-BR', 0)).toBe('grátis')
    expect(costLabel('pt-BR', 2)).toBe('2 ações')
  })

  it('lista as ações da quadra escolhida', () => {
    expect(tileActions(game(), 'C3', 'pt-BR').map((o) => o.label)).toEqual([
      'Andar até C3 (1 ação)',
    ])
    expect(tileActions(game(), 'F6', 'pt-BR')).toEqual([])
  })

  it('oferece pegar morador na quadra onde o voluntário está', () => {
    let s = game()
    s = (transition(s, { type: 'move', to: 'A3' }, { seat: 'seat-1' }) as { state: GameState })
      .state
    s = (transition(s, { type: 'move', to: 'A4' }, { seat: 'seat-1' }) as { state: GameState })
      .state
    expect(tileActions(s, 'A4', 'pt-BR').map((o) => o.label)).toContain('Pegar morador (1 ação)')
  })

  it('oferece o Chamado pelo rádio só para a Radialista', () => {
    expect(globalActions(game(), 'pt-BR')).toEqual([])
    const radio = newGame({
      difficulty: 'normal',
      seed: 7,
      seats: [
        { seat: 'seat-1', role: 'radio-host' },
        { seat: 'seat-2', role: 'medic' },
      ],
    })
    expect(globalActions(radio, 'pt-BR').map((o) => o.label)).toEqual([
      'Chamado pelo rádio (1 ação)',
    ])
  })

  it('liga a ação à quadra (para destacar a dica)', () => {
    expect(actionTile(game(), { type: 'move', to: 'C3' })).toBe('C3')
    expect(actionTile(game(), { type: 'end-turn' })).toBe('B3')
  })
})

describe('painéis', () => {
  it('mostra os limiares do rio a partir dos dados', () => {
    expect(riverMarks(game())).toEqual({ level: 0, max: 24, marks: [5, 12, 19] })
  })

  it('mostra a previsão quando há Radialista', () => {
    const lines = forecastLines(game(), seats, 'pt-BR')
    expect(lines?.name).toBe('Bruno')
    expect(lines?.main).toMatch(/^Próxima carta: /)
  })

  it('descreve a quadra escolhida', () => {
    expect(tileInfo(game(), 'D3', 'pt-BR')?.title).toBe('Igreja: abrigo dos moradores')
    expect(tileInfo(game(), 'A4', 'pt-BR')).toMatchObject({
      header: 'A4 · Altura 1 · Seca',
      title: 'Casa com 2 morador(es) esperando',
    })
  })
})

describe('eventMessages', () => {
  it('resume a chuva e avisa quem foi apanhado pela água', () => {
    const s = game()
    const result = eventMessages(
      [
        { type: 'rain-drawn', card: 'rain', rise: 2 },
        { type: 'tile-flooded', tileId: 'A1' },
        { type: 'tile-flooded', tileId: 'A2' },
        {
          type: 'volunteer-swept',
          seat: 'seat-1',
          from: 'A3',
          to: 'B3',
          strandedResidentIds: ['A2-1'],
        },
      ],
      seats,
      s,
      'pt-BR',
    )
    expect(result.messages).toEqual([
      'Chuva: Chuva (+2). O rio está em 0.',
      '2 quadra(s) alagaram.',
    ])
    expect(result.alerts[0]).toContain('Ana foi apanhado pela água')
  })
})

describe('aviso de meta alcançada', () => {
  /** Partida com `safe` moradores já salvos. */
  function withSafe(safe: number, phase: GameState['phase'] = 'playing'): GameState {
    const state = game()
    return {
      ...state,
      phase,
      residents: state.residents.map((r, i) => (i < safe ? { ...r, status: 'safe' as const } : r)),
    }
  }
  const delivered = (n: number) => [
    {
      type: 'delivered' as const,
      seat: 'seat-1',
      residentIds: Array.from({ length: n }, (_, i) => `r${i}`),
    },
  ]
  const alertsOf = (state: GameState, n: number) =>
    eventMessages(delivered(n), seats, state, 'pt-BR').alerts

  it('avisa para levar todos ao cais na jogada que alcança a meta', () => {
    const goal = game().config.settings.goal
    expect(alertsOf(withSafe(goal), 1)).toEqual([
      'Meta alcançada! Agora levem todos os voluntários ao cais.',
    ])
    expect(alertsOf(withSafe(goal + 1), 2)).toHaveLength(1)
  })

  it('não avisa antes da meta, depois dela, nem com a partida encerrada', () => {
    const goal = game().config.settings.goal
    expect(alertsOf(withSafe(goal - 1), 1)).toEqual([])
    expect(alertsOf(withSafe(goal + 1), 1)).toEqual([])
    expect(alertsOf(withSafe(goal, 'won'), 1)).toEqual([])
  })
})

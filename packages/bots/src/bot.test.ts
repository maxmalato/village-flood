import {
  newGame,
  transition,
  type Action,
  type Difficulty,
  type GameState,
  type RoleId,
  waterModelFor,
} from '@village-flood/engine'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { botMove, scoreState, suggest } from './bot.ts'
import { projectedRise, rainOutlook } from './outlook.ts'

const names = ['ana', 'bruno', 'carla', 'diego']

function setup(
  roles: RoleId[] = ['firefighter', 'medic'],
  difficulty: Difficulty = 'normal',
  seed = 3,
) {
  return newGame({
    difficulty,
    seed,
    seats: roles.map((role, i) => ({ seat: names[i] ?? 'x', role })),
    variation: { scenario: 0, mirrored: false },
  })
}

function act(state: GameState, action: Action): GameState {
  const result = transition(state, action, { seat: state.activeSeat })
  if (!result.ok) throw new Error(result.reason)
  return result.state
}

function patch(state: GameState, seat: string, tileId: string, carrying: string[] = []): GameState {
  return {
    ...state,
    volunteers: state.volunteers.map((v) => (v.seat === seat ? { ...v, tileId, carrying } : v)),
    residents: state.residents.map((r) =>
      carrying.includes(r.id) ? { ...r, tileId: null, carriedBy: seat } : r,
    ),
  }
}

/** Joga a partida inteira só com bots. */
function playOut(state: GameState, limit = 2000): GameState {
  let s = state
  for (let i = 0; i < limit && s.phase === 'playing'; i++) s = act(s, botMove(s, s.activeSeat))
  return s
}

describe('botMove', () => {
  it('sempre devolve uma ação aceita pelo motor, até o fim da partida', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Difficulty>('easy', 'normal', 'storm'),
        fc.shuffledSubarray<RoleId>(
          ['firefighter', 'boat-pilot', 'engineer', 'medic', 'radio-host', 'neighbor'],
          { minLength: 2, maxLength: 4 },
        ),
        fc.integer(),
        (difficulty, roles, seed) => {
          const end = playOut(setup(roles, difficulty, seed))
          expect(end.phase).not.toBe('playing')
        },
      ),
      { numRuns: 15 },
    )
  }, 60_000)

  it('é determinístico para o mesmo estado', () => {
    const s = setup()
    expect(botMove(s, 'ana')).toEqual(botMove(s, 'ana'))
    expect(playOut(setup())).toEqual(playOut(setup()))
  })

  it('não usa a ordem escondida do baralho', () => {
    // Sem Radialista, nenhuma carta é conhecida: inverter o baralho não pode mudar a jogada.
    let s = setup(['firefighter', 'medic'])
    for (let i = 0; i < 12; i++) s = act(s, botMove(s, s.activeSeat))
    const reversed = { ...s, rainDeck: [...s.rainDeck].reverse(), rng: 12345 }
    expect(botMove(reversed, reversed.activeSeat)).toEqual(botMove(s, s.activeSeat))
  })

  it('projeta a subida com as cartas conhecidas e a média', () => {
    expect(projectedRise({ known: [3, 0], mean: 1 }, 4)).toBe(5)
    expect(projectedRise({ known: [], mean: 1 }, Infinity)).toBe(Infinity)
  })

  it('usa as cartas reveladas pela previsão', () => {
    const s = { ...setup(['radio-host', 'medic']), rainDeck: ['storm', 'cloudy'] as const }
    expect(rainOutlook(s as GameState).known).toEqual([3])
    expect(rainOutlook(setup(['firefighter', 'medic'])).known).toEqual([])
  })

  it('pega o morador da quadra onde está', () => {
    const s = patch(setup(), 'ana', 'A2')
    expect(suggest(s, 'ana').actions).toContainEqual({ type: 'pick-up', residentId: 'A2-1' })
  })

  it('leva o morador carregado até a igreja', () => {
    const s = patch(setup(), 'ana', 'C3', ['C2-1'])
    expect(botMove(s, 'ana')).toEqual({ type: 'move', to: 'D3' })
  })

  it('vai ao cais quando a meta está garantida, e vence', () => {
    let s = setup()
    s = {
      ...s,
      residents: s.residents.map((r) => ({
        ...r,
        tileId: 'D3',
        carriedBy: null,
        status: 'safe' as const,
      })),
    }
    s = patch(s, 'ana', 'C3')
    const next = act(s, botMove(s, 'ana'))
    expect(next.phase).toBe('won')
  })

  it('não termina o turno numa quadra que pode submergir antes da próxima vez', () => {
    // Nível 10: A3 (altura 1) submerge em 12; a próxima carta conhecida é Chuva (+2).
    let s = setup(['firefighter', 'radio-host'])
    s = { ...s, riverLevel: 10, rainDeck: ['rain', 'cloudy', 'cloudy'] }
    s = patch(s, 'ana', 'A3')
    s = {
      ...s,
      volunteers: s.volunteers.map((v) => (v.seat === 'ana' ? { ...v, actionsLeft: 1 } : v)),
    }
    const move = botMove(s, 'ana')
    expect(move.type).toBe('move')
    const after = act(s, move)
    const tile = after.volunteers.find((v) => v.seat === 'ana')?.tileId
    expect(['A3', 'A2', 'A4']).not.toContain(tile)
  })

  it('prefere estados melhores segundo a própria avaliação', () => {
    const s = patch(setup(), 'ana', 'C3', ['C2-1'])
    const delivered = act(s, { type: 'move', to: 'D3' })
    expect(scoreState(delivered, 'ana', undefined, s)).toBeGreaterThan(scoreState(s, 'ana'))
  })

  it('recusa jogar fora da própria vez', () => {
    expect(() => botMove(setup(), 'bruno')).toThrow(/vez/)
  })

  it('decide mesmo com morador inalcançável (sem laço infinito)', () => {
    // Nível 19: altura 1 e 2 submersas; a Médica em E4 (com sacos) não alcança ninguém.
    let s = setup(['medic', 'engineer'])
    s = {
      ...s,
      riverLevel: 19,
      tiles: s.tiles.map((t) => (t.id === 'E4' ? { ...t, sandbags: 2 } : t)),
    }
    s = { ...s, tiles: waterModelFor(s.config).recompute(s.tiles, 19) }
    s = patch(s, 'ana', 'E4')
    expect(botMove(s, 'ana')).toBeDefined()
  })
})

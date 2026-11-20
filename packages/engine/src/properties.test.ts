// Testes de propriedade (spec, seção 10): partidas aleatórias jogadas só com ações legais.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { countResidents, houseMark, legalActions, newGame, transition } from './game.ts'
import { difficulties, roleIds, type Difficulty, type RoleId } from './schema.ts'
import { checkInvariants, deepFreeze, names } from './testing.ts'
import type { GameState } from './types.ts'

const gameArb = fc.record({
  difficulty: fc.constantFrom(...difficulties),
  roles: fc.shuffledSubarray([...roleIds], { minLength: 2, maxLength: 4 }),
  seed: fc.integer(),
  choices: fc.array(fc.nat(), { minLength: 1, maxLength: 250 }),
})

interface Game {
  difficulty: Difficulty
  roles: RoleId[]
  seed: number
  choices: number[]
}

function start(game: Game): GameState {
  return newGame({
    difficulty: game.difficulty,
    seed: game.seed,
    seats: game.roles.map((role, i) => ({ seat: names[i] ?? `seat-${i}`, role })),
  })
}

/** Joga a partida escolhendo ações legais pelos números sorteados. Chama `check` a cada passo. */
function play(game: Game, check?: (before: GameState, after: GameState) => void): GameState {
  let state = start(game)
  for (const choice of game.choices) {
    const actions = legalActions(state)
    if (actions.length === 0) break
    const action = actions[choice % actions.length]
    if (!action) break
    const result = transition(state, action, { seat: state.activeSeat })
    expect(result.ok).toBe(true)
    check?.(state, result.state)
    state = result.state
  }
  return state
}

const runs = { numRuns: 60 }

describe('propriedades do motor', () => {
  it('nenhuma ação legal deixa o estado inconsistente (inclui conservação de moradores)', () => {
    fc.assert(
      fc.property(gameArb, (game) => {
        const total = start(game).residents.length
        play(game, (_before, after) => {
          expect(checkInvariants(after, total)).toEqual([])
        })
      }),
      runs,
    )
  })

  it('o nível do rio nunca diminui', () => {
    fc.assert(
      fc.property(gameArb, (game) => {
        play(game, (before, after) => {
          expect(after.riverLevel).toBeGreaterThanOrEqual(before.riverLevel)
        })
      }),
      runs,
    )
  })

  it('transition nunca muta a entrada', () => {
    fc.assert(
      fc.property(gameArb, (game) => {
        let state = deepFreeze(start(game))
        for (const choice of game.choices) {
          const actions = legalActions(state)
          if (actions.length === 0) break
          const action = actions[choice % actions.length]
          if (!action) break
          const copy: unknown = JSON.parse(JSON.stringify(state))
          // Estado congelado: qualquer mutação lançaria erro.
          const result = transition(state, action, { seat: state.activeSeat })
          expect(state).toEqual(copy)
          state = deepFreeze(result.state)
        }
      }),
      runs,
    )
  })

  it('mesma semente e mesmas ações geram o mesmo resultado', () => {
    fc.assert(
      fc.property(gameArb, (game) => {
        expect(play(game)).toEqual(play(game))
      }),
      runs,
    )
  })

  it('houseMark nunca marca casa com morador esperando', () => {
    fc.assert(
      fc.property(gameArb, (game) => {
        const state = play(game)
        for (const tile of state.tiles.filter((t) => t.kind === 'house')) {
          const waiting = state.residents.some(
            (r) => r.tileId === tile.id && r.carriedBy === null && r.status !== 'safe',
          )
          if (waiting) expect(houseMark(state, tile.id)).toBeNull()
          else expect(houseMark(state, tile.id)).not.toBeNull()
        }
      }),
      runs,
    )
  })

  it('ação recusada devolve o mesmo estado, sem eventos', () => {
    fc.assert(
      fc.property(gameArb, fc.constantFrom('C3', 'Z9', 'F6'), (game, to) => {
        const state = play(game)
        const result = transition(state, { type: 'move', to }, { seat: 'ninguém' })
        expect(result.ok).toBe(false)
        expect(result.state).toBe(state)
        expect(result.events).toEqual([])
      }),
      runs,
    )
  })

  it('as partidas chegam ao fim jogando só fim de turno', () => {
    fc.assert(
      fc.property(gameArb, (game) => {
        let state = start(game)
        for (let i = 0; i < 200 && state.phase === 'playing'; i++) {
          const result = transition(state, { type: 'end-turn' }, { seat: state.activeSeat })
          if (!result.ok) throw new Error(result.reason)
          state = result.state
        }
        // Sem ninguém resgatar, a água vence: ilhados ou nível.
        expect(state.phase).toBe('lost')
        expect(countResidents(state).safe).toBe(0)
      }),
      runs,
    )
  })
})

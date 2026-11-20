// Uma partida jogada só por bots, com as métricas da simulação (roadmap, Etapa 2).
import { botMove, type BotWeights } from '@village-flood/bots'
import {
  countResidents,
  newGame,
  transition,
  type Difficulty,
  type GameData,
  type LossReason,
  type RoleId,
} from '@village-flood/engine'

export interface GameMetrics {
  readonly won: boolean
  readonly lossReason: LossReason | 'timeout' | null
  /** Turnos jogados (um por assento, incluindo turnos perdidos). */
  readonly turns: number
  readonly finalLevel: number
  readonly safe: number
  readonly stranded: number
  /** Vezes que um voluntário foi apanhado pela água. */
  readonly swept: number
  readonly skippedTurns: number
  /** Entregas na igreja com 2 moradores de uma vez (Barqueira). */
  readonly doubleDeliveries: number
}

/** Limite de segurança: nenhuma partida real chega perto disso. */
const MAX_TURNS = 500

export function playGame(
  data: GameData,
  difficulty: Difficulty,
  roles: readonly RoleId[],
  seed: number,
  weights?: BotWeights,
): GameMetrics {
  let state = newGame(
    { difficulty, seed, seats: roles.map((role, i) => ({ seat: `seat-${i + 1}`, role })) },
    data,
  )
  let swept = 0
  let skippedTurns = 0
  let doubleDeliveries = 0
  while (state.phase === 'playing' && state.turn <= MAX_TURNS) {
    const seat = state.activeSeat
    const result = transition(state, botMove(state, seat, weights), { seat })
    if (!result.ok) throw new Error(`O bot fez uma ação recusada: ${result.reason}`)
    for (const event of result.events) {
      if (event.type === 'volunteer-swept') swept++
      else if (event.type === 'turn-skipped') skippedTurns++
      else if (event.type === 'delivered' && event.residentIds.length >= 2) doubleDeliveries++
    }
    state = result.state
  }
  const counts = countResidents(state)
  return {
    won: state.phase === 'won',
    lossReason:
      state.phase === 'lost'
        ? (state.lossReason ?? null)
        : state.phase === 'playing'
          ? 'timeout'
          : null,
    turns: state.turn,
    finalLevel: state.riverLevel,
    safe: counts.safe,
    stranded: counts.stranded,
    swept,
    skippedTurns,
    doubleDeliveries,
  }
}

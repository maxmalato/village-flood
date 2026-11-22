// O Enchente na Vila visto pelo kit de salas (GameDefinition): liga o motor e os bots às salas.
import { botMove } from '@village-flood/bots'
import {
  actorsOf,
  defaultGameData,
  newGame,
  roleIds,
  transition,
  type Action,
  type GameEvent,
  type GameState,
  type RoleId,
} from '@village-flood/engine'
import type { GameDefinition } from '@village-flood/kit'
import {
  defaultRoomConfig,
  parseAction,
  parsePingTarget,
  parseRole,
  parseRoomConfig,
  pingKinds,
  type RoomConfig,
} from '@village-flood/protocol'

export const villageFlood: GameDefinition<GameState, Action, GameEvent, RoomConfig, RoleId> = {
  id: 'village-flood',
  minSeats: defaultGameData.rules.seats.min,
  maxSeats: defaultGameData.rules.seats.max,
  defaultConfig: defaultRoomConfig,
  pingKinds,
  tableOverlays: ['legend'],
  parseConfig: parseRoomConfig,
  parseProfile: parseRole,
  parseAction,
  parsePingTarget,
  // Bots recebem papéis sorteados entre os que sobram (regras, seção 3).
  freeProfile(taken, random) {
    const free = roleIds.filter((role) => !taken.includes(role))
    if (free.length === 0) return null
    return free[Math.floor(random() * free.length)] ?? free[0] ?? null
  },
  sameProfile: (a, b) => a === b,
  validateSeats(_config, seats) {
    return new Set(seats.map((s) => s.profile)).size === seats.length ? null : 'repeatedRole'
  },
  newGame: (config, seats, seed) =>
    newGame({
      difficulty: config.difficulty,
      seed,
      seats: seats.map((s) => ({ seat: s.seat, role: s.profile })),
    }),
  transition(state, action, seat) {
    const result = transition(state, action, { seat })
    return result.ok
      ? { ok: true, state: result.state, events: result.events }
      : { ok: false, reason: result.reason }
  },
  activeSeat: (state) => (state.phase === 'playing' ? state.activeSeat : null),
  actorsOf,
  turnKey: (state) => String(state.turn),
  isOver: (state) => state.phase !== 'playing',
  botMove,
}

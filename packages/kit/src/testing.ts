// Jogo fictício para testar o kit sem nenhum jogo real (prova que o kit é agnóstico).
// Cada assento, na sua vez, soma números; "end" passa a vez; acaba quando o total chega a 10.
import type { GameDefinition } from './definition.ts'

export interface CountState {
  readonly seats: readonly string[]
  readonly turn: number
  readonly total: number
  readonly addedThisTurn: boolean
  readonly seed: number
}
export type CountAction = { type: 'add'; n: number } | { type: 'end' }
export type CountEvent = { type: 'added'; n: number } | { type: 'ended' }
export interface CountConfig {
  readonly target: number
}
export type CountProfile = 'red' | 'blue' | 'green'

const colors: CountProfile[] = ['red', 'blue', 'green']

export const countGame: GameDefinition<
  CountState,
  CountAction,
  CountEvent,
  CountConfig,
  CountProfile
> = {
  id: 'count',
  minSeats: 2,
  maxSeats: 3,
  defaultConfig: { target: 10 },
  pingKinds: ['here'],
  tableOverlays: ['help'],
  parseConfig: (raw) =>
    typeof raw === 'object' && raw !== null && typeof (raw as CountConfig).target === 'number'
      ? { target: (raw as CountConfig).target }
      : null,
  parseProfile: (raw) => (colors.includes(raw as CountProfile) ? (raw as CountProfile) : null),
  parseAction: (raw) => {
    const a = raw as CountAction
    if (a?.type === 'end') return { type: 'end' }
    if (a?.type === 'add' && Number.isInteger(a.n) && a.n >= 1 && a.n <= 3)
      return { type: 'add', n: a.n }
    return null
  },
  parsePingTarget: (_state, raw) => (typeof raw === 'string' && /^[a-z]$/.test(raw) ? raw : null),
  freeProfile: (taken) => colors.find((c) => !taken.includes(c)) ?? null,
  sameProfile: (a, b) => a === b,
  validateSeats: (_config, seats) =>
    new Set(seats.map((s) => s.profile)).size === seats.length ? null : 'repeated',
  newGame: (_config, seats, seed) => ({
    seats: seats.map((s) => s.seat),
    turn: 0,
    total: 0,
    addedThisTurn: false,
    seed,
  }),
  transition: (state, action) => {
    if (state.total >= 10) return { ok: false, reason: 'over' }
    if (action.type === 'add') {
      return {
        ok: true,
        state: { ...state, total: state.total + action.n, addedThisTurn: true },
        events: [{ type: 'added', n: action.n }],
      }
    }
    return {
      ok: true,
      state: { ...state, turn: state.turn + 1, addedThisTurn: false },
      events: [{ type: 'ended' }],
    }
  },
  activeSeat: (state) =>
    state.total >= 10 ? null : (state.seats[state.turn % state.seats.length] ?? null),
  actorsOf: (state) => {
    const active = countGame.activeSeat(state)
    return active ? [active] : []
  },
  turnKey: (state) => String(state.turn),
  isOver: (state) => state.total >= 10,
  botMove: (state) => (state.addedThisTurn ? { type: 'end' } : { type: 'add', n: 1 }),
}

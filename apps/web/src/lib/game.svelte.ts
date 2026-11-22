// Partida local (um aparelho): guarda o estado, aplica ações pelo motor e faz os bots jogarem.
import { botMove, suggest } from '@village-flood/bots'
import {
  newGame,
  transition,
  type Action,
  type Difficulty,
  type GameEvent,
  type GameState,
  type SeatId,
  type Variation,
} from '@village-flood/engine'
import type { Locale } from '../i18n.ts'
import type { GameController, Hint, SeatStats } from './controller.ts'
import type { LocalSetup } from './setup.ts'
import { actionTile, eventMessages, seatColors, type SeatInfo } from './view.ts'

/**
 * Dificuldades em que a Dica aparece (decisão do dono do projeto, 21/11/2026: só no Tranquilo).
 * É uma escolha da interface, não uma regra do jogo.
 */
export const hintDifficulties: readonly Difficulty[] = ['easy']

export type { Hint, SeatStats } from './controller.ts'

export class LocalGame implements GameController {
  /** Estado do motor. `raw`: o motor já devolve objetos novos (imutáveis). */
  state = $state.raw<GameState>() as GameState
  selected = $state<string | null>(null)
  hint = $state.raw<Hint | null>(null)
  /** Últimas frases dos eventos (anunciadas em aria-live). */
  messages = $state.raw<string[]>([])
  /** Aviso importante (ex.: voluntário apanhado pela água). */
  alert = $state<string | null>(null)
  /** Motivo da última ação recusada. */
  rejected = $state<string | null>(null)
  stats = $state.raw<Record<SeatId, SeatStats>>({})

  readonly seats: SeatInfo[]
  readonly setup: LocalSetup
  private readonly botDelay: number
  private timer: ReturnType<typeof setTimeout> | null = null
  locale: Locale

  constructor(
    setup: LocalSetup,
    options: { seed: number; botDelay: number; locale: Locale; variation?: Variation },
  ) {
    this.setup = setup
    this.botDelay = options.botDelay
    this.locale = options.locale
    this.seats = setup.seats.map((s, i) => ({
      seat: `seat-${i + 1}`,
      name: s.name.trim(),
      role: s.role,
      bot: s.bot,
      color: seatColors[i % seatColors.length] ?? '#C9D8E3',
    }))
    this.state = newGame({
      difficulty: setup.difficulty,
      seed: options.seed,
      seats: this.seats.map((s) => ({ seat: s.seat, role: s.role })),
      ...(options.variation ? { variation: options.variation } : {}),
    })
    this.stats = Object.fromEntries(
      this.seats.map((s) => [s.seat, { rescues: 0, heals: 0, radioCalls: 0 }]),
    )
    this.scheduleBot()
  }

  get active(): SeatInfo | undefined {
    return this.seats.find((s) => s.seat === this.state.activeSeat)
  }

  get isBotTurn(): boolean {
    return this.state.phase === 'playing' && (this.active?.bot ?? false)
  }

  get activeIsBot(): boolean {
    return this.active?.bot ?? false
  }

  get isHumanTurn(): boolean {
    return this.state.phase === 'playing' && !(this.active?.bot ?? true)
  }

  select(tileId: string | null) {
    this.selected = tileId
    this.rejected = null
  }

  /** Aplica a ação de quem tem a vez. Devolve se foi aceita. */
  act(action: Action): void {
    const result = transition(this.state, action, { seat: this.state.activeSeat })
    if (!result.ok) {
      this.rejected = result.reason
      return
    }
    this.rejected = null
    this.state = result.state
    this.hint = null
    this.record(result.events)
    if (action.type === 'end-turn' || this.state.phase !== 'playing') this.selected = null
    this.scheduleBot()
  }

  /** Dica: a mesma lógica do bot, para quem tem a vez. */
  get hintAvailable(): boolean {
    return hintDifficulties.includes(this.state.config.difficulty)
  }

  showHint() {
    if (!this.isHumanTurn || !this.hintAvailable) return
    const plan = suggest(this.state, this.state.activeSeat)
    this.hint = { actions: plan.actions }
    const first = plan.actions[0]
    if (first) this.selected = actionTile(this.state, first)
  }

  applyHint() {
    const first = this.hint?.actions[0] ?? { type: 'end-turn' as const }
    this.act(first)
  }

  setLocale(locale: Locale) {
    this.locale = locale
  }

  destroy() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  private record(events: readonly GameEvent[]) {
    const { messages, alerts } = eventMessages(events, this.seats, this.state, this.locale)
    this.messages = messages
    if (alerts.length > 0) this.alert = alerts.join(' ')
    else if (events.some((e) => e.type === 'turn-started')) this.alert = null
    const stats = { ...this.stats }
    const bump = (seat: SeatId, key: keyof SeatStats, n = 1) => {
      const current = stats[seat] ?? { rescues: 0, heals: 0, radioCalls: 0 }
      stats[seat] = { ...current, [key]: current[key] + n }
    }
    for (const e of events) {
      if (e.type === 'delivered') bump(e.seat, 'rescues', e.residentIds.length)
      if (e.type === 'healed') bump(e.seat, 'heals')
      if (e.type === 'radio-called') bump(e.seat, 'radioCalls')
    }
    this.stats = stats
  }

  private scheduleBot() {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    if (!this.isBotTurn) return
    this.timer = setTimeout(() => {
      this.timer = null
      if (!this.isBotTurn) return
      this.act(botMove(this.state, this.state.activeSeat))
    }, this.botDelay)
  }
}

// Partida online: o controlador que a tela da partida usa, alimentado pela conexão com a sala.
// O servidor aplica as ações; aqui só se envia o pedido, mostra o estado e narra os eventos.
import { suggest } from '@village-flood/bots'
import type { Action, GameEvent, GameState, RoleId, SeatId } from '@village-flood/engine'
import { TABLE_SEAT, type Notice } from '@village-flood/kit'
import type { PingKind, RoomConfig, VillageRoomView } from '@village-flood/protocol'
import { t, type Locale, type MessageKey } from '../../i18n.ts'
import type { GameController, Hint, OnlineControls, PingView, SeatStats } from '../controller.ts'
import { hintDifficulties } from '../game.svelte.ts'
import { actionTile, eventMessages, seatColors, seatName, type SeatInfo } from '../view.ts'
import { cueFor, sound } from '../sound.ts'
import { awaySummary, loadSnapshot, saveSnapshot, snapshotOf, type AwaySummary } from './away.ts'
import { RoomConnection } from './connection.svelte.ts'

/** Assentos como a tela os mostra; o bot no lugar de quem caiu conta como bot. */
export function seatsOf(room: VillageRoomView, mySeat: SeatId | null): SeatInfo[] {
  return room.seats.map((s, i) => ({
    seat: s.seat,
    name: s.name,
    role: s.profile,
    bot: s.kind === 'bot' || s.presence === 'bot' || s.presence === 'returning',
    color: seatColors[i % seatColors.length] ?? '#C9D8E3',
    // bot do lobby não tem "presença" (só pessoas caem, voltam ou têm um bot no lugar)
    ...(s.kind === 'human' ? { presence: s.presence } : {}),
    you: s.seat === mySeat,
  }))
}

export class OnlineGame implements GameController {
  readonly connection: RoomConnection
  selected = $state<string | null>(null)
  hint = $state.raw<Hint | null>(null)
  messages = $state.raw<string[]>([])
  alert = $state<string | null>(null)
  rejected = $state<string | null>(null)
  /** Erro da sala (ex.: só a anfitriã pode começar). Chave de i18n "error.*". */
  error = $state<string | null>(null)
  /** Aviso de conexão de alguém da equipe (caiu, bot assumiu, voltou). */
  notice = $state<string | null>(null)
  stats = $state.raw<Record<SeatId, SeatStats>>({})
  /** Quando este aparelho viu o turno 1 desta partida (ms); null se entrou no meio. */
  startedAt = $state<number | null>(null)
  /** Último turno visto, para notar uma partida nova (jogar de novo). */
  private lastTurn: number | null = null
  /** Prazo (relógio deste aparelho) para o bot assumir a vez de quem caiu. */
  deadlines = $state.raw<Record<SeatId, number>>({})
  /** O que mudou enquanto este aparelho estava fora da sala. */
  away = $state.raw<AwaySummary | null>(null)
  /** Na primeira visão da sala depois de entrar ou voltar, compara com o último retrato. */
  private checkAway = true
  locale: Locale

  constructor(code: string, who: { token: string } | { name: string }, locale: Locale) {
    this.locale = locale
    this.connection = new RoomConnection(code, who, {
      onUpdate: (events) => this.record(events),
      onNotice: (notice, room) => this.announce(notice, room),
      onError: (code, detail) => this.fail(code, detail),
      onRoom: (room) => this.seen(room),
      onWelcome: () => {
        this.checkAway = true
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- getters do objeto abaixo
    const game = this
    this.online = {
      get mySeat() {
        return game.mySeat
      },
      get pings() {
        return game.pings
      },
      get canPing() {
        return game.canPing
      },
      get notice() {
        return game.notice
      },
      get error() {
        return game.error
      },
      get reconnecting() {
        return game.connection.status === 'reconnecting'
      },
      get awaySeats() {
        return game.awaySeats
      },
      get awaySummary() {
        return game.away
      },
      dismissAway: () => {
        this.away = null
      },
      get table() {
        return game.room?.table?.connected && !game.isTable
          ? {
              legendOpen: game.tableLegendOpen,
              setLegend: (open: boolean) => game.setTableLegend(open),
            }
          : null
      },
      ping: (target, kind) => this.ping(target, kind),
      unping: (index) => this.unping(index),
    }
  }

  // ---------- sala ----------

  get room(): VillageRoomView | null {
    return this.connection.room
  }

  get mySeat(): SeatId | null {
    return this.connection.seat
  }

  /** Este aparelho é a mesa (TV): só mostra a partida. */
  get isTable(): boolean {
    return this.connection.seat === TABLE_SEAT
  }

  get tableLegendOpen(): boolean {
    return this.room?.table?.overlay === 'legend'
  }

  /** Abre ou fecha a legenda completa na TV (da própria mesa ou de um celular). */
  setTableLegend(open: boolean) {
    this.connection.send({ type: 'table-overlay', overlay: open ? 'legend' : null })
  }

  get isHost(): boolean {
    return this.room !== null && this.room.host === this.mySeat
  }

  readonly seats: SeatInfo[] = $derived.by(() => this.currentSeats())

  private currentSeats(): SeatInfo[] {
    const room = this.connection.room
    return room ? seatsOf(room, this.connection.seat) : []
  }

  get me(): SeatInfo | undefined {
    return this.seats.find((s) => s.you)
  }

  setProfile(role: RoleId) {
    this.clearError()
    this.connection.send({ type: 'profile', profile: role })
  }

  setConfig(config: RoomConfig) {
    this.clearError()
    this.connection.send({ type: 'config', config })
  }

  addBot() {
    this.clearError()
    this.connection.send({ type: 'add-bot' })
  }

  removeSeat(seat: SeatId) {
    this.clearError()
    this.connection.send({ type: 'remove-seat', seat })
  }

  start() {
    this.clearError()
    this.messages = []
    this.alert = null
    this.notice = null
    this.stats = {}
    this.startedAt = Date.now()
    this.lastTurn = 1
    this.connection.send({ type: 'start' })
  }

  again() {
    this.clearError()
    this.connection.send({ type: 'again' })
  }

  leave() {
    this.connection.leave()
  }

  destroy() {
    this.connection.close()
  }

  setLocale(locale: Locale) {
    this.locale = locale
  }

  // ---------- partida (GameController) ----------

  get mode(): 'online' | 'table' {
    return this.room?.table ? 'table' : 'online'
  }

  get state(): GameState {
    return this.connection.room?.game as GameState
  }

  get active(): SeatInfo | undefined {
    const game = this.room?.game
    return game ? this.seats.find((s) => s.seat === game.activeSeat) : undefined
  }

  get activeIsBot(): boolean {
    return this.active?.bot ?? false
  }

  get isHumanTurn(): boolean {
    const room = this.room
    return (
      room !== null &&
      room.status === 'playing' &&
      room.game?.phase === 'playing' &&
      room.game.activeSeat === this.mySeat &&
      this.me?.presence === 'connected' &&
      this.connection.status === 'open'
    )
  }

  get hintAvailable(): boolean {
    const game = this.room?.game
    return game ? hintDifficulties.includes(game.config.difficulty) : false
  }

  readonly online: OnlineControls

  get pings(): PingView[] {
    return (this.room?.pings ?? []).map((p, index) => ({
      index,
      seat: p.seat,
      target: p.target,
      kind: p.kind as PingKind,
    }))
  }

  get canPing(): boolean {
    const room = this.room
    return (
      room !== null &&
      room.status === 'playing' &&
      room.game?.phase === 'playing' &&
      room.game.activeSeat !== this.mySeat &&
      this.me?.presence === 'connected' &&
      this.connection.status === 'open'
    )
  }

  select(tileId: string | null) {
    this.selected = tileId
    this.rejected = null
  }

  act(action: Action) {
    if (!this.isHumanTurn) return
    this.rejected = null
    this.clearError()
    this.hint = null
    this.connection.send({ type: 'action', action })
    if (action.type === 'end-turn') this.selected = null
  }

  showHint() {
    if (!this.isHumanTurn || !this.hintAvailable) return
    const plan = suggest(this.state, this.state.activeSeat)
    this.hint = { actions: plan.actions }
    const first = plan.actions[0]
    if (first) this.selected = actionTile(this.state, first)
  }

  applyHint() {
    this.act(this.hint?.actions[0] ?? { type: 'end-turn' })
  }

  ping(target: string, kind: PingKind) {
    if (!this.canPing) return
    this.clearError()
    this.connection.send({ type: 'ping', target, kind })
  }

  unping(index: number) {
    this.clearError()
    this.connection.send({ type: 'unping', index })
  }

  /** Quem está sem conexão agora (e o prazo do bot, se a vez é dele). */
  get awaySeats(): { seat: SeatId; name: string; deadline: number | null }[] {
    return this.seats
      .filter((s) => s.presence === 'away')
      .map((s) => ({ seat: s.seat, name: s.name, deadline: this.deadlines[s.seat] ?? null }))
  }

  // ---------- mensagens do servidor ----------

  /** Cada visão nova da sala: prazos do bot, resumo de quem voltou e o retrato da partida. */
  private seen(room: VillageRoomView) {
    const now = Date.now()
    const deadlines: Record<SeatId, number> = {}
    for (const s of room.seats) {
      if (s.takeoverInMs !== null) deadlines[s.seat] = now + s.takeoverInMs
    }
    this.deadlines = deadlines
    const game = room.game
    if (!game || room.status !== 'playing' || this.isTable) return
    if (this.checkAway) {
      this.checkAway = false
      this.away = awaySummary(loadSnapshot(), room.code, game)
    }
    saveSnapshot(snapshotOf(room.code, game))
  }

  private clearError() {
    this.error = null
  }

  private fail(code: string, detail?: string) {
    if (code === 'refused' && detail) {
      this.rejected = detail
      return
    }
    this.error = code
  }

  private record(events: readonly GameEvent[]) {
    const game = this.room?.game
    if (!game) return
    // Partida nova (começo ou "jogar de novo"): zera os números e marca o início.
    if (game.turn === 1 && this.lastTurn !== 1) {
      if (this.lastTurn !== null) this.stats = {}
      this.startedAt = Date.now()
    }
    this.lastTurn = game.turn
    // Na mesa, a TV toca os sons de todos; os celulares só avisam "sua vez" (sem eco na sala).
    const cue = cueFor(events, this.isTable ? null : this.mySeat)
    const tableInRoom = this.room?.table?.connected && !this.isTable
    sound.play(tableInRoom && cue !== 'your-turn' ? null : cue)
    if (events.some((e) => e.type === 'turn-started')) {
      this.hint = null
      if (game.activeSeat !== this.mySeat) this.selected = null
    }
    const { messages, alerts } = eventMessages(events, this.seats, game, this.locale)
    this.messages = messages
    if (alerts.length > 0) this.alert = alerts.join(' ')
    else if (events.some((e) => e.type === 'turn-started')) this.alert = null
    const stats = { ...this.stats }
    const bump = (seat: SeatId, key: keyof SeatStats, n = 1) => {
      const current = stats[seat] ?? { rescues: 0, heals: 0, radioCalls: 0 }
      stats[seat] = { ...current, [key]: (current[key] ?? 0) + n }
    }
    for (const e of events) {
      if (e.type === 'delivered') bump(e.seat, 'rescues', e.residentIds.length)
      if (e.type === 'healed') bump(e.seat, 'heals')
      if (e.type === 'radio-called') bump(e.seat, 'radioCalls')
      if (e.type === 'volunteer-swept') bump(e.seat, 'swept')
    }
    this.stats = stats
  }

  private announce(notice: Notice, room: VillageRoomView) {
    const seats = seatsOf(room, this.mySeat)
    const mine = notice.seat === this.mySeat
    const name = seatName(seats, notice.seat)
    const key: Record<Notice['type'], MessageKey> = {
      'player-away': 'notice.away',
      'bot-took-over': mine ? 'notice.youBot' : 'notice.botTookOver',
      'player-back-soon': mine ? 'notice.youBackSoon' : 'notice.backSoon',
      'player-returned': mine ? 'notice.youReturned' : 'notice.returned',
    }
    this.notice = t(this.locale, key[notice.type], { name })
  }
}

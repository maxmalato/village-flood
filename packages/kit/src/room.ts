// Núcleo da sala: funções puras sobre um registro serializável (sem rede, sem relógio, sem
// aleatoriedade própria). O servidor (Durable Object) guarda o registro, entrega as mensagens
// e chama `tick` no alarme. Regras de desconexão: regras, seção 10; spec, seção 8.
import { MAX_NAME_LENGTH, MAX_PINGS_PER_TURN, ROOM_TTL_MS, type RoomTimings } from './constants.ts'
import type { GameDefinition, SeatId, SeatProfileEntry } from './definition.ts'
import type { Notice } from './messages.ts'

export type RoomStatus = 'lobby' | 'playing' | 'over'

/**
 * Presença de um assento de pessoa:
 * - connected: a pessoa está conectada e joga;
 * - away: a conexão caiu e o bot ainda não assumiu;
 * - bot: o bot joga no lugar dela;
 * - returning: ela voltou e retoma o controle no início do próprio turno seguinte.
 */
export type Presence = 'connected' | 'away' | 'bot' | 'returning'

export interface SeatRecord<P> {
  readonly seat: SeatId
  /** Apelido (vazio para assentos de bot; a interface mostra "Bot"). */
  readonly name: string
  readonly kind: 'human' | 'bot'
  readonly profile: P
  /** SHA-256 do token do aparelho; o token em si nunca é guardado. */
  readonly tokenHash: string | null
  readonly presence: Presence
  /** Quando o bot assume a vez de quem caiu (só durante a vez da pessoa). */
  readonly takeoverAt: number | null
}

export interface Ping {
  readonly seat: SeatId
  readonly target: string
  readonly kind: string
}

export interface RoomRecord<S, C, P> {
  readonly code: string
  readonly status: RoomStatus
  /** Quem criou a sala e comanda (começar, bots, jogar de novo). */
  readonly host: SeatId | null
  readonly seats: readonly SeatRecord<P>[]
  readonly config: C
  readonly game: S | null
  readonly turnKey: string | null
  /** Sugestões dos jogadores no turno atual (fora do estado do jogo, apagadas ao fim do turno). */
  readonly pings: readonly Ping[]
  /** Próxima jogada de bot (null: ninguém do bot na vez). */
  readonly nextBotAt: number | null
  readonly nextSeatNumber: number
  readonly createdAt: number
  readonly lastActivity: number
}

/** Resultado de uma operação: o novo registro, os eventos do jogo e os avisos para a equipe. */
export interface Outcome<S, E, C, P> {
  readonly record: RoomRecord<S, C, P>
  readonly events: readonly E[]
  readonly notices: readonly Notice[]
  readonly error?: string
  /** Quem fez a jogada (para a interface animar). */
  readonly by: SeatId | null
}

/** Visão pública da sala: tudo que os aparelhos veem. Nunca inclui os tokens. */
export interface RoomView<S, C, P> {
  readonly code: string
  readonly status: RoomStatus
  readonly host: SeatId | null
  readonly seats: readonly {
    readonly seat: SeatId
    readonly name: string
    readonly kind: 'human' | 'bot'
    readonly profile: P
    readonly presence: Presence
  }[]
  readonly config: C
  readonly game: S | null
  readonly pings: readonly Ping[]
}

type Def<S, A, E, C, P> = GameDefinition<S, A, E, C, P>

// ---------- Criação e visão ----------

export function createRoom<S, C, P>(code: string, config: C, now: number): RoomRecord<S, C, P> {
  return {
    code,
    status: 'lobby',
    host: null,
    seats: [],
    config,
    game: null,
    turnKey: null,
    pings: [],
    nextBotAt: null,
    nextSeatNumber: 1,
    createdAt: now,
    lastActivity: now,
  }
}

export function viewOf<S, C, P>(record: RoomRecord<S, C, P>): RoomView<S, C, P> {
  return {
    code: record.code,
    status: record.status,
    host: record.host,
    seats: record.seats.map(({ seat, name, kind, profile, presence }) => ({
      seat,
      name,
      kind,
      profile,
      presence,
    })),
    config: record.config,
    game: record.game,
    pings: record.pings,
  }
}

/** Quem controla o assento agora: a pessoa, o bot, ou ninguém (caiu e o bot ainda não assumiu). */
export function controllerOf<P>(seat: SeatRecord<P>): 'human' | 'bot' | 'none' {
  if (seat.kind === 'bot') return 'bot'
  if (seat.presence === 'connected') return 'human'
  if (seat.presence === 'away') return 'none'
  return 'bot'
}

/** Quando o servidor precisa acordar (bot jogar, bot assumir ou sala expirar). */
export function nextWake<S, C, P>(record: RoomRecord<S, C, P>): number {
  let next = record.lastActivity + ROOM_TTL_MS
  if (record.nextBotAt !== null) next = Math.min(next, record.nextBotAt)
  for (const seat of record.seats) {
    if (seat.takeoverAt !== null) next = Math.min(next, seat.takeoverAt)
  }
  return next
}

export function isExpired<S, C, P>(record: RoomRecord<S, C, P>, now: number): boolean {
  return now >= record.lastActivity + ROOM_TTL_MS
}

// ---------- Auxiliares ----------

function ok<S, E, C, P>(
  record: RoomRecord<S, C, P>,
  extra: { events?: readonly E[]; notices?: readonly Notice[]; by?: SeatId | null } = {},
): Outcome<S, E, C, P> {
  return { record, events: extra.events ?? [], notices: extra.notices ?? [], by: extra.by ?? null }
}

function fail<S, E, C, P>(record: RoomRecord<S, C, P>, error: string, detail?: string) {
  return {
    record,
    events: [],
    notices: [],
    by: null,
    error: detail ? `${error}:${detail}` : error,
  } as Outcome<S, E, C, P>
}

function patchSeat<S, C, P>(
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  patch: Partial<SeatRecord<P>>,
): RoomRecord<S, C, P> {
  return { ...record, seats: record.seats.map((s) => (s.seat === seat ? { ...s, ...patch } : s)) }
}

const findSeat = <S, C, P>(record: RoomRecord<S, C, P>, seat: SeatId) =>
  record.seats.find((s) => s.seat === seat)

/** Quem comanda a sala: quem criou; se caiu, qualquer pessoa conectada (para não travar). */
export function canCommand<S, C, P>(record: RoomRecord<S, C, P>, seat: SeatId): boolean {
  const me = findSeat(record, seat)
  if (!me || me.kind !== 'human' || me.presence !== 'connected') return false
  if (record.host === seat) return true
  const host = record.host ? findSeat(record, record.host) : undefined
  return !host || host.presence !== 'connected'
}

function touch<S, C, P>(record: RoomRecord<S, C, P>, now: number): RoomRecord<S, C, P> {
  return { ...record, lastActivity: now }
}

// ---------- Entrada e saída ----------

/** Pessoa nova (só no lobby). O servidor gera o token e passa só o hash. */
export function joinRoom<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  rawName: string,
  tokenHash: string,
  now: number,
  random: () => number,
): Outcome<S, E, C, P> & { seat?: SeatId } {
  if (record.status !== 'lobby') return fail(record, 'gameStarted')
  if (record.seats.length >= def.maxSeats) return fail(record, 'roomFull')
  const name = rawName.trim()
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return fail(record, 'invalidName')
  const lower = name.toLocaleLowerCase()
  if (record.seats.some((s) => s.name.toLocaleLowerCase() === lower))
    return fail(record, 'nameTaken')
  const profile = def.freeProfile(
    record.seats.map((s) => s.profile),
    random,
  )
  if (profile === null) return fail(record, 'roomFull')
  const seat = `seat-${record.nextSeatNumber}`
  const next: RoomRecord<S, C, P> = {
    ...touch(record, now),
    host: record.host ?? seat,
    nextSeatNumber: record.nextSeatNumber + 1,
    seats: [
      ...record.seats,
      { seat, name, kind: 'human', profile, tokenHash, presence: 'connected', takeoverAt: null },
    ],
  }
  return { ...ok(next), seat }
}

/**
 * Volta pelo token (mesmo aparelho). Quem caiu e ainda não foi substituído volta na hora;
 * quem já tinha o bot no lugar retoma no início do próprio turno seguinte.
 */
export function reconnect<S, C, P, E>(
  record: RoomRecord<S, C, P>,
  tokenHash: string,
  now: number,
): Outcome<S, E, C, P> & { seat?: SeatId } {
  const me = record.seats.find((s) => s.kind === 'human' && s.tokenHash === tokenHash)
  if (!me) return fail(record, 'unknownToken')
  let next = touch(record, now)
  const notices: Notice[] = []
  if (me.presence === 'away') {
    next = patchSeat(next, me.seat, { presence: 'connected', takeoverAt: null })
    if (record.status === 'playing') notices.push({ type: 'player-returned', seat: me.seat })
  } else if (me.presence === 'bot') {
    next = patchSeat(next, me.seat, { presence: 'returning' })
    notices.push({ type: 'player-back-soon', seat: me.seat })
  }
  return { ...ok(next, { notices }), seat: me.seat }
}

/** A última conexão do assento caiu. */
export function disconnect<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  now: number,
  timings: RoomTimings,
): Outcome<S, E, C, P> {
  const me = findSeat(record, seat)
  if (!me || me.kind !== 'human') return ok(record)
  if (me.presence === 'returning') {
    // voltou e caiu de novo antes de retomar: o bot continua
    return ok(patchSeat(record, seat, { presence: 'bot' }))
  }
  if (me.presence !== 'connected') return ok(record)
  const myTurn =
    record.status === 'playing' && record.game !== null && def.activeSeat(record.game) === seat
  const next = patchSeat(record, seat, {
    presence: 'away',
    takeoverAt: myTurn ? now + timings.takeoverMs : null,
  })
  const notices: Notice[] = record.status === 'playing' ? [{ type: 'player-away', seat }] : []
  return ok(next, { notices })
}

// ---------- Lobby ----------

export function setProfile<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  raw: unknown,
  now: number,
): Outcome<S, E, C, P> {
  if (record.status !== 'lobby') return fail(record, 'gameStarted')
  const profile = def.parseProfile(raw)
  if (profile === null) return fail(record, 'invalidProfile')
  if (record.seats.some((s) => s.seat !== seat && def.sameProfile(s.profile, profile))) {
    return fail(record, 'profileTaken')
  }
  return ok(patchSeat(touch(record, now), seat, { profile }))
}

export function setConfig<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  raw: unknown,
  now: number,
): Outcome<S, E, C, P> {
  if (record.status !== 'lobby') return fail(record, 'gameStarted')
  if (!canCommand(record, seat)) return fail(record, 'onlyHost')
  const config = def.parseConfig(raw)
  if (config === null) return fail(record, 'invalidConfig')
  return ok({ ...touch(record, now), config })
}

export function addBot<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  now: number,
  random: () => number,
): Outcome<S, E, C, P> {
  if (record.status !== 'lobby') return fail(record, 'gameStarted')
  if (!canCommand(record, seat)) return fail(record, 'onlyHost')
  if (record.seats.length >= def.maxSeats) return fail(record, 'roomFull')
  const profile = def.freeProfile(
    record.seats.map((s) => s.profile),
    random,
  )
  if (profile === null) return fail(record, 'roomFull')
  // Nome neutro e único ("Bot 1", "Bot 2"...), igual em todos os aparelhos.
  const names = new Set(record.seats.map((s) => s.name.toLocaleLowerCase()))
  let n = 1
  while (names.has(`bot ${n}`)) n++
  const bot: SeatRecord<P> = {
    seat: `seat-${record.nextSeatNumber}`,
    name: `Bot ${n}`,
    kind: 'bot',
    profile,
    tokenHash: null,
    presence: 'bot',
    takeoverAt: null,
  }
  return ok({
    ...touch(record, now),
    nextSeatNumber: record.nextSeatNumber + 1,
    seats: [...record.seats, bot],
  })
}

/** Tira um bot, ou uma pessoa que caiu, antes de começar. */
export function removeSeat<S, C, P, E>(
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  target: SeatId,
  now: number,
): Outcome<S, E, C, P> {
  if (record.status !== 'lobby') return fail(record, 'gameStarted')
  if (!canCommand(record, seat)) return fail(record, 'onlyHost')
  const victim = findSeat(record, target)
  if (!victim || target === seat) return fail(record, 'invalidTarget')
  if (victim.kind === 'human' && victim.presence === 'connected')
    return fail(record, 'stillConnected')
  const seats = record.seats.filter((s) => s.seat !== target)
  return ok({ ...touch(record, now), seats })
}

/** Sair no lobby libera o assento; na partida, conta como desconexão (o assento não é removido). */
export function leave<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  now: number,
  timings: RoomTimings,
): Outcome<S, E, C, P> {
  if (record.status !== 'lobby') return disconnect(def, record, seat, now, timings)
  const seats = record.seats.filter((s) => s.seat !== seat)
  const host =
    record.host === seat ? (seats.find((s) => s.kind === 'human')?.seat ?? null) : record.host
  return ok({ ...touch(record, now), seats, host })
}

// ---------- Partida ----------

export function startGame<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  seed: number,
  now: number,
  timings: RoomTimings,
): Outcome<S, E, C, P> {
  if (record.status !== 'lobby') return fail(record, 'gameStarted')
  if (!canCommand(record, seat)) return fail(record, 'onlyHost')
  if (record.seats.length < def.minSeats) return fail(record, 'notEnoughSeats')
  if (!record.seats.some((s) => s.kind === 'human')) return fail(record, 'noHuman')
  if (record.seats.some((s) => s.kind === 'human' && s.presence !== 'connected')) {
    return fail(record, 'someoneAway')
  }
  const entries: SeatProfileEntry<P>[] = record.seats.map((s) => ({
    seat: s.seat,
    profile: s.profile,
  }))
  const problem = def.validateSeats(record.config, entries)
  if (problem) return fail(record, 'invalidSeats', problem)
  const game = def.newGame(record.config, entries, seed)
  const next: RoomRecord<S, C, P> = {
    ...touch(record, now),
    status: 'playing',
    game,
    turnKey: def.turnKey(game),
    pings: [],
  }
  return ok(schedule(def, next, now, timings), { by: seat })
}

export function act<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  raw: unknown,
  now: number,
  timings: RoomTimings,
): Outcome<S, E, C, P> {
  if (record.status !== 'playing' || record.game === null) return fail(record, 'notPlaying')
  const me = findSeat(record, seat)
  if (!me || controllerOf(me) !== 'human') return fail(record, 'notYourControl')
  if (!def.actorsOf(record.game).includes(seat)) return fail(record, 'notYourTurn')
  const action = def.parseAction(raw)
  if (action === null) return fail(record, 'badAction')
  return applyAction(def, touch(record, now), seat, action, now, timings)
}

function applyAction<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  action: A,
  now: number,
  timings: RoomTimings,
): Outcome<S, E, C, P> {
  if (record.game === null) return fail(record, 'notPlaying')
  const result = def.transition(record.game, action, seat)
  if (!result.ok) return fail(record, 'refused', result.reason)
  const after = afterGameChange(def, { ...record, game: result.state }, now, timings)
  return ok(after.record, { events: result.events, notices: after.notices, by: seat })
}

/**
 * Depois de cada mudança no jogo: turno novo limpa os pings, devolve o assento a quem voltou
 * e passa ao bot o assento de quem caiu; fim de partida; agenda a próxima jogada de bot.
 */
function afterGameChange<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  now: number,
  timings: RoomTimings,
): { record: RoomRecord<S, C, P>; notices: Notice[] } {
  if (record.game === null) return { record, notices: [] }
  let next = record
  const notices: Notice[] = []
  const key = def.turnKey(record.game)
  if (key !== record.turnKey) {
    next = { ...next, turnKey: key, pings: [] }
    // a vez de quem estava "away" passa a uma nova vez: o prazo de 20 s não vale mais
    next = {
      ...next,
      seats: next.seats.map((s) => (s.takeoverAt !== null ? { ...s, takeoverAt: null } : s)),
    }
    const active = def.activeSeat(record.game)
    const owner = active ? findSeat(next, active) : undefined
    if (owner?.kind === 'human') {
      if (owner.presence === 'returning') {
        next = patchSeat(next, owner.seat, { presence: 'connected' })
        notices.push({ type: 'player-returned', seat: owner.seat })
      } else if (owner.presence === 'away') {
        // caiu fora da sua vez: o bot assume no início do turno dela
        next = patchSeat(next, owner.seat, { presence: 'bot' })
        notices.push({ type: 'bot-took-over', seat: owner.seat })
      }
    }
  }
  if (def.isOver(record.game)) {
    next = { ...next, status: 'over', nextBotAt: null, pings: [] }
    next = { ...next, seats: next.seats.map((s) => ({ ...s, takeoverAt: null })) }
    return { record: next, notices }
  }
  return { record: schedule(def, next, now, timings), notices }
}

/** Agenda a próxima jogada de bot, se o dono da vez for controlado por bot. */
function schedule<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  now: number,
  timings: RoomTimings,
): RoomRecord<S, C, P> {
  if (record.game === null || record.status !== 'playing') return { ...record, nextBotAt: null }
  const active = def.activeSeat(record.game)
  const owner = active ? findSeat(record, active) : undefined
  const botTurn = owner !== undefined && controllerOf(owner) === 'bot'
  return { ...record, nextBotAt: botTurn ? (record.nextBotAt ?? now + timings.botStepMs) : null }
}

/** Alarme: o bot assume a vez de quem caiu e os bots jogam, uma ação por vez. */
export function tick<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  now: number,
  timings: RoomTimings,
): Outcome<S, E, C, P> {
  if (record.status !== 'playing' || record.game === null) return ok(record)
  let next = record
  const notices: Notice[] = []
  for (const seat of record.seats) {
    if (seat.takeoverAt !== null && seat.takeoverAt <= now && seat.presence === 'away') {
      next = patchSeat(next, seat.seat, { presence: 'bot', takeoverAt: null })
      notices.push({ type: 'bot-took-over', seat: seat.seat })
    }
  }
  next = schedule(def, next, now, timings)
  if (next.nextBotAt === null || next.nextBotAt > now || next.game === null) {
    return ok(next, { notices })
  }
  const active = def.activeSeat(next.game)
  if (active === null) return ok(next, { notices })
  const action = def.botMove(next.game, active)
  const result = applyAction(def, { ...next, nextBotAt: null }, active, action, now, timings)
  if (result.error) {
    // não deveria acontecer (o bot só faz ações legais); evita travar a sala
    return ok({ ...next, nextBotAt: now + timings.botStepMs }, { notices })
  }
  return { ...result, notices: [...notices, ...result.notices] }
}

/** Nova partida com a mesma sala (quem não está conectado sai da lista). */
export function playAgain<S, C, P, E>(
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  now: number,
): Outcome<S, E, C, P> {
  if (record.status !== 'over') return fail(record, 'notOver')
  if (!canCommand(record, seat)) return fail(record, 'onlyHost')
  const seats = record.seats
    .filter((s) => s.kind === 'bot' || s.presence === 'connected' || s.presence === 'returning')
    .map((s) =>
      s.kind === 'human' ? { ...s, presence: 'connected' as const, takeoverAt: null } : s,
    )
  const next: RoomRecord<S, C, P> = {
    ...touch(record, now),
    seats,
    status: 'lobby',
    game: null,
    turnKey: null,
    pings: [],
    nextBotAt: null,
  }
  return ok(next)
}

// ---------- Pings ----------

/** Sugestão fora da sua vez: máximo 3 por jogador e por turno; some quando o turno acaba. */
export function addPing<S, A, E, C, P>(
  def: Def<S, A, E, C, P>,
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  rawTarget: unknown,
  kind: string,
  now: number,
): Outcome<S, E, C, P> {
  if (record.status !== 'playing' || record.game === null) return fail(record, 'notPlaying')
  const me = findSeat(record, seat)
  if (!me || me.kind !== 'human' || me.presence !== 'connected')
    return fail(record, 'notYourControl')
  if (def.activeSeat(record.game) === seat) return fail(record, 'yourTurn')
  if (!def.pingKinds.includes(kind)) return fail(record, 'invalidPing')
  const target = def.parsePingTarget(record.game, rawTarget)
  if (target === null) return fail(record, 'invalidPing')
  const mine = record.pings.filter((p) => p.seat === seat)
  if (mine.length >= MAX_PINGS_PER_TURN) return fail(record, 'tooManyPings')
  // o mesmo jogador não repete a mesma sugestão na mesma quadra
  const others = record.pings.filter((p) => !(p.seat === seat && p.target === target))
  return ok({ ...touch(record, now), pings: [...others, { seat, target, kind }] })
}

export function removePing<S, C, P, E>(
  record: RoomRecord<S, C, P>,
  seat: SeatId,
  index: number,
  now: number,
): Outcome<S, E, C, P> {
  const ping = record.pings[index]
  if (!ping || ping.seat !== seat) return fail(record, 'invalidPing')
  return ok({ ...touch(record, now), pings: record.pings.filter((_, i) => i !== index) })
}

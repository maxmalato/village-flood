// Uma sala do modo de vários aparelhos: um Durable Object por sala (spec, seção 7).
// Adaptador fino entre a Cloudflare (WebSocket com hibernação, armazenamento e alarme) e o kit,
// que tem toda a lógica da sala. O servidor é a única fonte da verdade: cada ação é validada
// contra quem enviou e passa pelo mesmo motor do navegador.
import { DurableObject } from 'cloudflare:workers'
import type { GameEvent, GameState, RoleId } from '@village-flood/engine'
import {
  act,
  addBot,
  addPing,
  createRoom,
  defaultTimings,
  disconnect,
  isExpired,
  joinRoom,
  leave,
  MESSAGE_LIMIT,
  nextWake,
  parseClientMessage,
  playAgain,
  RateLimiter,
  reconnect,
  removePing,
  removeSeat,
  setConfig,
  setProfile,
  startGame,
  tick,
  viewOf,
  type ClientMessage,
  type Outcome,
  type RoomRecord,
  type RoomTimings,
  type SeatId,
} from '@village-flood/kit'
import type { RoomConfig, VillageRoomView, VillageServerMessage } from '@village-flood/protocol'
import { villageFlood as def } from './definition.ts'

type Record_ = RoomRecord<GameState, RoomConfig, RoleId>
type Out = Outcome<GameState, GameEvent, RoomConfig, RoleId>

interface Attachment {
  /** Assento do aparelho; null antes de entrar. */
  seat: SeatId | null
}

/** Resumo para a tela "Entrar com código". */
export interface RoomInfo {
  status: Record_['status']
  seats: number
  maxSeats: number
  config: RoomConfig
}

const random = () => (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 2 ** 32

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export class Room extends DurableObject<Env> {
  private record: Record_ | null = null
  /** Mensagens por aparelho (só em memória: zera se a sala hibernar). */
  private readonly limiter = new RateLimiter(MESSAGE_LIMIT.count, MESSAGE_LIMIT.windowMs)
  private readonly socketIds = new WeakMap<WebSocket, string>()

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    void ctx.blockConcurrencyWhile(async () => {
      this.record = (await ctx.storage.get<Record_>('room')) ?? null
    })
  }

  private get timings(): RoomTimings {
    const number = (value: string | undefined, fallback: number) => {
      const n = Number(value)
      return Number.isFinite(n) && n >= 0 ? n : fallback
    }
    return {
      takeoverMs: number(this.env.TAKEOVER_MS, defaultTimings.takeoverMs),
      botStepMs: number(this.env.BOT_STEP_MS, defaultTimings.botStepMs),
    }
  }

  // ---------- chamadas do Worker ----------

  /** Cria a sala; false se o código já está em uso. */
  async init(code: string, config: RoomConfig): Promise<boolean> {
    if (this.record) return false
    this.record = createRoom(code, config, Date.now())
    await this.persist()
    return true
  }

  async info(): Promise<RoomInfo | null> {
    if (!this.record) return null
    return {
      status: this.record.status,
      seats: this.record.seats.length,
      maxSeats: def.maxSeats,
      config: this.record.config,
    }
  }

  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return Response.json({ error: 'expectedWebSocket' }, { status: 426 })
    }
    if (!this.record) return Response.json({ error: 'notFound' }, { status: 404 })
    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({ seat: null } satisfies Attachment)
    return new Response(null, { status: 101, webSocket: client })
  }

  // ---------- WebSocket ----------

  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    if (!this.record) {
      ws.close(1000, 'room closed')
      return
    }
    if (!this.limiter.allow(this.socketId(ws), Date.now())) {
      return this.send(ws, { type: 'error', code: 'tooManyRequests' })
    }
    const message = typeof data === 'string' ? parseClientMessage(data) : null
    if (!message) return this.send(ws, { type: 'error', code: 'badMessage' })
    await this.handle(ws, message)
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    await this.closed(ws)
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    await this.closed(ws)
  }

  override async alarm(): Promise<void> {
    if (!this.record) return
    const now = Date.now()
    if (isExpired(this.record, now)) {
      for (const ws of this.ctx.getWebSockets()) ws.close(1000, 'room expired')
      await this.ctx.storage.deleteAll()
      this.record = null
      return
    }
    await this.commit(tick(def, this.record, now, this.timings))
  }

  // ---------- mensagens ----------

  private async handle(ws: WebSocket, message: ClientMessage): Promise<void> {
    const record = this.record as Record_
    const seat = this.seatOf(ws)
    const now = Date.now()
    if (message.type === 'hello') return this.hello(ws, seat, message)
    if (seat === null) return this.send(ws, { type: 'error', code: 'notJoined' })

    switch (message.type) {
      case 'resync':
        return this.send(ws, { type: 'room', room: this.view() })
      case 'profile':
        return this.commit(setProfile(def, record, seat, message.profile, now), ws)
      case 'config':
        return this.commit(setConfig(def, record, seat, message.config, now), ws)
      case 'add-bot':
        return this.commit(addBot(def, record, seat, now, random), ws)
      case 'remove-seat':
        return this.commit(removeSeat(record, seat, message.seat, now), ws)
      case 'start': {
        const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1
        return this.commit(startGame(def, record, seat, seed, now, this.timings), ws)
      }
      case 'action':
        return this.commit(act(def, record, seat, message.action, now, this.timings), ws)
      case 'ping':
        return this.commit(addPing(def, record, seat, message.target, message.kind, now), ws)
      case 'unping':
        return this.commit(removePing(record, seat, message.index, now), ws)
      case 'again':
        return this.commit(playAgain(record, seat, now), ws)
      case 'leave': {
        ws.serializeAttachment({ seat: null } satisfies Attachment)
        await this.commit(leave(def, record, seat, now, this.timings), ws)
        ws.close(1000, 'left')
        return
      }
    }
  }

  private async hello(
    ws: WebSocket,
    current: SeatId | null,
    message: Extract<ClientMessage, { type: 'hello' }>,
  ): Promise<void> {
    if (current !== null) return this.send(ws, { type: 'room', room: this.view() })
    const record = this.record as Record_
    const now = Date.now()
    if (message.token) {
      const out = reconnect<GameState, RoomConfig, RoleId, GameEvent>(
        record,
        await hashToken(message.token),
        now,
      )
      if (out.error || !out.seat)
        return this.send(ws, { type: 'error', code: out.error ?? 'unknownToken' })
      ws.serializeAttachment({ seat: out.seat } satisfies Attachment)
      this.send(ws, { type: 'welcome', seat: out.seat, token: message.token })
      return this.commit(out)
    }
    const token = newToken()
    const out = joinRoom(def, record, message.name ?? '', await hashToken(token), now, random)
    if (out.error || !out.seat)
      return this.send(ws, { type: 'error', code: out.error ?? 'refused' })
    ws.serializeAttachment({ seat: out.seat } satisfies Attachment)
    this.send(ws, { type: 'welcome', seat: out.seat, token })
    return this.commit(out)
  }

  private async closed(ws: WebSocket): Promise<void> {
    const seat = this.seatOf(ws)
    if (!this.record || seat === null) return
    // outro aparelho (ou aba) do mesmo assento ainda conectado: continua conectado
    const others = this.ctx.getWebSockets().filter((o) => o !== ws && this.seatOf(o) === seat)
    if (others.length > 0) return
    await this.commit(disconnect(def, this.record, seat, Date.now(), this.timings))
  }

  // ---------- auxiliares ----------

  /** Aplica o resultado: recusa para quem pediu, ou grava e avisa todos. */
  private async commit(out: Out, ws?: WebSocket): Promise<void> {
    if (out.error) {
      if (ws) {
        const [code, detail] = out.error.split(':')
        this.send(ws, { type: 'error', code: code ?? 'refused', ...(detail ? { detail } : {}) })
      }
      return
    }
    const changed = out.record !== this.record
    this.record = out.record
    if (changed) await this.persist()
    const room = this.view()
    if (out.events.length > 0)
      this.broadcast({ type: 'update', room, events: out.events, by: out.by })
    else if (changed) this.broadcast({ type: 'room', room })
    for (const notice of out.notices) this.broadcast({ type: 'notice', notice, room })
  }

  private view(): VillageRoomView {
    return viewOf(this.record as Record_)
  }

  private seatOf(ws: WebSocket): SeatId | null {
    const attachment = ws.deserializeAttachment() as Attachment | null
    return attachment?.seat ?? null
  }

  private socketId(ws: WebSocket): string {
    let id = this.socketIds.get(ws)
    if (!id) {
      id = crypto.randomUUID()
      this.socketIds.set(ws, id)
    }
    return id
  }

  private send(ws: WebSocket, message: VillageServerMessage): void {
    try {
      ws.send(JSON.stringify(message))
    } catch {
      // aparelho já desconectado: a próxima conexão recebe o estado completo
    }
  }

  private broadcast(message: VillageServerMessage): void {
    const text = JSON.stringify(message)
    for (const ws of this.ctx.getWebSockets()) {
      if (this.seatOf(ws) === null) continue
      try {
        ws.send(text)
      } catch {
        // idem
      }
    }
  }

  /** Grava a sala e agenda o próximo alarme: jogada de bot, bot assumindo ou expiração. */
  private async persist(): Promise<void> {
    const record = this.record as Record_
    await this.ctx.storage.put('room', record)
    await this.ctx.storage.setAlarm(nextWake(record))
  }
}

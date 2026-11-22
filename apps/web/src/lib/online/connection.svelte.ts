// Conexão de um aparelho com a sala: WebSocket, entrada (hello), reconexão automática e o
// estado da sala como o servidor mandou. Não calcula regra: só guarda e repassa.
import type { GameEvent } from '@village-flood/engine'
import type { ClientMessage, Notice, SeatId } from '@village-flood/kit'
import type { VillageRoomView, VillageServerMessage } from '@village-flood/protocol'
import { forgetRoom, saveRoom } from './link.ts'

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

export interface ConnectionHandlers {
  onUpdate?(events: readonly GameEvent[], room: VillageRoomView, by: SeatId | null): void
  onNotice?(notice: Notice, room: VillageRoomView): void
  onError?(code: string, detail?: string): void
}

/** Recusas na entrada que não adianta repetir: a conexão para e a tela mostra o motivo. */
const FATAL_ON_HELLO = new Set([
  'unknownToken',
  'nameTaken',
  'invalidName',
  'roomFull',
  'gameStarted',
  'notFound',
])

export function socketUrl(code: string, base: Location | URL = location): string {
  const protocol = base.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${base.host}/api/rooms/${code}/ws`
}

export class RoomConnection {
  room = $state.raw<VillageRoomView | null>(null)
  seat = $state<SeatId | null>(null)
  status = $state<ConnectionStatus>('connecting')
  /** Motivo de a conexão ter parado de vez (ex.: roomGone, nameTaken). */
  fatal = $state<string | null>(null)

  readonly code: string
  private token: string | null
  private readonly name: string | null
  private readonly handlers: ConnectionHandlers
  private ws: WebSocket | null = null
  private retries = 0
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private stopped = false

  constructor(
    code: string,
    who: { token: string } | { name: string },
    handlers: ConnectionHandlers = {},
  ) {
    this.code = code
    this.token = 'token' in who ? who.token : null
    this.name = 'name' in who ? who.name : null
    this.handlers = handlers
    this.open()
  }

  send(message: ClientMessage): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN || this.seat === null) return false
    this.ws.send(JSON.stringify(message))
    return true
  }

  /** Sai da sala de vez (avisa o servidor e esquece a sala neste aparelho). */
  leave() {
    this.send({ type: 'leave' })
    forgetRoom()
    this.close()
  }

  /** Fecha a conexão sem sair da sala (ex.: trocar de tela); dá para voltar pelo token. */
  close() {
    this.stopped = true
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = null
    this.ws?.close(1000, 'bye')
    this.ws = null
    this.status = 'closed'
  }

  private open() {
    if (this.stopped) return
    const ws = new WebSocket(socketUrl(this.code))
    this.ws = ws
    ws.addEventListener('open', () => {
      if (this.token) ws.send(JSON.stringify({ type: 'hello', token: this.token }))
      else ws.send(JSON.stringify({ type: 'hello', name: this.name ?? '' }))
    })
    ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return
      let message: VillageServerMessage
      try {
        message = JSON.parse(event.data) as VillageServerMessage
      } catch {
        return
      }
      this.receive(message)
    })
    ws.addEventListener('close', () => {
      if (this.ws !== ws) return
      this.ws = null
      if (this.stopped) return
      this.status = 'reconnecting'
      this.scheduleRetry()
    })
  }

  private receive(message: VillageServerMessage) {
    switch (message.type) {
      case 'welcome':
        this.seat = message.seat
        this.token = message.token
        this.retries = 0
        this.status = 'open'
        saveRoom({ code: this.code, token: message.token })
        return
      case 'room':
        this.room = message.room
        return
      case 'update':
        this.room = message.room
        this.handlers.onUpdate?.(message.events, message.room, message.by)
        return
      case 'notice':
        this.room = message.room
        this.handlers.onNotice?.(message.notice, message.room)
        return
      case 'error':
        if (this.seat === null || this.status !== 'open') {
          if (FATAL_ON_HELLO.has(message.code)) return this.stop(message.code)
        }
        this.handlers.onError?.(message.code, message.detail)
        return
    }
  }

  private stop(reason: string) {
    if (reason === 'unknownToken' || reason === 'roomGone') forgetRoom()
    this.fatal = reason
    this.close()
  }

  /** Nova tentativa com espera crescente (1 s, 2 s, 4 s... até 10 s). */
  private scheduleRetry() {
    const wait = Math.min(10_000, 1000 * 2 ** this.retries)
    this.retries++
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      void this.retry()
    }, wait)
  }

  private async retry() {
    if (this.stopped) return
    // a sala ainda existe? (expirou depois de 12 h sem atividade)
    try {
      const response = await fetch(`/api/rooms/${this.code}`)
      if (response.status === 404) return this.stop('roomGone')
    } catch {
      // sem rede: tenta de novo mais tarde
    }
    this.open()
  }
}

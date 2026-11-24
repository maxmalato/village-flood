// O que a tela da partida precisa de uma partida, local ou online. A partida local
// (LocalGame) e a online (OnlineGame) implementam esta mesma interface.
import type { Plan } from '@village-flood/bots'
import type { Action, GameState, SeatId } from '@village-flood/engine'
import type { PingKind } from '@village-flood/protocol'
import type { AwaySummary } from './online/away.ts'
import type { SeatInfo } from './view.ts'

export interface SeatStats {
  rescues: number
  heals: number
  radioCalls: number
  /** Vezes que o voluntário foi apanhado pela água. */
  swept?: number
}

/** Modo da partida: neste aparelho, online ou online com a mesa (TV) na sala. */
export type GameMode = 'local' | 'online' | 'table'

export interface Hint {
  readonly actions: Plan['actions']
}

export interface PingView {
  readonly index: number
  readonly seat: SeatId
  readonly target: string
  readonly kind: PingKind
}

/** Recursos só do modo online: sugestões (pings) fora da vez. */
export interface OnlineControls {
  readonly mySeat: SeatId | null
  readonly pings: readonly PingView[]
  /** Este aparelho pode sugerir agora (fora da própria vez, conectado). */
  readonly canPing: boolean
  /** Aviso de conexão de alguém da equipe, já no idioma da tela. */
  readonly notice: string | null
  /** Última recusa do servidor (código; texto em "error.*"). */
  readonly error: string | null
  /** A conexão caiu e está tentando de novo. */
  readonly reconnecting: boolean
  /** Quem está sem conexão e, se a vez é dele, quando o bot assume (ms, relógio local). */
  readonly awaySeats: readonly { seat: SeatId; name: string; deadline: number | null }[]
  /** "Enquanto você estava fora": o que mudou desde a última vez que este aparelho viu. */
  readonly awaySummary: AwaySummary | null
  dismissAway(): void
  /** Modo mesa (sala com TV conectada): abrir e fechar a legenda completa na TV. */
  readonly table: { readonly legendOpen: boolean; setLegend(open: boolean): void } | null
  ping(target: string, kind: PingKind): void
  unping(index: number): void
}

export interface GameController {
  readonly state: GameState
  readonly seats: readonly SeatInfo[]
  readonly selected: string | null
  readonly hint: Hint | null
  readonly messages: readonly string[]
  readonly alert: string | null
  readonly rejected: string | null
  readonly stats: Readonly<Record<SeatId, SeatStats>>
  /** Assento que tem a vez. */
  readonly active: SeatInfo | undefined
  /** Este aparelho pode agir agora. */
  readonly isHumanTurn: boolean
  /** Quem tem a vez é controlado por bot (bot do lobby ou bot no lugar de quem caiu). */
  readonly activeIsBot: boolean
  readonly hintAvailable: boolean
  readonly online?: OnlineControls
  readonly mode: GameMode
  /** Quando este aparelho viu a partida começar (ms); null se entrou no meio. */
  readonly startedAt: number | null
  select(tileId: string | null): void
  act(action: Action): void
  showHint(): void
  applyHint(): void
}

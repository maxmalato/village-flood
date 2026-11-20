// Tipos do estado, das ações e dos eventos do motor.
// Proposta aprovada em docs/engine-data-proposal.md (seção 6).
import type {
  Difficulty,
  DifficultySettings,
  Height,
  RainCardKind,
  RoleId,
  Rules,
  TileId,
} from './schema.ts'

/** Identificador opaco de um assento (o kit decide o formato, ex.: "s1"). */
export type SeatId = string

/** Id de morador: casa de origem e número (ex.: "A4-1"). */
export type ResidentId = string

export type WaterState = 'dry' | 'flooded' | 'submerged'
export type TileKind = 'plain' | 'house' | 'church' | 'dock'
export type ResidentStatus = 'healthy' | 'injured' | 'stranded' | 'safe'
export type HouseMark = 'cleared' | 'lost'
export type Phase = 'playing' | 'won' | 'lost'
export type LossReason = 'stranded' | 'level' | 'swept'

export interface Tile {
  readonly id: TileId
  readonly x: number
  readonly y: number
  readonly height: Height
  readonly kind: TileKind
  readonly sandbags: number
  readonly water: WaterState
}

/**
 * Morador. Cada morador está em exatamente uma situação:
 * - esperando: `tileId` na casa, sem `carriedBy`, `healthy` ou `injured`;
 * - carregado: sem `tileId`, com `carriedBy`, `healthy` ou `injured`;
 * - salvo: `tileId` na igreja, `safe`;
 * - ilhado: sem `tileId` e sem `carriedBy`, `stranded`.
 */
export interface Resident {
  readonly id: ResidentId
  readonly homeTileId: TileId
  readonly tileId: TileId | null
  readonly carriedBy: SeatId | null
  readonly status: ResidentStatus
}

export interface Volunteer {
  readonly seat: SeatId
  readonly role: RoleId
  readonly tileId: TileId
  readonly carrying: readonly ResidentId[]
  readonly actionsLeft: number
  readonly skipNextTurn: boolean
}

/** Números desta partida, copiados dos dados na criação (a partida não muda se os dados mudarem). */
export interface GameConfig {
  readonly difficulty: Difficulty
  readonly mapId: string
  readonly rules: Rules
  readonly settings: DifficultySettings
}

export interface GameState {
  readonly config: GameConfig
  /** Estado do gerador pseudoaleatório (mulberry32). */
  readonly rng: number
  readonly tiles: readonly Tile[]
  readonly residents: readonly Resident[]
  /** A ordem do array é a ordem dos assentos. */
  readonly volunteers: readonly Volunteer[]
  readonly riverLevel: number
  /** Topo do baralho = índice 0. */
  readonly rainDeck: readonly RainCardKind[]
  readonly rainDiscard: readonly RainCardKind[]
  /** Resposta do Alerta de temporal neste turno (null = não usado). */
  readonly stormWarning: boolean | null
  readonly turn: number
  readonly activeSeat: SeatId
  readonly turnHistory: readonly Snapshot[]
  readonly phase: Phase
  readonly lossReason?: LossReason
}

/** Estado antes de uma ação do turno, para o desfazer. */
export type Snapshot = Omit<GameState, 'turnHistory'>

/** Contexto de uma ação: só quem age. Sem relógio, sem aleatoriedade, sem nada externo. */
export interface Ctx {
  readonly seat: SeatId
}

export type Action =
  | { readonly type: 'move'; readonly to: TileId }
  | { readonly type: 'pick-up'; readonly residentId: ResidentId }
  | { readonly type: 'heal'; readonly residentId: ResidentId }
  | { readonly type: 'reinforce'; readonly tileId: TileId }
  | { readonly type: 'forecast' }
  | { readonly type: 'undo' }
  | { readonly type: 'end-turn' }

export type ActionType = Action['type']

export type GameEvent =
  | { type: 'moved'; seat: SeatId; from: TileId; to: TileId; cost: number }
  | { type: 'picked-up'; seat: SeatId; residentId: ResidentId; tileId: TileId; cost: number }
  | { type: 'delivered'; seat: SeatId; residentIds: ResidentId[] }
  | { type: 'healed'; seat: SeatId; residentId: ResidentId }
  | { type: 'sandbag-placed'; seat: SeatId; tileId: TileId; sandbags: number }
  | { type: 'forecast-revealed'; seat: SeatId; stormComing: boolean; cards: number }
  | { type: 'action-undone'; seat: SeatId }
  | { type: 'turn-ended'; seat: SeatId; turn: number }
  | { type: 'rain-drawn'; card: RainCardKind; rise: number }
  | { type: 'level-rose'; from: number; to: number }
  | { type: 'tile-flooded'; tileId: TileId }
  | { type: 'tile-submerged'; tileId: TileId }
  | { type: 'tile-dried'; tileId: TileId; water: WaterState }
  | { type: 'resident-injured'; residentId: ResidentId; tileId: TileId }
  | {
      type: 'resident-stranded'
      residentId: ResidentId
      tileId: TileId | null
      cause: 'water' | 'swept'
    }
  | {
      type: 'volunteer-swept'
      seat: SeatId
      from: TileId
      to: TileId
      strandedResidentIds: ResidentId[]
    }
  | { type: 'turn-skipped'; seat: SeatId; turn: number }
  | { type: 'turn-started'; seat: SeatId; turn: number }
  | { type: 'won' }
  | { type: 'lost'; reason: LossReason }

export type GameEventType = GameEvent['type']

/** Motivos de recusa de uma ação. A interface traduz os códigos. */
export const rejectReasons = [
  'not-your-turn',
  'game-over',
  'not-enough-actions',
  'unknown-tile',
  'not-adjacent',
  'tile-submerged',
  'carry-full',
  'resident-not-here',
  'resident-not-injured',
  'role-required',
  'sandbag-limit',
  'tile-not-reinforceable',
  'forecast-unavailable',
  'nothing-to-undo',
] as const
export type RejectReason = (typeof rejectReasons)[number]

/** Resultado de `transition`. Ação recusada devolve o mesmo estado, sem eventos. */
export type Result<S, E> =
  | { readonly ok: true; readonly state: S; readonly events: readonly E[] }
  | {
      readonly ok: false
      readonly state: S
      readonly events: readonly []
      readonly reason: RejectReason
    }

export type TransitionResult = Result<GameState, GameEvent>

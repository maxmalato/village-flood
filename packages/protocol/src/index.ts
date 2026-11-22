// Protocolo do Enchente na Vila entre o aparelho e a sala (Etapa 4).
// O envelope das mensagens é o do kit; aqui ficam os conteúdos deste jogo, validados com Zod.
// O servidor nunca confia no aparelho: toda ação passa por parseAction e depois pelo motor.
import {
  DifficultySchema,
  GAME_ID,
  RoleIdSchema,
  TileIdSchema,
  type Action,
  type Difficulty,
  type GameEvent,
  type GameState,
  type RoleId,
} from '@village-flood/engine'
import type { RoomView, ServerMessage } from '@village-flood/kit'
import { z } from 'zod'

/** Versão do protocolo. Muda quando o formato das mensagens muda. */
export const PROTOCOL_VERSION = 1

/** Identificador do protocolo, ligado ao jogo. */
export const PROTOCOL_ID = `${GAME_ID}/v${PROTOCOL_VERSION}`

/** Configuração da partida escolhida no lobby. */
export interface RoomConfig {
  readonly difficulty: Difficulty
}

export const defaultRoomConfig: RoomConfig = { difficulty: 'normal' }

/** Tipos de sugestão (ping) fora da vez (regras, seção 10). */
export const pingKinds = ['go', 'careful', 'pick-up'] as const
export type PingKind = (typeof pingKinds)[number]

const ResidentIdSchema = z.string().min(1).max(16)

export const ActionSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('move'), to: TileIdSchema }),
  z.strictObject({ type: z.literal('pick-up'), residentId: ResidentIdSchema }),
  z.strictObject({ type: z.literal('heal'), residentId: ResidentIdSchema }),
  z.strictObject({ type: z.literal('reinforce'), tileId: TileIdSchema }),
  z.strictObject({ type: z.literal('forecast') }),
  z.strictObject({ type: z.literal('radio-call') }),
  z.strictObject({ type: z.literal('undo') }),
  z.strictObject({ type: z.literal('end-turn') }),
])

const RoomConfigSchema = z.strictObject({ difficulty: DifficultySchema })

/** Ação vinda do aparelho; null se o formato for inválido (o motor ainda valida a regra). */
export function parseAction(raw: unknown): Action | null {
  const result = ActionSchema.safeParse(raw)
  return result.success ? result.data : null
}

export function parseRoomConfig(raw: unknown): RoomConfig | null {
  const result = RoomConfigSchema.safeParse(raw)
  return result.success ? result.data : null
}

export function parseRole(raw: unknown): RoleId | null {
  const result = RoleIdSchema.safeParse(raw)
  return result.success ? result.data : null
}

/** Alvo do ping: uma quadra que existe no mapa da partida. */
export function parsePingTarget(state: GameState, raw: unknown): string | null {
  const result = TileIdSchema.safeParse(raw)
  if (!result.success) return null
  return state.tiles.some((t) => t.id === result.data) ? result.data : null
}

/** O que os aparelhos veem: a sala com o estado do jogo (tudo é público neste jogo). */
export type VillageRoomView = RoomView<GameState, RoomConfig, RoleId>
export type VillageServerMessage = ServerMessage<VillageRoomView, GameEvent>

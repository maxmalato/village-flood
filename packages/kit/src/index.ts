// Kit de salas, agnóstico de jogo: conhece o jogo só pela interface `GameDefinition`.
// Regra de arquitetura: este pacote não importa o motor, os bots nem a simulação.
// Estrutura extraída e generalizada do senhorio-web (salas, códigos, tokens, limites).
export * from './constants.ts'
export type { GameDefinition, SeatId, SeatProfileEntry, TransitionOutcome } from './definition.ts'
export {
  parseClientMessage,
  RateLimiter,
  TABLE_MESSAGES,
  type ClientMessage,
  type Notice,
  type ServerMessage,
} from './messages.ts'
export * from './room.ts'

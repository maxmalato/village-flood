// Kit de salas, agnóstico de jogo: conhece o jogo só pela interface `GameDefinition`.
// Regra de arquitetura: este pacote não importa o motor, os bots nem a simulação.
// O conteúdo será extraído do senhorio-web na Etapa 4.

/** Identificador de um assento na sala. */
export type SeatId = string

/** Tamanho do código de sala (spec, seção 7). */
export const ROOM_CODE_LENGTH = 6

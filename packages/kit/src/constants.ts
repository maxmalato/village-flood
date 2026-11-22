// Constantes das salas (spec, seção 7), as mesmas do Senhorio.

/** 32 símbolos sem 0/O e 1/I, para ninguém confundir ao ditar o código. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
/** Tamanho do código de sala: cerca de 1 bilhão de combinações. */
export const ROOM_CODE_LENGTH = 6
/** Sala apagada depois de tanto tempo sem atividade. */
export const ROOM_TTL_MS = 12 * 60 * 60 * 1000
/** Mensagens por aparelho numa janela de tempo; acima disso, a mensagem é descartada. */
export const MESSAGE_LIMIT = { count: 40, windowMs: 10_000 }
/** Mensagem maior que isso é descartada. */
export const MAX_MESSAGE_BYTES = 8192
/** Pings por jogador em cada turno (regras, seção 10). */
export const MAX_PINGS_PER_TURN = 3
/** Tamanho máximo do apelido. */
export const MAX_NAME_LENGTH = 20
/**
 * Assento da mesa (modo mesa): a TV ou o notebook que abriu a sala e mostra a partida sem jogar.
 * Nas mensagens, `seat: TABLE_SEAT` é a mesa.
 */
export const TABLE_SEAT = 'table'

/** Tempos de bot e desconexão (configuráveis no servidor; os testes usam valores curtos). */
export interface RoomTimings {
  /** Espera na vez de quem caiu antes de o bot assumir (regras, seção 10: cerca de 20 s). */
  readonly takeoverMs: number
  /** Intervalo entre as jogadas de um bot, para a mesa e os celulares acompanharem. */
  readonly botStepMs: number
}

export const defaultTimings: RoomTimings = { takeoverMs: 20_000, botStepMs: 900 }

/** Código em maiúsculas, sem espaços, traços ou pontos; null se não for um código válido. */
export function normalizeCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s.·-]/g, '')
  if (code.length !== ROOM_CODE_LENGTH) return null
  for (const ch of code) if (!ROOM_CODE_ALPHABET.includes(ch)) return null
  return code
}

/** "K7P4QX" → "K7P·4QX", para ler em voz alta. */
export function formatCode(code: string): string {
  return `${code.slice(0, 3)}·${code.slice(3)}`
}

/** Código novo a partir de bytes aleatórios (32 divide 256: sem viés). */
export function codeFromBytes(bytes: ArrayLike<number>): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[(bytes[i] ?? 0) % ROOM_CODE_ALPHABET.length]
  }
  return code
}

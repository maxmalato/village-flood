// O kit conhece o jogo só por esta interface (spec, seção 3). Nada aqui sabe de enchente.

/** Identificador opaco de um assento (ex.: "seat-1"). */
export type SeatId = string

export type TransitionOutcome<S, E> =
  | { readonly ok: true; readonly state: S; readonly events: readonly E[] }
  | { readonly ok: false; readonly reason: string }

export interface SeatProfileEntry<P> {
  readonly seat: SeatId
  readonly profile: P
}

/**
 * Definição de um jogo para o kit. S = estado, A = ação, E = evento, C = configuração da
 * partida (ex.: dificuldade), P = perfil do assento (ex.: papel).
 */
export interface GameDefinition<S, A, E, C, P> {
  readonly id: string
  readonly minSeats: number
  readonly maxSeats: number
  readonly defaultConfig: C
  /** Tipos de ping aceitos (ex.: "ir para cá", "cuidado"). */
  readonly pingKinds: readonly string[]

  /** Validam o que chega do aparelho. Null: recusado. */
  parseConfig(raw: unknown): C | null
  parseProfile(raw: unknown): P | null
  parseAction(raw: unknown): A | null
  parsePingTarget(state: S, raw: unknown): string | null

  /** Perfil livre para um assento novo, dado os já usados (null: não há). */
  freeProfile(taken: readonly P[], random: () => number): P | null
  /** Dois perfis iguais? (ex.: mesmo papel). */
  sameProfile(a: P, b: P): boolean
  /** Problema na combinação de assentos; null se a partida pode começar. */
  validateSeats(config: C, seats: readonly SeatProfileEntry<P>[]): string | null

  newGame(config: C, seats: readonly SeatProfileEntry<P>[], seed: number): S
  transition(state: S, action: A, seat: SeatId): TransitionOutcome<S, E>
  /** Assento dono do turno; null quando a partida acabou. */
  activeSeat(state: S): SeatId | null
  /** Quem pode agir agora (kit: o servidor recusa qualquer outro). */
  actorsOf(state: S): SeatId[]
  /** Muda a cada turno (limpa os pings e devolve o controle a quem voltou). */
  turnKey(state: S): string
  isOver(state: S): boolean
  /** Jogada do bot: função pura, só com informação pública. */
  botMove(state: S, seat: SeatId): A
}

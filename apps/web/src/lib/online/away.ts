// "Enquanto você estava fora": um retrato curto da partida, guardado neste aparelho, para
// mostrar o que mudou quando a pessoa volta. Só números do jogo; nada pessoal.
import { countResidents, type GameState } from '@village-flood/engine'

const STORAGE_KEY = 'village-flood:last-seen'

export interface Snapshot {
  readonly code: string
  readonly turn: number
  readonly riverLevel: number
  readonly safe: number
  readonly stranded: number
}

export interface AwaySummary {
  readonly fromTurn: number
  readonly toTurn: number
  readonly levelFrom: number
  readonly levelTo: number
  readonly saved: number
  readonly stranded: number
}

export function snapshotOf(code: string, state: GameState): Snapshot {
  const counts = countResidents(state)
  return {
    code,
    turn: state.turn,
    riverLevel: state.riverLevel,
    safe: counts.safe,
    stranded: counts.stranded,
  }
}

/**
 * O que mudou desde o retrato. null se é outra sala, se nenhum turno passou ou se a partida é
 * nova (o turno voltou para trás, como em "jogar de novo").
 */
export function awaySummary(
  before: Snapshot | null,
  code: string,
  now: GameState,
): AwaySummary | null {
  if (!before || before.code !== code || now.turn <= before.turn) return null
  const after = snapshotOf(code, now)
  if (after.safe < before.safe || after.stranded < before.stranded) return null
  return {
    fromTurn: before.turn,
    toTurn: after.turn,
    levelFrom: before.riverLevel,
    levelTo: after.riverLevel,
    saved: after.safe - before.safe,
    stranded: after.stranded - before.stranded,
  }
}

export function loadSnapshot(): Snapshot | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Snapshot | null
    if (
      value &&
      typeof value.code === 'string' &&
      [value.turn, value.riverLevel, value.safe, value.stranded].every(Number.isInteger)
    ) {
      return value
    }
  } catch {
    // sem armazenamento ou valor corrompido
  }
  return null
}

export function saveSnapshot(snapshot: Snapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // navegação privada: segue sem lembrar
  }
}

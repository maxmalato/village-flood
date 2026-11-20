// Agregação das métricas e intervalo de confiança.
import type { GameMetrics } from './play.ts'

export interface Summary {
  readonly games: number
  readonly wins: number
  readonly winRate: number
  /** Intervalo de 95% (Wilson) da taxa de vitória. */
  readonly winLow: number
  readonly winHigh: number
  readonly avgTurns: number
  readonly lossStranded: number
  readonly lossLevel: number
  readonly lossSwept: number
  readonly lossTimeout: number
  readonly avgStranded: number
  readonly avgSwept: number
  readonly avgSkipped: number
  readonly avgDoubleDeliveries: number
  /** Nas vitórias: níveis que ainda faltavam até a derrota por nível. */
  readonly avgLevelMarginOnWin: number | null
}

export function wilson(successes: number, total: number, z = 1.96): [number, number] {
  if (total === 0) return [0, 0]
  const p = successes / total
  const denominator = 1 + (z * z) / total
  const center = (p + (z * z) / (2 * total)) / denominator
  const half = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denominator
  return [Math.max(0, center - half), Math.min(1, center + half)]
}

const mean = (values: readonly number[]) =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length

export function summarize(games: readonly GameMetrics[], maxRiverLevel: number): Summary {
  const wins = games.filter((g) => g.won)
  const [winLow, winHigh] = wilson(wins.length, games.length)
  const share = (reason: string) =>
    games.length === 0 ? 0 : games.filter((g) => g.lossReason === reason).length / games.length
  return {
    games: games.length,
    wins: wins.length,
    winRate: games.length === 0 ? 0 : wins.length / games.length,
    winLow,
    winHigh,
    avgTurns: mean(games.map((g) => g.turns)),
    lossStranded: share('stranded'),
    lossLevel: share('level'),
    lossSwept: share('swept'),
    lossTimeout: share('timeout'),
    avgStranded: mean(games.map((g) => g.stranded)),
    avgSwept: mean(games.map((g) => g.swept)),
    avgSkipped: mean(games.map((g) => g.skippedTurns)),
    avgDoubleDeliveries: mean(games.map((g) => g.doubleDeliveries)),
    avgLevelMarginOnWin:
      wins.length === 0 ? null : mean(wins.map((g) => maxRiverLevel - g.finalLevel)),
  }
}

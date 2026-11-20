// O que os bots sabem da chuva: só informação pública.
// - As cartas reveladas pela previsão (forecastView) e a resposta do Alerta de temporal.
// - A composição do baralho restante (dá para deduzir pelo descarte, que é público).
// A ordem das cartas escondidas nunca é usada.
import { forecastView, type GameState, type RainCardKind } from '@village-flood/engine'

export interface RainOutlook {
  /** Subida das próximas cartas já conhecidas, em ordem. */
  readonly known: readonly number[]
  /** Subida média de uma carta desconhecida. */
  readonly mean: number
}

export function rainOutlook(state: GameState): RainOutlook {
  const rises = state.config.rules.rainCards
  const known: number[] = []
  const pool: RainCardKind[] = [...state.rainDeck] // usado só como multiconjunto (contagem)

  const removeOne = (kind: RainCardKind) => {
    const i = pool.indexOf(kind)
    if (i >= 0) pool.splice(i, 1)
  }

  const view = forecastView(state)
  if (view?.kind === 'peek') {
    for (const card of view.cards) {
      known.push(rises[card])
      removeOne(card)
    }
  }

  let unknown = pool
  if (unknown.length === 0) {
    // O baralho vai ser reembaralhado: vale a composição completa da dificuldade.
    const deck = state.config.settings.deck
    unknown = (['cloudy', 'drizzle', 'rain', 'storm'] as const).flatMap((kind) =>
      Array<RainCardKind>(deck[kind]).fill(kind),
    )
  }
  const meanOf = (cards: readonly RainCardKind[]) =>
    cards.length === 0 ? 0 : cards.reduce((sum, c) => sum + rises[c], 0) / cards.length

  // Alerta de temporal (olha 1 carta): sabe se a próxima é Temporal ou não.
  if (view?.kind === 'storm-warning' && view.result !== null && known.length === 0) {
    if (view.result) {
      known.push(rises.storm)
    } else {
      const calm = unknown.filter((c) => c !== 'storm')
      known.push(meanOf(calm))
    }
  }

  return { known, mean: meanOf(unknown) }
}

/** Subida esperada nas próximas `rains` chuvas (infinito se `rains` for infinito). */
export function projectedRise(outlook: RainOutlook, rains: number): number {
  if (!Number.isFinite(rains)) return Infinity
  const count = Math.max(0, Math.floor(rains))
  let total = 0
  for (let i = 0; i < Math.min(count, outlook.known.length); i++) total += outlook.known[i] ?? 0
  return total + Math.max(0, count - outlook.known.length) * outlook.mean
}

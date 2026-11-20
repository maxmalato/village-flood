// Custo de caminho (em ações) para um voluntário, pelas regras reais de movimento do motor.
import { adjacentTileIds, findTile, moveCost } from '@village-flood/engine'
import type { GameState, TileId, Volunteer } from '@village-flood/engine'

/** Custo mínimo de ir da quadra `from` a cada quadra (Dijkstra). Quadras inalcançáveis ficam fora. */
export function pathCosts(
  state: GameState,
  volunteer: Volunteer,
  from: TileId,
): Map<TileId, number> {
  const diagonals = volunteer.role === 'neighbor'
  const costs = new Map<TileId, number>([[from, 0]])
  const done = new Set<TileId>()
  // O mapa tem 36 quadras: a busca linear pelo menor custo é mais simples e rápida que um heap.
  for (;;) {
    let current: TileId | null = null
    let best = Infinity
    for (const [id, cost] of costs) {
      if (!done.has(id) && cost < best) {
        best = cost
        current = id
      }
    }
    if (current === null) return costs
    done.add(current)
    for (const next of adjacentTileIds(state, current, diagonals)) {
      if (done.has(next)) continue
      const tile = findTile(state, next)
      if (!tile) continue
      const step = moveCost(state, volunteer, tile)
      if (step === null) continue
      const total = best + step
      if (total < (costs.get(next) ?? Infinity)) costs.set(next, total)
    }
  }
}

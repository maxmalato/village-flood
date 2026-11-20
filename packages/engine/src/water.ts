// Cálculo da água atrás da interface WaterModel (spec, seções 5 e 12).
// O resto do motor não depende do modelo concreto: o modelo B (v2) entra como outra implementação.
import { indexTiles, orthogonalNeighbors } from './board.ts'
import type { WaterRules } from './schema.ts'
import type { Tile, WaterState } from './types.ts'

export interface WaterModel {
  readonly id: string
  /**
   * Recalcula o estado da água de todas as quadras para o nível dado.
   * Deve ser idempotente e não mutar a entrada. Quadras sem mudança mantêm a mesma referência.
   */
  recompute(tiles: readonly Tile[], level: number): readonly Tile[]
}

/** Quanto mais molhado, maior o número. Usado para saber se a quadra piorou ou melhorou. */
export const wetness: Record<WaterState, number> = { dry: 0, flooded: 1, submerged: 2 }

/** Limiares da quadra já com os sacos de areia. */
export function thresholdsFor(tile: Tile, water: WaterRules): { flood: number; submerge: number } {
  const base = water.thresholds[tile.height]
  const bonus = water.sandbagBonus * tile.sandbags
  return { flood: base.flood + bonus, submerge: base.submerge + bonus }
}

/**
 * Modelo A, nível do rio (regras, seção 5):
 * - a quadra alaga ou submerge pelo nível e pelos limiares da altura (com sacos de areia);
 * - só molha se estiver ligada ao rio (coluna A) por quadras molhadas, pelas 4 vizinhas ortogonais;
 * - igreja e cais nunca molham e não passam a água adiante.
 */
export function createRiverLevelModel(water: WaterRules): WaterModel {
  return {
    id: 'river-level',
    recompute(tiles, level) {
      const canGetWet = (tile: Tile) =>
        tile.kind !== 'church' && tile.kind !== 'dock' && level >= thresholdsFor(tile, water).flood

      // Busca em largura a partir das quadras encostadas no rio (coluna A, x = 0).
      const byCoord = indexTiles(tiles)
      const wet = new Set<string>()
      const queue: Tile[] = tiles.filter((tile) => tile.x === 0 && canGetWet(tile))
      for (const tile of queue) wet.add(tile.id)
      while (queue.length > 0) {
        const tile = queue.shift() as Tile
        for (const neighbor of orthogonalNeighbors(tile, byCoord)) {
          if (!wet.has(neighbor.id) && canGetWet(neighbor)) {
            wet.add(neighbor.id)
            queue.push(neighbor)
          }
        }
      }

      return tiles.map((tile) => {
        let next: WaterState = 'dry'
        if (wet.has(tile.id)) {
          next = level >= thresholdsFor(tile, water).submerge ? 'submerged' : 'flooded'
        }
        return next === tile.water ? tile : { ...tile, water: next }
      })
    },
  }
}

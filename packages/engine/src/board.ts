// Funções de vizinhança e busca no tabuleiro (puras).
import type { TileId } from './schema.ts'
import type { Tile } from './types.ts'

const orthogonal = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const
const diagonal = [
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
] as const

/** Índice das quadras por coordenada, para buscas rápidas. */
export function indexTiles(tiles: readonly Tile[]): Map<string, Tile> {
  const byCoord = new Map<string, Tile>()
  for (const tile of tiles) byCoord.set(`${tile.x},${tile.y}`, tile)
  return byCoord
}

/** Vizinhas ortogonais de uma quadra (o critério padrão do jogo). */
export function orthogonalNeighbors(tile: Tile, byCoord: Map<string, Tile>): Tile[] {
  const result: Tile[] = []
  for (const [dx, dy] of orthogonal) {
    const neighbor = byCoord.get(`${tile.x + dx},${tile.y + dy}`)
    if (neighbor) result.push(neighbor)
  }
  return result
}

/** As 4 direções ortogonais e, se pedido, as 4 diagonais. */
export function isNeighbor(a: Tile, b: Tile, includeDiagonals: boolean): boolean {
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  if (dx + dy === 1) return true
  return includeDiagonals && dx === 1 && dy === 1
}

/** Ids das quadras ao redor (ortogonais e, se pedido, diagonais), dentro do mapa. */
export function neighborIds(
  tile: Tile,
  byCoord: Map<string, Tile>,
  includeDiagonals: boolean,
): TileId[] {
  const directions = includeDiagonals ? [...orthogonal, ...diagonal] : orthogonal
  const result: TileId[] = []
  for (const [dx, dy] of directions) {
    const neighbor = byCoord.get(`${tile.x + dx},${tile.y + dy}`)
    if (neighbor) result.push(neighbor.id)
  }
  return result
}

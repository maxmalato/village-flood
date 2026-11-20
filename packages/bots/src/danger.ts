// Em que nível cada quadra alaga e submerge, com os sacos de areia atuais e a ligação com o rio.
import { waterModelFor, type GameState, type TileId } from '@village-flood/engine'

export interface TileDanger {
  /** Nível em que a quadra passa a alagada (ou já está). Infinity: não alaga até o limite. */
  readonly flood: number
  /** Nível em que a quadra passa a submersa (ou já está). Infinity: não submerge até o limite. */
  readonly submerge: number
}

/** Chave dos sacos de areia: o perigo só muda quando eles mudam. */
export function sandbagKey(state: GameState): string {
  let key = ''
  for (const tile of state.tiles) key += tile.sandbags
  return key
}

export function tileDangers(state: GameState): Map<TileId, TileDanger> {
  const model = waterModelFor(state.config)
  const limit = state.config.rules.maxRiverLevel + 6
  const flood = new Map<TileId, number>()
  const submerge = new Map<TileId, number>()
  for (let level = state.riverLevel; level <= limit; level++) {
    for (const tile of model.recompute(state.tiles, level)) {
      if (tile.water !== 'dry' && !flood.has(tile.id)) flood.set(tile.id, level)
      if (tile.water === 'submerged' && !submerge.has(tile.id)) submerge.set(tile.id, level)
    }
  }
  const result = new Map<TileId, TileDanger>()
  for (const tile of state.tiles) {
    result.set(tile.id, {
      flood: flood.get(tile.id) ?? Infinity,
      submerge: submerge.get(tile.id) ?? Infinity,
    })
  }
  return result
}

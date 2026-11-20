import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { defaultGameData } from './data.ts'
import { tileIdAt, type Height } from './schema.ts'
import { setup } from './testing.ts'
import type { Tile, TileKind } from './types.ts'
import { createRiverLevelModel } from './water.ts'

const model = createRiverLevelModel(defaultGameData.rules.water)

/** Faixa de quadras numa linha só (x = 0 encosta no rio). */
function strip(heights: Height[], kinds: Partial<Record<number, TileKind>> = {}): Tile[] {
  return heights.map((height, x) => ({
    id: tileIdAt(x, 0),
    x,
    y: 0,
    height,
    kind: kinds[x] ?? 'plain',
    sandbags: 0,
    water: 'dry' as const,
  }))
}

const states = (tiles: readonly Tile[]) => tiles.map((t) => t.water)

describe('limiares por altura (regras, seção 5)', () => {
  it.each([
    [1, 4, 'dry'],
    [1, 5, 'flooded'],
    [1, 11, 'flooded'],
    [1, 12, 'submerged'],
    [2, 11, 'dry'],
    [2, 12, 'flooded'],
    [2, 19, 'submerged'],
    [3, 18, 'dry'],
    [3, 19, 'flooded'],
    [3, 25, 'flooded'],
    [3, 26, 'submerged'],
  ] as const)('altura %i no nível %i fica %s', (height, level, expected) => {
    expect(states(model.recompute(strip([height]), level))).toEqual([expected])
  })

  it('cada saco de areia soma 3 aos dois limiares', () => {
    const one = strip([1]).map((t) => ({ ...t, sandbags: 1 }))
    expect(states(model.recompute(one, 7))).toEqual(['dry'])
    expect(states(model.recompute(one, 8))).toEqual(['flooded'])
    expect(states(model.recompute(one, 15))).toEqual(['submerged'])
    const two = strip([1]).map((t) => ({ ...t, sandbags: 2 }))
    expect(states(model.recompute(two, 10))).toEqual(['dry'])
    expect(states(model.recompute(two, 18))).toEqual(['submerged'])
  })
})

describe('ligação com o rio', () => {
  it('o morro protege a quadra baixa atrás dele', () => {
    expect(states(model.recompute(strip([1, 3, 1]), 12))).toEqual(['submerged', 'dry', 'dry'])
  })

  it('a água passa quando o morro também molha', () => {
    expect(states(model.recompute(strip([1, 3, 1]), 19))).toEqual([
      'submerged',
      'flooded',
      'submerged',
    ])
  })

  it('igreja e cais nunca molham e não passam a água adiante', () => {
    expect(states(model.recompute(strip([1, 1, 1], { 1: 'church' }), 20))).toEqual([
      'submerged',
      'dry',
      'dry',
    ])
    expect(states(model.recompute(strip([1, 1, 1], { 1: 'dock' }), 20))).toEqual([
      'submerged',
      'dry',
      'dry',
    ])
  })

  it('a água não passa na diagonal', () => {
    // A1 (altura 1) encosta no rio; B2 (altura 1) só toca A1 na diagonal.
    const tiles: Tile[] = [
      { id: 'A1', x: 0, y: 0, height: 1, kind: 'plain', sandbags: 0, water: 'dry' },
      { id: 'B1', x: 1, y: 0, height: 3, kind: 'plain', sandbags: 0, water: 'dry' },
      { id: 'A2', x: 0, y: 1, height: 3, kind: 'plain', sandbags: 0, water: 'dry' },
      { id: 'B2', x: 1, y: 1, height: 1, kind: 'plain', sandbags: 0, water: 'dry' },
    ]
    expect(states(model.recompute(tiles, 12))).toEqual(['submerged', 'dry', 'dry', 'dry'])
  })

  it('no nível 12 da Vila do Rio, altura 1 submerge e altura 2 alaga', () => {
    const tiles = model.recompute(setup().tiles, 12)
    for (const tile of tiles) {
      const expected =
        tile.kind === 'church' || tile.kind === 'dock'
          ? 'dry'
          : ({ 1: 'submerged', 2: 'flooded', 3: 'dry' } as const)[tile.height]
      expect(tile.water, tile.id).toBe(expected)
    }
  })
})

describe('recompute', () => {
  it('é idempotente e não muta a entrada (propriedade)', () => {
    const base = setup().tiles
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 }),
        fc.array(fc.integer({ min: 0, max: 2 }), {
          minLength: base.length,
          maxLength: base.length,
        }),
        (level, sandbags) => {
          const tiles = base.map((t, i) => ({ ...t, sandbags: sandbags[i] ?? 0 }))
          const copy: unknown = JSON.parse(JSON.stringify(tiles))
          const once = model.recompute(tiles, level)
          const twice = model.recompute(once, level)
          expect(twice).toEqual(once)
          expect(tiles).toEqual(copy)
        },
      ),
    )
  })

  it('mantém a referência das quadras que não mudam', () => {
    const tiles = setup().tiles
    const result = model.recompute(tiles, 0)
    result.forEach((t, i) => expect(t).toBe(tiles[i]))
  })
})

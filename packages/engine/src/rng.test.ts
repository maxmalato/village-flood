import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { nextRandom, seedToRng, shuffle } from './rng.ts'

describe('gerador', () => {
  it('mesma semente gera a mesma sequência', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const a = nextRandom(seedToRng(seed))
        const b = nextRandom(seedToRng(seed))
        expect(a).toEqual(b)
        expect(a.value).toBeGreaterThanOrEqual(0)
        expect(a.value).toBeLessThan(1)
      }),
    )
  })

  it('embaralhar é uma permutação determinística e não muta a entrada', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), fc.integer(), (items, seed) => {
        const copy = [...items]
        const a = shuffle(items, seedToRng(seed))
        expect(items).toEqual(copy)
        expect([...a.items].sort()).toEqual([...items].sort())
        expect(shuffle(items, seedToRng(seed))).toEqual(a)
      }),
    )
  })
})

import { describe, expect, it } from 'vitest'
import difficulties from '../data/difficulties.json' with { type: 'json' }
import map from '../data/maps/village-river.json' with { type: 'json' }
import rules from '../data/rules.json' with { type: 'json' }
import { defaultGameData } from './data.ts'
import { coordsOf, GameDataSchema, parseGameData, tileIdAt } from './schema.ts'

/** Cópia profunda dos dados do repositório, para cada teste alterar à vontade. */
function raw() {
  return JSON.parse(JSON.stringify({ rules, difficulties, map })) as {
    rules: Record<string, unknown> & typeof rules
    difficulties: typeof difficulties
    map: typeof map
  }
}

describe('dados do repositório', () => {
  it('passam no schema', () => {
    expect(GameDataSchema.safeParse({ rules, difficulties, map }).success).toBe(true)
    expect(defaultGameData.map.id).toBe('village-river')
  })

  it('têm moradores = meta + 3 em cada dificuldade (regras, seção 6)', () => {
    const base = map.houses.length * map.residentsPerHouse
    expect(base + difficulties.easy.extraResidents).toBe(11)
    expect(base + difficulties.normal.extraResidents).toBe(13)
    expect(base + difficulties.storm.extraResidents).toBe(15)
  })

  it('têm baralhos de 25 cartas', () => {
    for (const d of Object.values(difficulties)) {
      expect(d.deck.cloudy + d.deck.drizzle + d.deck.rain + d.deck.storm).toBe(25)
    }
  })
})

describe('schema recusa dados inválidos', () => {
  const fails = (data: unknown, message: RegExp) => {
    expect(() => parseGameData(data)).toThrow(message)
  }

  it('meta incoerente com o limite de ilhados', () => {
    const data = raw()
    data.difficulties.normal.goal = 11
    fails(data, /goal \+ strandedLossCount - 1/)
  })

  it('limiar de alagar maior ou igual ao de submergir', () => {
    const data = raw()
    data.rules.water.thresholds['2'].flood = 19
    fails(data, /menor que o de submergir/)
  })

  it('chave desconhecida', () => {
    const data = raw()
    ;(data.rules as Record<string, unknown>)['extra'] = 1
    fails(data, /extra/)
  })

  it('custo zero de andar', () => {
    const data = raw()
    data.rules.costs.move.dry = 0
    fails(data, /move/)
  })

  it('morador extra em quadra que não é casa', () => {
    const data = raw()
    data.map.extraResidentOrder[0] = 'C3'
    fails(data, /não é casa/)
  })

  it('igreja e cais na mesma quadra', () => {
    const data = raw()
    data.map.dock = data.map.church
    fails(data, /quadras diferentes/)
  })

  it('quadra fora do mapa', () => {
    const data = raw()
    data.map.church = 'G9'
    fails(data, /fora do mapa/)
  })

  it('alturas com tamanho errado', () => {
    const data = raw()
    data.map.heights.pop()
    fails(data, /heights/)
  })

  it('previsão peek com custo', () => {
    const data = raw()
    ;(data.difficulties.easy.forecast as { cost: number }).cost = 1
    fails(data, /forecast/)
  })
})

describe('ids de quadra', () => {
  it('convertem coordenadas nos dois sentidos', () => {
    expect(tileIdAt(0, 0)).toBe('A1')
    expect(tileIdAt(5, 5)).toBe('F6')
    expect(coordsOf('D3')).toEqual({ x: 3, y: 2 })
  })
})

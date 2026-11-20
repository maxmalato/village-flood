import { defaultGameData } from '@village-flood/engine'
import { describe, expect, it } from 'vitest'
import { compositions, rotate, seedFrom } from './compositions.ts'
import { cellKey, planJobs } from './plan.ts'
import { playGame, type GameMetrics } from './play.ts'
import { renderReport } from './report.ts'
import { summarize, wilson } from './stats.ts'
import { baseline, deepMerge, variantFrom } from './variants.ts'

describe('composições', () => {
  it('gera todas as combinações de papéis por tamanho de equipe', () => {
    expect(compositions(2)).toHaveLength(15)
    expect(compositions(3)).toHaveLength(20)
    expect(compositions(4)).toHaveLength(15)
    expect(new Set(compositions(3).map((c) => c.join())).size).toBe(20)
  })

  it('gira a ordem dos assentos', () => {
    expect(rotate(['a', 'b', 'c'], 1)).toEqual(['b', 'c', 'a'])
    expect(rotate(['a', 'b', 'c'], 3)).toEqual(['a', 'b', 'c'])
  })

  it('gera sementes estáveis', () => {
    expect(seedFrom('normal|3|7')).toBe(seedFrom('normal|3|7'))
    expect(seedFrom('normal|3|7')).not.toBe(seedFrom('normal|3|8'))
  })
})

describe('planJobs', () => {
  it('usa as mesmas partidas em todas as variantes', () => {
    const jobs = planJobs({
      variants: 2,
      difficulties: ['easy'],
      sizes: [2],
      games: 5,
      mode: 'sizes',
    })
    expect(jobs).toHaveLength(10)
    const first = jobs.filter((j) => j.variant === 0).map((j) => [j.seed, j.roles])
    const second = jobs.filter((j) => j.variant === 1).map((j) => [j.seed, j.roles])
    expect(second).toEqual(first)
    expect(jobs[0]?.cell).toBe(cellKey(0, 'easy', 2))
  })

  it('no modo compositions, joga cada composição', () => {
    const jobs = planJobs({
      variants: 1,
      difficulties: ['normal'],
      sizes: [4],
      games: 2,
      mode: 'compositions',
    })
    expect(jobs).toHaveLength(30)
  })
})

describe('estatística', () => {
  it('intervalo de Wilson contém a proporção', () => {
    const [low, high] = wilson(50, 100)
    expect(low).toBeLessThan(0.5)
    expect(high).toBeGreaterThan(0.5)
    expect(wilson(0, 0)).toEqual([0, 0])
  })

  it('resume as partidas', () => {
    const game = (won: boolean, finalLevel: number): GameMetrics => ({
      won,
      lossReason: won ? null : 'stranded',
      turns: 10,
      finalLevel,
      safe: won ? 10 : 3,
      stranded: won ? 1 : 4,
      swept: 1,
      skippedTurns: 0,
      doubleDeliveries: 0,
      radioCalls: 0,
      heals: 0,
    })
    const s = summarize([game(true, 14), game(false, 12)], 24)
    expect(s).toMatchObject({ games: 2, wins: 1, winRate: 0.5, lossStranded: 0.5, avgSwept: 1 })
    expect(s.avgLevelMarginOnWin).toBe(10)
  })
})

describe('variantes', () => {
  it('mescla objetos e troca listas', () => {
    expect(deepMerge({ a: { b: 1, c: 2 }, l: [1, 2] }, { a: { c: 3 }, l: [9] })).toEqual({
      a: { b: 1, c: 3 },
      l: [9],
    })
  })

  it('valida a variante pelo schema', () => {
    const v = variantFrom('x', 'teste', { rules: { actionsPerTurn: 4 } })
    expect(v.data.rules.actionsPerTurn).toBe(4)
    expect(v.data.map).toEqual(defaultGameData.map)
    expect(() => variantFrom('y', 'inválida', { difficulties: { normal: { goal: 11 } } })).toThrow(
      /goal/,
    )
  })
})

describe('playGame', () => {
  it('joga uma partida inteira e é reprodutível', () => {
    const a = playGame(baseline.data, 'easy', ['firefighter', 'medic'], 11)
    expect(a.lossReason === null).toBe(a.won)
    expect(a.turns).toBeGreaterThan(1)
    expect(playGame(baseline.data, 'easy', ['firefighter', 'medic'], 11)).toEqual(a)
  })
})

describe('relatório', () => {
  it('gera a tabela com as faixas-alvo', () => {
    const results = new Map([
      [cellKey(0, 'easy', 2), [playGame(baseline.data, 'easy', ['engineer', 'medic'], 5)]],
    ])
    const report = renderReport(
      {
        variants: [baseline],
        results,
        mode: 'sizes',
        difficulties: ['easy'],
        sizes: [2],
        games: 1,
      },
      '2026-11-20',
    )
    expect(report).toContain('| Tranquilo | 2 | 1 |')
    expect(report).toContain('70%–80%')
  })
})

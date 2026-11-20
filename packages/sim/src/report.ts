// Relatório da simulação em Markdown (PT-BR, como os documentos do projeto).
import { difficulties, roleIds, type Difficulty, type RoleId } from '@village-flood/engine'
import { compositions } from './compositions.ts'
import { cellKey, compositionKey, type Mode } from './plan.ts'
import type { GameMetrics } from './play.ts'
import type { Results } from './runner.ts'
import { summarize, type Summary } from './stats.ts'
import type { Variant } from './variants.ts'

/** Faixas-alvo de vitória (regras, seção 9, valores iniciais). */
export const targetBands: Record<Difficulty, [number, number]> = {
  easy: [0.7, 0.8],
  normal: [0.45, 0.6],
  storm: [0.2, 0.35],
}

export const difficultyLabel: Record<Difficulty, string> = {
  easy: 'Tranquilo',
  normal: 'Normal',
  storm: 'Tempestade',
}

export const roleLabel: Record<RoleId, string> = {
  firefighter: 'Bombeiro',
  'boat-pilot': 'Barqueira',
  engineer: 'Engenheiro',
  medic: 'Médica',
  'radio-host': 'Radialista',
  neighbor: 'Vizinha',
}

const pct = (x: number) => `${Math.round(x * 100)}%`
const num = (x: number, digits = 1) => x.toFixed(digits).replace('.', ',')

function band(difficulty: Difficulty, s: Summary): string {
  const [low, high] = targetBands[difficulty]
  if (s.winRate < low) return 'abaixo'
  if (s.winRate > high) return 'acima'
  return 'dentro'
}

export interface ReportInput {
  readonly variants: readonly Variant[]
  readonly results: Results
  readonly mode: Mode
  readonly difficulties: readonly Difficulty[]
  readonly sizes: readonly number[]
  readonly games: number
}

function collect(results: Results, keys: string[]): GameMetrics[] {
  return keys.flatMap((key) => results.get(key) ?? [])
}

function sizeKeys(input: ReportInput, variant: number, difficulty: Difficulty, size: number) {
  if (input.mode === 'sizes') return [cellKey(variant, difficulty, size)]
  return compositions(size).map((c) => cellKey(variant, difficulty, size, compositionKey(c)))
}

function summaryTable(input: ReportInput, variant: number): string[] {
  const max = input.variants[variant]?.data.rules.maxRiverLevel ?? 24
  const lines = [
    '| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |',
    '| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |',
  ]
  for (const difficulty of input.difficulties) {
    const rows: [string, Summary][] = []
    for (const size of input.sizes) {
      rows.push([
        String(size),
        summarize(collect(input.results, sizeKeys(input, variant, difficulty, size)), max),
      ])
    }
    const all = input.sizes.flatMap((size) => sizeKeys(input, variant, difficulty, size))
    rows.push(['todos', summarize(collect(input.results, all), max)])
    for (const [size, s] of rows) {
      const [low, high] = targetBands[difficulty]
      lines.push(
        `| ${difficultyLabel[difficulty]} | ${size} | ${s.games} | ${pct(s.winRate)} (${pct(s.winLow)}–${pct(s.winHigh)}) | ${pct(low)}–${pct(high)} (${band(difficulty, s)}) | ${num(s.avgTurns)} | ${pct(s.lossStranded)} / ${pct(s.lossLevel)} / ${pct(s.lossSwept)} | ${num(s.avgStranded)} | ${num(s.avgSwept, 2)} | ${s.avgLevelMarginOnWin === null ? '–' : num(s.avgLevelMarginOnWin)} |`,
      )
    }
  }
  return lines
}

function roleTable(input: ReportInput, variant: number): string[] {
  const max = input.variants[variant]?.data.rules.maxRiverLevel ?? 24
  const lines: string[] = []
  for (const difficulty of input.difficulties) {
    lines.push('', `#### ${difficultyLabel[difficulty]}: com e sem cada papel`, '')
    lines.push(
      '| Papel | Vitória com | Vitória sem | Diferença | Entregas duplas por partida (com) |',
    )
    lines.push('| --- | ---: | ---: | ---: | ---: |')
    for (const role of roleIds) {
      const withKeys: string[] = []
      const withoutKeys: string[] = []
      for (const size of input.sizes) {
        for (const comp of compositions(size)) {
          const key = cellKey(variant, difficulty, size, compositionKey(comp))
          ;(comp.includes(role) ? withKeys : withoutKeys).push(key)
        }
      }
      const yes = summarize(collect(input.results, withKeys), max)
      const no = summarize(collect(input.results, withoutKeys), max)
      const diff = Math.round((yes.winRate - no.winRate) * 100)
      lines.push(
        `| ${roleLabel[role]} | ${pct(yes.winRate)} | ${pct(no.winRate)} | ${diff > 0 ? '+' : ''}${diff} p.p. | ${num(yes.avgDoubleDeliveries, 2)} |`,
      )
    }
    lines.push(
      '',
      '| Assentos | Melhor composição | Pior composição | Diferença |',
      '| --- | --- | --- | ---: |',
    )
    for (const size of input.sizes) {
      const ranked = compositions(size)
        .map((comp) => ({
          comp,
          s: summarize(
            collect(input.results, [cellKey(variant, difficulty, size, compositionKey(comp))]),
            max,
          ),
        }))
        .sort((a, b) => b.s.winRate - a.s.winRate)
      const best = ranked[0]
      const worst = ranked.at(-1)
      if (!best || !worst) continue
      const label = (c: RoleId[]) => c.map((r) => roleLabel[r]).join(', ')
      lines.push(
        `| ${size} | ${label(best.comp)} (${pct(best.s.winRate)}) | ${label(worst.comp)} (${pct(worst.s.winRate)}) | ${Math.round((best.s.winRate - worst.s.winRate) * 100)} p.p. |`,
      )
    }
  }
  return lines
}

export function renderReport(input: ReportInput, date: string): string {
  const lines = [
    `# Simulação com bots (${date})`,
    '',
    `Modo \`${input.mode}\`, ${input.games} partidas por ${input.mode === 'sizes' ? 'célula (dificuldade × assentos, composições em rodízio)' : 'composição'}. As mesmas sementes valem para todas as variantes. Os bots são a régua relativa entre configurações; a calibração final exige partidas com pessoas.`,
    '',
    '"Margem de nível nas vitórias": quantos níveis ainda faltavam para a derrota por nível quando a equipe venceu (regras, seção 13, item 10).',
  ]
  input.variants.forEach((variant, index) => {
    lines.push('', `## Variante \`${variant.name}\``, '', variant.description, '')
    lines.push(...summaryTable(input, index))
    if (input.mode === 'compositions') lines.push(...roleTable(input, index))
  })
  return lines.join('\n') + '\n'
}

export { difficulties }

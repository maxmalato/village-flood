// CLI da simulação: pnpm simulate [opções]
//   --games N             partidas por célula (padrão 200)
//   --mode sizes|compositions
//   --difficulties easy,normal,storm
//   --sizes 2,3,4
//   --variant arquivo.json (pode repetir; a linha de base sempre entra primeiro)
//   --workers N           threads (padrão: núcleos da máquina)
//   --out relatorio.md    grava o relatório (senão, imprime)
import { difficulties, type Difficulty } from '@village-flood/engine'
import { writeFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { planJobs, type Mode } from './plan.ts'
import { renderReport } from './report.ts'
import { runJobs } from './runner.ts'
import { baseline, loadVariant } from './variants.ts'

const { values } = parseArgs({
  options: {
    games: { type: 'string', default: '200' },
    mode: { type: 'string', default: 'sizes' },
    difficulties: { type: 'string', default: difficulties.join(',') },
    sizes: { type: 'string', default: '2,3,4' },
    variant: { type: 'string', multiple: true, default: [] },
    workers: { type: 'string', default: String(availableParallelism()) },
    out: { type: 'string' },
  },
})

const mode = values.mode as Mode
if (mode !== 'sizes' && mode !== 'compositions')
  throw new Error('--mode deve ser sizes ou compositions')
const chosen = values.difficulties.split(',') as Difficulty[]
for (const d of chosen) if (!difficulties.includes(d)) throw new Error(`Dificuldade inválida: ${d}`)
const sizes = values.sizes.split(',').map(Number)
const games = Number(values.games)
// O pnpm roda o script dentro de packages/sim; caminhos relativos valem a partir de onde o
// comando foi digitado (INIT_CWD).
const fromCaller = (path: string) => resolve(process.env['INIT_CWD'] ?? process.cwd(), path)
const variants = [baseline, ...values.variant.map((path) => loadVariant(fromCaller(path)))]

const jobs = planJobs({ variants: variants.length, difficulties: chosen, sizes, games, mode })
const started = Date.now()
let lastLog = 0
const results = await runJobs(
  jobs,
  variants.map((v) => v.data),
  Number(values.workers),
  (done, total) => {
    if (Date.now() - lastLog > 5000 || done === total) {
      lastLog = Date.now()
      process.stderr.write(
        `${done}/${total} partidas (${Math.round((Date.now() - started) / 1000)} s)\n`,
      )
    }
  },
)

const report = renderReport(
  { variants, results, mode, difficulties: chosen, sizes, games },
  new Date().toISOString().slice(0, 10),
)
if (values.out) {
  writeFileSync(fromCaller(values.out), report)
  process.stderr.write(`Relatório gravado em ${fromCaller(values.out)}\n`)
} else {
  process.stdout.write(report)
}

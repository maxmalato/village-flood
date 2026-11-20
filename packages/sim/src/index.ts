// Simulação em lote com bots (fora do pnpm test).
export { compositions, rotate, seedFrom } from './compositions.ts'
export { cellKey, compositionKey, planJobs, type Job, type Mode } from './plan.ts'
export { playGame, type GameMetrics } from './play.ts'
export { renderReport, targetBands } from './report.ts'
export { summarize, wilson, type Summary } from './stats.ts'
export { baseline, deepMerge, loadVariant, variantFrom, type Variant } from './variants.ts'

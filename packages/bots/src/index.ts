// Bots do Enchente na Vila: funções puras, só com informação pública.
// Regra de arquitetura: só dependem do motor.
export {
  botMove,
  defaultWeights,
  plan,
  scoreState,
  suggest,
  type BotWeights,
  type Plan,
} from './bot.ts'
export { tileDangers, type TileDanger } from './danger.ts'
export { projectedRise, rainOutlook, type RainOutlook } from './outlook.ts'
export { pathCosts } from './paths.ts'

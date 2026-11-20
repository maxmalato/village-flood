// Motor de regras do Enchente na Vila.
// Regra de arquitetura: não depende de nenhum outro pacote do projeto, não usa APIs do
// navegador, do Node ou da Cloudflare e não faz I/O. A aleatoriedade vem do gerador com
// semente guardada no estado.

/** Identificador do jogo, usado pelo kit de salas (`GameDefinition.id`). */
export const GAME_ID = 'village-flood'

export * from './schema.ts'
export * from './types.ts'
export { defaultGameData } from './data.ts'
export {
  actorsOf,
  adjacentTileIds,
  carryCapacity,
  countResidents,
  findTile,
  findVolunteer,
  forecastView,
  houseMark,
  isWaiting,
  legalActions,
  moveCost,
  newGame,
  pickUpCost,
  reachableMoves,
  reinforceCost,
  transition,
  waterModelFor,
  type ForecastView,
  type ResidentCounts,
} from './game.ts'
export { createRiverLevelModel, thresholdsFor, wetness, type WaterModel } from './water.ts'
export { nextRandom, seedToRng, shuffle } from './rng.ts'

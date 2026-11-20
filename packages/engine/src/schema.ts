// Schema dos dados do jogo (regras, dificuldades e mapa).
// O schema é a fonte única: os tipos TypeScript saem dele (z.infer).
// Proposta aprovada em docs/engine-data-proposal.md.
import { z } from 'zod'

const nonNegativeInt = z.int().nonnegative()
const positiveInt = z.int().positive()

export const difficulties = ['easy', 'normal', 'storm'] as const
export const DifficultySchema = z.enum(difficulties)
export type Difficulty = z.infer<typeof DifficultySchema>

export const rainCardKinds = ['cloudy', 'drizzle', 'rain', 'storm'] as const
export const RainCardKindSchema = z.enum(rainCardKinds)
export type RainCardKind = z.infer<typeof RainCardKindSchema>

export const roleIds = [
  'firefighter',
  'boat-pilot',
  'engineer',
  'medic',
  'radio-host',
  'neighbor',
] as const
export const RoleIdSchema = z.enum(roleIds)
export type RoleId = z.infer<typeof RoleIdSchema>

export const heights = [1, 2, 3] as const
export type Height = (typeof heights)[number]
const HeightSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

/** Id de quadra: letra da coluna e número da linha (A1 a F6 no mapa v1). */
export const TileIdSchema = z.string().regex(/^[A-Z][1-9][0-9]?$/, 'id de quadra inválido')
export type TileId = z.infer<typeof TileIdSchema>

/** Quantidade por tipo de carta (baralho) ou subida por tipo de carta (regras). */
const PerRainCardSchema = z.strictObject({
  cloudy: nonNegativeInt,
  drizzle: nonNegativeInt,
  rain: nonNegativeInt,
  storm: nonNegativeInt,
})

const ThresholdSchema = z
  .strictObject({ flood: positiveInt, submerge: positiveInt })
  .refine((t) => t.flood < t.submerge, 'o limiar de alagar deve ser menor que o de submergir')

// ---------- Regras ----------

export const RoleParamsSchema = z.strictObject({
  defaultCarryCapacity: positiveInt,
  firefighterFloodedMoveCost: positiveInt,
  firefighterInjuredPickUpCost: positiveInt,
  boatPilotSubmergedMoveCost: positiveInt,
  boatPilotCarryCapacity: positiveInt,
  carryMoveSurcharge: nonNegativeInt,
  carrySurchargeFromCarried: positiveInt,
  engineerReinforceCost: positiveInt,
  /** Curar pode ser de graça (0). */
  medicHealCost: nonNegativeInt,
  medicInjuredPickUpCost: positiveInt,
  /** Chamado pelo rádio: custo para a Radialista e ações extras para o próximo voluntário. */
  radioCallCost: positiveInt,
  radioCallBonus: positiveInt,
  sweptSkipsNextTurn: z.boolean(),
  sweptDrawsRainOnSkippedTurn: z.boolean(),
  immediateLossOnSwept: z.array(DifficultySchema),
})
export type RoleParams = z.infer<typeof RoleParamsSchema>

export const RulesSchema = z.strictObject({
  version: z.literal(1),
  seats: z
    .strictObject({ min: positiveInt, max: positiveInt })
    .refine((s) => s.min <= s.max, 'seats.min deve ser menor ou igual a seats.max'),
  actionsPerTurn: positiveInt,
  maxRiverLevel: positiveInt,
  strandedLossCount: positiveInt,
  water: z.strictObject({
    thresholds: z.strictObject({ 1: ThresholdSchema, 2: ThresholdSchema, 3: ThresholdSchema }),
    sandbagBonus: nonNegativeInt,
    maxSandbagsPerTile: nonNegativeInt,
  }),
  rainCards: PerRainCardSchema,
  costs: z.strictObject({
    move: z.strictObject({ dry: positiveInt, flooded: positiveInt }),
    pickUp: z.strictObject({ healthy: positiveInt, injured: positiveInt }),
    reinforce: positiveInt,
  }),
  roleParams: RoleParamsSchema,
})
export type Rules = z.infer<typeof RulesSchema>
export type WaterRules = Rules['water']

// ---------- Dificuldades ----------

export const ForecastRulesSchema = z.discriminatedUnion('kind', [
  // Previsão pública e gratuita: as próximas `cards` cartas aparecem para todos.
  z.strictObject({ kind: z.literal('peek'), cards: positiveInt, cost: z.literal(0) }),
  // A Radialista usa a ação `forecast` e todos veem se há Temporal nas próximas `cards` cartas.
  z.strictObject({ kind: z.literal('storm-warning'), cards: positiveInt, cost: nonNegativeInt }),
])
export type ForecastRules = z.infer<typeof ForecastRulesSchema>

export const DifficultySettingsSchema = z
  .strictObject({
    goal: positiveInt,
    extraResidents: nonNegativeInt,
    startLevel: nonNegativeInt,
    deck: PerRainCardSchema,
    forecast: ForecastRulesSchema,
  })
  .refine(
    (d) => d.deck.cloudy + d.deck.drizzle + d.deck.rain + d.deck.storm > 0,
    'o baralho precisa ter pelo menos 1 carta',
  )
export type DifficultySettings = z.infer<typeof DifficultySettingsSchema>

export const DifficultiesSchema = z.strictObject({
  easy: DifficultySettingsSchema,
  normal: DifficultySettingsSchema,
  storm: DifficultySettingsSchema,
})
export type Difficulties = z.infer<typeof DifficultiesSchema>

// ---------- Mapa ----------

/** Converte coluna e linha (a partir de 0) no id da quadra. */
export function tileIdAt(x: number, y: number): TileId {
  return `${String.fromCharCode(65 + x)}${y + 1}`
}

/** Converte o id da quadra em coluna e linha (a partir de 0). */
export function coordsOf(id: TileId): { x: number; y: number } {
  return { x: id.charCodeAt(0) - 65, y: Number(id.slice(1)) - 1 }
}

export const MapDataSchema = z
  .strictObject({
    id: z.string().min(1),
    columns: z.int().min(1).max(26),
    rows: z.int().min(1).max(99),
    heights: z.array(z.array(HeightSchema)),
    church: TileIdSchema,
    dock: TileIdSchema,
    houses: z.array(TileIdSchema).min(1),
    residentsPerHouse: positiveInt,
    extraResidentOrder: z.array(TileIdSchema),
  })
  .superRefine((map, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message })

    if (map.heights.length !== map.rows || map.heights.some((row) => row.length !== map.columns)) {
      issue('heights deve ter rows linhas com columns alturas cada')
    }
    const inside = (id: TileId) => {
      const { x, y } = coordsOf(id)
      return x >= 0 && x < map.columns && y >= 0 && y < map.rows
    }
    for (const id of [map.church, map.dock, ...map.houses, ...map.extraResidentOrder]) {
      if (!inside(id)) issue(`a quadra ${id} está fora do mapa`)
    }
    if (map.church === map.dock) issue('a igreja e o cais devem ser quadras diferentes')
    if (new Set(map.houses).size !== map.houses.length) issue('casas repetidas em houses')
    if (map.houses.includes(map.church)) issue('a igreja não pode ser casa')
    if (map.houses.includes(map.dock)) issue('o cais não pode ser casa')
    for (const id of map.extraResidentOrder) {
      if (!map.houses.includes(id)) issue(`extraResidentOrder tem ${id}, que não é casa`)
    }
  })
export type MapData = z.infer<typeof MapDataSchema>

// ---------- Conjunto completo ----------

export const GameDataSchema = z
  .strictObject({
    rules: RulesSchema,
    difficulties: DifficultiesSchema,
    map: MapDataSchema,
  })
  .superRefine((data, ctx) => {
    const { rules, map } = data
    const baseResidents = map.houses.length * map.residentsPerHouse
    for (const difficulty of difficulties) {
      const settings = data.difficulties[difficulty]
      const path = ['difficulties', difficulty]
      if (settings.extraResidents > map.extraResidentOrder.length) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `extraResidents (${settings.extraResidents}) é maior que extraResidentOrder do mapa`,
        })
      }
      // Coerência da derrota por ilhados (regras, seção 6): o ilhado número
      // strandedLossCount torna a meta impossível.
      const residents = baseResidents + settings.extraResidents
      const expected = settings.goal + rules.strandedLossCount - 1
      if (residents !== expected) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `moradores no mapa (${residents}) devem ser goal + strandedLossCount - 1 (${expected})`,
        })
      }
      if (settings.startLevel >= rules.maxRiverLevel) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: 'startLevel deve ser menor que maxRiverLevel',
        })
      }
    }
  })
export type GameData = z.infer<typeof GameDataSchema>

/** Valida os dados do jogo. Lança erro com a lista de problemas se forem inválidos. */
export function parseGameData(raw: unknown): GameData {
  const result = GameDataSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Dados do jogo inválidos:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

// ---------- Criação da partida ----------

export const SeatSetupSchema = z.strictObject({
  seat: z.string().min(1).max(64),
  role: RoleIdSchema,
})

export const GameSetupSchema = z.strictObject({
  difficulty: DifficultySchema,
  seats: z.array(SeatSetupSchema).min(1),
  seed: z.int(),
})
export type GameSetup = z.infer<typeof GameSetupSchema>

// Regras do Enchente na Vila como funções puras.
// `transition` nunca muta a entrada e devolve { ok, state, events, reason }.
// Todos os números vêm de state.config (dados); aqui fica só a estrutura das regras.
import { indexTiles, isNeighbor, neighborIds } from './board.ts'
import { defaultGameData } from './data.ts'
import { nextRandom, seedToRng, shuffle } from './rng.ts'
import {
  coordsOf,
  GameSetupSchema,
  rainCardKinds,
  tileIdAt,
  type GameData,
  type GameSetup,
  type RainCardKind,
  type TileId,
  type Variation,
} from './schema.ts'
import type {
  Action,
  Ctx,
  GameConfig,
  GameEvent,
  GameState,
  HouseMark,
  LossReason,
  Resident,
  SeatId,
  Snapshot,
  Tile,
  TileKind,
  TransitionResult,
  Volunteer,
} from './types.ts'
import { createRiverLevelModel, wetness, type WaterModel } from './water.ts'

// ---------- Consultas ----------

/** Modelo de água desta partida. Só aqui o motor escolhe o modelo concreto. */
export function waterModelFor(config: GameConfig): WaterModel {
  return createRiverLevelModel(config.rules.water)
}

export function findTile(state: GameState, id: TileId): Tile | undefined {
  return state.tiles.find((tile) => tile.id === id)
}

function tileOf(state: GameState, id: TileId): Tile {
  const tile = findTile(state, id)
  if (!tile) throw new Error(`Quadra inexistente: ${id}`)
  return tile
}

function tileIdOfKind(state: GameState, kind: TileKind): TileId {
  const tile = state.tiles.find((t) => t.kind === kind)
  if (!tile) throw new Error(`O mapa não tem ${kind}`)
  return tile.id
}

export function findVolunteer(state: GameState, seat: SeatId): Volunteer | undefined {
  return state.volunteers.find((v) => v.seat === seat)
}

function activeVolunteer(state: GameState): Volunteer {
  const volunteer = findVolunteer(state, state.activeSeat)
  if (!volunteer) throw new Error(`Assento ativo sem voluntário: ${state.activeSeat}`)
  return volunteer
}

/** Morador esperando resgate na quadra (não carregado, não salvo, não ilhado). */
export function isWaiting(resident: Resident): boolean {
  return (
    resident.tileId !== null &&
    resident.carriedBy === null &&
    (resident.status === 'healthy' || resident.status === 'injured')
  )
}

/** Quem pode agir agora (kit: GameDefinition.actorsOf). */
export function actorsOf(state: GameState): SeatId[] {
  return state.phase === 'playing' ? [state.activeSeat] : []
}

/** Quantos moradores o voluntário carrega no máximo. */
export function carryCapacity(state: GameState, volunteer: Volunteer): number {
  const params = state.config.rules.roleParams
  return volunteer.role === 'boat-pilot'
    ? params.boatPilotCarryCapacity
    : params.defaultCarryCapacity
}

/**
 * Custo de entrar na quadra, pelo estado dela (regras, seção 5).
 * Devolve null se o voluntário não pode entrar (quadra submersa e não é a Barqueira).
 */
export function moveCost(state: GameState, volunteer: Volunteer, to: Tile): number | null {
  const { costs, roleParams } = state.config.rules
  let cost: number
  switch (to.water) {
    case 'dry':
      cost = costs.move.dry
      break
    case 'flooded':
      cost =
        volunteer.role === 'firefighter'
          ? roleParams.firefighterFloodedMoveCost
          : costs.move.flooded
      break
    case 'submerged':
      if (volunteer.role !== 'boat-pilot') return null
      cost = roleParams.boatPilotSubmergedMoveCost
      break
  }
  if (volunteer.carrying.length >= roleParams.carrySurchargeFromCarried) {
    cost += roleParams.carryMoveSurcharge
  }
  return cost
}

/** Custo de pegar o morador (regras, seção 6). */
export function pickUpCost(state: GameState, volunteer: Volunteer, resident: Resident): number {
  const { costs, roleParams } = state.config.rules
  if (resident.status !== 'injured') return costs.pickUp.healthy
  if (volunteer.role === 'firefighter') return roleParams.firefighterInjuredPickUpCost
  if (volunteer.role === 'medic') return roleParams.medicInjuredPickUpCost
  return costs.pickUp.injured
}

/** Quem recebe o Chamado pelo rádio: o próximo assento na ordem. */
export function radioCallTarget(state: GameState, seat: SeatId): SeatId | null {
  const index = state.volunteers.findIndex((v) => v.seat === seat)
  if (index < 0 || state.volunteers.length < 2) return null
  return state.volunteers[(index + 1) % state.volunteers.length]?.seat ?? null
}

/** Custo do saco de areia para o voluntário. */
export function reinforceCost(state: GameState, volunteer: Volunteer): number {
  const { costs, roleParams } = state.config.rules
  return volunteer.role === 'engineer' ? roleParams.engineerReinforceCost : costs.reinforce
}

/**
 * Quadras vizinhas de uma quadra: as 4 ortogonais e, se pedido, as 4 diagonais
 * (só a Vizinha anda na diagonal). Usada por bots e pela interface para calcular caminhos.
 */
export function adjacentTileIds(state: GameState, tileId: TileId, diagonals: boolean): TileId[] {
  const tile = findTile(state, tileId)
  if (!tile) return []
  return neighborIds(tile, indexTiles(state.tiles), diagonals)
}

/** Quadras vizinhas onde o voluntário pode entrar agora, com o custo de cada uma. */
export function reachableMoves(state: GameState, seat: SeatId): { to: TileId; cost: number }[] {
  const volunteer = findVolunteer(state, seat)
  if (!volunteer) return []
  const byCoord = indexTiles(state.tiles)
  const here = tileOf(state, volunteer.tileId)
  const result: { to: TileId; cost: number }[] = []
  for (const id of neighborIds(here, byCoord, volunteer.role === 'neighbor')) {
    const cost = moveCost(state, volunteer, tileOf(state, id))
    if (cost !== null) result.push({ to: id, cost })
  }
  return result
}

/**
 * Marca da casa (regras, seção 4), sempre calculada e nunca guardada.
 * null: não é casa ou ainda há morador esperando nela.
 */
export function houseMark(state: GameState, tileId: TileId): HouseMark | null {
  const tile = findTile(state, tileId)
  if (!tile || tile.kind !== 'house') return null
  const own = state.residents.filter((r) => r.homeTileId === tileId)
  if (own.some((r) => r.tileId === tileId && isWaiting(r))) return null
  return own.some((r) => r.status === 'stranded') ? 'lost' : 'cleared'
}

export interface ResidentCounts {
  total: number
  waiting: number
  carried: number
  safe: number
  stranded: number
}

export function countResidents(state: GameState): ResidentCounts {
  const counts: ResidentCounts = {
    total: state.residents.length,
    waiting: 0,
    carried: 0,
    safe: 0,
    stranded: 0,
  }
  for (const r of state.residents) {
    if (r.status === 'safe') counts.safe++
    else if (r.status === 'stranded') counts.stranded++
    else if (r.carriedBy !== null) counts.carried++
    else counts.waiting++
  }
  return counts
}

export type ForecastView =
  | { kind: 'peek'; cards: RainCardKind[] }
  | { kind: 'storm-warning'; cards: number; cost: number; result: boolean | null }

/** Previsão pública (regras, seção 9). null quando a equipe não tem Radialista. */
export function forecastView(state: GameState): ForecastView | null {
  if (!state.volunteers.some((v) => v.role === 'radio-host')) return null
  const forecast = state.config.settings.forecast
  if (forecast.kind === 'peek') {
    return { kind: 'peek', cards: state.rainDeck.slice(0, forecast.cards) }
  }
  return {
    kind: 'storm-warning',
    cards: forecast.cards,
    cost: forecast.cost,
    result: state.stormWarning,
  }
}

// ---------- Criação da partida ----------

/** Cria a partida. Lança erro se a configuração for inválida. */
export function newGame(setup: GameSetup, data: GameData = defaultGameData): GameState {
  const { difficulty, seats, seed, variation: forced } = GameSetupSchema.parse(setup)
  const { rules, map } = data
  const settings = data.difficulties[difficulty]

  if (seats.length < rules.seats.min || seats.length > rules.seats.max) {
    throw new Error(`A partida precisa de ${rules.seats.min} a ${rules.seats.max} assentos`)
  }
  if (new Set(seats.map((s) => s.seat)).size !== seats.length) {
    throw new Error('Assentos repetidos')
  }
  if (new Set(seats.map((s) => s.role)).size !== seats.length) {
    throw new Error('Cada assento precisa de um papel diferente')
  }

  // Variação da partida: cenário de moradores extras e espelhamento (sorteados pela semente).
  let rng = seedToRng(seed)
  const scenarios = settings.extraResidentScenarios
  let variation: Variation
  if (forced) {
    if (forced.scenario >= scenarios.length)
      throw new Error(`Cenário inexistente: ${forced.scenario}`)
    if (forced.mirrored && !map.allowMirror) throw new Error('Este mapa não pode ser espelhado')
    variation = forced
  } else {
    const pick = nextRandom(rng)
    rng = pick.rng
    let mirrored = false
    if (map.allowMirror) {
      const flip = nextRandom(rng)
      rng = flip.rng
      mirrored = flip.value < 0.5
    }
    variation = { scenario: Math.floor(pick.value * scenarios.length), mirrored }
  }

  // Espelhado de cima para baixo: a linha y vira rows - 1 - y. O rio continua na coluna A.
  const place = (id: TileId): TileId => {
    if (!variation.mirrored) return id
    const { x, y } = coordsOf(id)
    return tileIdAt(x, map.rows - 1 - y)
  }
  const church = place(map.church)
  const dock = place(map.dock)
  const houses = map.houses.map(place)

  const tiles: Tile[] = []
  for (let y = 0; y < map.rows; y++) {
    for (let x = 0; x < map.columns; x++) {
      const id = tileIdAt(x, y)
      const kind: TileKind =
        id === church ? 'church' : id === dock ? 'dock' : houses.includes(id) ? 'house' : 'plain'
      const sourceRow = variation.mirrored ? map.rows - 1 - y : y
      const height = map.heights[sourceRow]?.[x]
      if (height === undefined) throw new Error(`Altura ausente em ${id}`)
      tiles.push({ id, x, y, height, kind, sandbags: 0, water: 'dry' })
    }
  }

  // Moradores: residentsPerHouse em cada casa, mais 1 em cada casa do cenário sorteado.
  const extras = new Set((scenarios[variation.scenario] ?? []).map(place))
  const residents: Resident[] = []
  for (const house of houses) {
    const count = map.residentsPerHouse + (extras.has(house) ? 1 : 0)
    for (let k = 1; k <= count; k++) {
      residents.push({
        id: `${house}-${k}`,
        homeTileId: house,
        tileId: house,
        carriedBy: null,
        status: 'healthy',
      })
    }
  }

  const volunteers: Volunteer[] = seats.map((s, i) => ({
    seat: s.seat,
    role: s.role,
    tileId: dock,
    carrying: [],
    actionsLeft: i === 0 ? rules.actionsPerTurn : 0,
    skipNextTurn: false,
    bonusActions: 0,
  }))

  const cards: RainCardKind[] = []
  for (const kind of rainCardKinds) {
    for (let i = 0; i < settings.deck[kind]; i++) cards.push(kind)
  }
  const shuffled = shuffle(cards, rng)

  const first = seats[0]
  if (!first) throw new Error('A partida precisa de assentos')

  const state: GameState = {
    config: { difficulty, mapId: map.id, rules, settings, variation },
    rng: shuffled.rng,
    tiles,
    residents,
    volunteers,
    riverLevel: settings.startLevel,
    rainDeck: shuffled.items,
    rainDiscard: [],
    stormWarning: null,
    radioCalled: false,
    turn: 1,
    activeSeat: first.seat,
    turnHistory: [],
    phase: 'playing',
  }
  // Água do nível inicial.
  return settleWater(state, [])
}

// ---------- Transição ----------

function reject(state: GameState, reason: Extract<TransitionResult, { ok: false }>['reason']) {
  return { ok: false, state, events: [], reason } as const
}

function snapshotOf(state: GameState): Snapshot {
  const { turnHistory: _history, ...snapshot } = state
  return snapshot
}

function updateVolunteer(state: GameState, seat: SeatId, patch: Partial<Volunteer>): GameState {
  return {
    ...state,
    volunteers: state.volunteers.map((v) => (v.seat === seat ? { ...v, ...patch } : v)),
  }
}

/** Aplica a ação de quem tem a vez. Pura: não muta `state`. */
export function transition(state: GameState, action: Action, ctx: Ctx): TransitionResult {
  if (state.phase !== 'playing') return reject(state, 'game-over')
  if (ctx.seat !== state.activeSeat) return reject(state, 'not-your-turn')

  switch (action.type) {
    case 'move':
      return withUndo(state, applyMove(state, action.to))
    case 'pick-up':
      return withUndo(state, applyPickUp(state, action.residentId))
    case 'heal':
      return withUndo(state, applyHeal(state, action.residentId))
    case 'reinforce':
      return withUndo(state, applyReinforce(state, action.tileId))
    case 'forecast':
      return applyForecast(state)
    case 'radio-call':
      return withUndo(state, applyRadioCall(state))
    case 'undo':
      return applyUndo(state)
    case 'end-turn':
      return applyEndTurn(state)
  }
}

/** Guarda o estado anterior no histórico do turno, para o desfazer. */
function withUndo(before: GameState, result: TransitionResult): TransitionResult {
  if (!result.ok) return result
  return {
    ...result,
    state: { ...result.state, turnHistory: [...before.turnHistory, snapshotOf(before)] },
  }
}

function applyMove(state: GameState, to: TileId): TransitionResult {
  const volunteer = activeVolunteer(state)
  const target = findTile(state, to)
  if (!target) return reject(state, 'unknown-tile')
  const here = tileOf(state, volunteer.tileId)
  if (!isNeighbor(here, target, volunteer.role === 'neighbor')) return reject(state, 'not-adjacent')
  const cost = moveCost(state, volunteer, target)
  if (cost === null) return reject(state, 'tile-submerged')
  if (cost > volunteer.actionsLeft) return reject(state, 'not-enough-actions')

  const events: GameEvent[] = [{ type: 'moved', seat: volunteer.seat, from: here.id, to, cost }]
  let next = updateVolunteer(state, volunteer.seat, {
    tileId: to,
    actionsLeft: volunteer.actionsLeft - cost,
  })

  // Entrega automática na igreja, sem custo (regras, seção 6).
  if (target.kind === 'church' && volunteer.carrying.length > 0) {
    const delivered = new Set(volunteer.carrying)
    next = {
      ...updateVolunteer(next, volunteer.seat, { carrying: [] }),
      residents: next.residents.map((r) =>
        delivered.has(r.id) ? { ...r, tileId: to, carriedBy: null, status: 'safe' as const } : r,
      ),
    }
    events.push({ type: 'delivered', seat: volunteer.seat, residentIds: [...volunteer.carrying] })
  }

  next = checkOutcome(next, events, false)
  return { ok: true, state: next, events }
}

function applyPickUp(state: GameState, residentId: string): TransitionResult {
  const volunteer = activeVolunteer(state)
  const resident = state.residents.find((r) => r.id === residentId)
  if (!resident || resident.tileId !== volunteer.tileId || !isWaiting(resident)) {
    return reject(state, 'resident-not-here')
  }
  if (volunteer.carrying.length >= carryCapacity(state, volunteer))
    return reject(state, 'carry-full')
  const cost = pickUpCost(state, volunteer, resident)
  if (cost > volunteer.actionsLeft) return reject(state, 'not-enough-actions')

  const next: GameState = {
    ...updateVolunteer(state, volunteer.seat, {
      carrying: [...volunteer.carrying, resident.id],
      actionsLeft: volunteer.actionsLeft - cost,
    }),
    residents: state.residents.map((r) =>
      r.id === resident.id ? { ...r, tileId: null, carriedBy: volunteer.seat } : r,
    ),
  }
  return {
    ok: true,
    state: next,
    events: [
      { type: 'picked-up', seat: volunteer.seat, residentId, tileId: volunteer.tileId, cost },
    ],
  }
}

function applyHeal(state: GameState, residentId: string): TransitionResult {
  const volunteer = activeVolunteer(state)
  if (volunteer.role !== 'medic') return reject(state, 'role-required')
  const resident = state.residents.find((r) => r.id === residentId)
  if (!resident) return reject(state, 'resident-not-here')
  if (resident.status !== 'injured') return reject(state, 'resident-not-injured')
  // A Médica cura só moradores em quadra (não os carregados).
  if (resident.tileId === null || resident.carriedBy !== null) {
    return reject(state, 'resident-not-here')
  }
  const here = tileOf(state, volunteer.tileId)
  const there = tileOf(state, resident.tileId)
  if (here.id !== there.id && !isNeighbor(here, there, false)) return reject(state, 'not-adjacent')
  const cost = state.config.rules.roleParams.medicHealCost
  if (cost > volunteer.actionsLeft) return reject(state, 'not-enough-actions')

  const next: GameState = {
    ...updateVolunteer(state, volunteer.seat, { actionsLeft: volunteer.actionsLeft - cost }),
    residents: state.residents.map((r) =>
      r.id === resident.id ? { ...r, status: 'healthy' as const } : r,
    ),
  }
  return { ok: true, state: next, events: [{ type: 'healed', seat: volunteer.seat, residentId }] }
}

function applyReinforce(state: GameState, tileId: TileId): TransitionResult {
  const volunteer = activeVolunteer(state)
  const target = findTile(state, tileId)
  if (!target) return reject(state, 'unknown-tile')
  if (target.kind === 'church' || target.kind === 'dock') {
    return reject(state, 'tile-not-reinforceable')
  }
  const here = tileOf(state, volunteer.tileId)
  // Só o Engenheiro pode pôr saco em quadra vizinha.
  const inRange =
    here.id === target.id || (volunteer.role === 'engineer' && isNeighbor(here, target, false))
  if (!inRange) return reject(state, 'not-adjacent')
  if (target.sandbags >= state.config.rules.water.maxSandbagsPerTile) {
    return reject(state, 'sandbag-limit')
  }
  const cost = reinforceCost(state, volunteer)
  if (cost > volunteer.actionsLeft) return reject(state, 'not-enough-actions')

  const sandbags = target.sandbags + 1
  const events: GameEvent[] = [{ type: 'sandbag-placed', seat: volunteer.seat, tileId, sandbags }]
  let next: GameState = {
    ...updateVolunteer(state, volunteer.seat, { actionsLeft: volunteer.actionsLeft - cost }),
    tiles: state.tiles.map((t) => (t.id === tileId ? { ...t, sandbags } : t)),
  }
  next = settleWater(next, events)
  next = checkOutcome(next, events, false)
  return { ok: true, state: next, events }
}

function applyForecast(state: GameState): TransitionResult {
  const volunteer = activeVolunteer(state)
  const forecast = state.config.settings.forecast
  if (forecast.kind !== 'storm-warning') return reject(state, 'forecast-unavailable')
  if (volunteer.role !== 'radio-host') return reject(state, 'role-required')
  if (state.stormWarning !== null) return reject(state, 'forecast-unavailable')
  if (forecast.cost > volunteer.actionsLeft) return reject(state, 'not-enough-actions')

  const stormComing = state.rainDeck.slice(0, forecast.cards).includes('storm')
  const next: GameState = {
    ...updateVolunteer(state, volunteer.seat, {
      actionsLeft: volunteer.actionsLeft - forecast.cost,
    }),
    stormWarning: stormComing,
    // Ponto sem volta: o desfazer só alcança as ações feitas depois do alerta.
    turnHistory: [],
  }
  return {
    ok: true,
    state: next,
    events: [
      { type: 'forecast-revealed', seat: volunteer.seat, stormComing, cards: forecast.cards },
    ],
  }
}

/**
 * Chamado pelo rádio (Radialista, uma vez por turno): o próximo voluntário na ordem ganha
 * ações extras no turno dele. Pode ser desfeito (não revela informação).
 */
function applyRadioCall(state: GameState): TransitionResult {
  const volunteer = activeVolunteer(state)
  if (volunteer.role !== 'radio-host') return reject(state, 'role-required')
  if (state.radioCalled) return reject(state, 'radio-call-used')
  const target = radioCallTarget(state, volunteer.seat)
  if (target === null) return reject(state, 'radio-call-used')
  const { radioCallCost, radioCallBonus } = state.config.rules.roleParams
  if (radioCallCost > volunteer.actionsLeft) return reject(state, 'not-enough-actions')

  let next = updateVolunteer(state, volunteer.seat, {
    actionsLeft: volunteer.actionsLeft - radioCallCost,
  })
  const receiver = findVolunteer(next, target)
  next = updateVolunteer(next, target, {
    bonusActions: (receiver?.bonusActions ?? 0) + radioCallBonus,
  })
  return {
    ok: true,
    state: { ...next, radioCalled: true },
    events: [{ type: 'radio-called', seat: volunteer.seat, target, bonus: radioCallBonus }],
  }
}

function applyUndo(state: GameState): TransitionResult {
  const previous = state.turnHistory.at(-1)
  if (!previous) return reject(state, 'nothing-to-undo')
  return {
    ok: true,
    state: { ...previous, turnHistory: state.turnHistory.slice(0, -1) },
    events: [{ type: 'action-undone', seat: state.activeSeat }],
  }
}

function applyEndTurn(state: GameState): TransitionResult {
  const volunteer = activeVolunteer(state)
  const events: GameEvent[] = [{ type: 'turn-ended', seat: volunteer.seat, turn: state.turn }]
  let next: GameState = {
    ...updateVolunteer(state, volunteer.seat, { actionsLeft: 0 }),
    turnHistory: [],
    stormWarning: null,
    radioCalled: false,
  }
  next = rainPhase(next, events)
  if (next.phase === 'playing') next = advanceTurn(next, events)
  return { ok: true, state: next, events }
}

// ---------- Fim de turno ----------

/** Passa a vez. Quem tem `skipNextTurn` perde o turno, mas a chuva ainda cai (a testar). */
function advanceTurn(state: GameState, events: GameEvent[]): GameState {
  const { rules } = state.config
  let next = state
  // Cada volta consome uma marca de turno perdido; o limite só protege contra erro de regra.
  for (let guard = 0; guard < next.volunteers.length * 4 + 4; guard++) {
    const index = next.volunteers.findIndex((v) => v.seat === next.activeSeat)
    const upcoming = next.volunteers[(index + 1) % next.volunteers.length]
    if (!upcoming) throw new Error('Partida sem voluntários')
    const turn = next.turn + 1
    next = { ...next, turn, activeSeat: upcoming.seat }
    events.push({ type: 'turn-started', seat: upcoming.seat, turn })

    if (!upcoming.skipNextTurn) {
      return updateVolunteer(next, upcoming.seat, {
        actionsLeft: rules.actionsPerTurn + upcoming.bonusActions,
        bonusActions: 0,
      })
    }
    events.push({ type: 'turn-skipped', seat: upcoming.seat, turn })
    // O bônus do Chamado pelo rádio se perde junto com o turno.
    next = updateVolunteer(next, upcoming.seat, {
      skipNextTurn: false,
      actionsLeft: 0,
      bonusActions: 0,
    })
    if (rules.roleParams.sweptDrawsRainOnSkippedTurn) {
      next = rainPhase(next, events)
      if (next.phase !== 'playing') return next
    }
  }
  throw new Error('Laço de turnos perdidos sem fim')
}

/** Compra a carta de chuva, sobe o nível, recalcula a água, leva os apanhados e verifica o fim. */
function rainPhase(state: GameState, events: GameEvent[]): GameState {
  const card = state.rainDeck[0]
  if (card === undefined) throw new Error('Baralho de chuva vazio')
  let rainDeck = state.rainDeck.slice(1)
  let rainDiscard = [...state.rainDiscard, card]
  let rng = state.rng
  // Reembaralha logo depois da compra que esvazia o baralho: ele nunca fica vazio entre turnos.
  if (rainDeck.length === 0) {
    const shuffled = shuffle(rainDiscard, rng)
    rainDeck = shuffled.items
    rainDiscard = []
    rng = shuffled.rng
  }

  const rise = state.config.rules.rainCards[card]
  events.push({ type: 'rain-drawn', card, rise })
  const from = state.riverLevel
  const to = from + rise
  if (rise > 0) events.push({ type: 'level-rose', from, to })

  let next: GameState = { ...state, rainDeck, rainDiscard, rng, riverLevel: to }
  next = settleWater(next, events)
  const swept = sweepVolunteers(next, events)
  return checkOutcome(swept.state, events, swept.any)
}

/**
 * Recalcula a água e aplica as transições dos moradores (regras, seção 6):
 * só a passagem para um estado mais molhado tem efeito; nada reverte quando a quadra seca.
 */
function settleWater(state: GameState, events: GameEvent[]): GameState {
  const tiles = waterModelFor(state.config).recompute(state.tiles, state.riverLevel)
  const injuredTiles = new Set<TileId>()
  const strandedTiles = new Set<TileId>()

  tiles.forEach((after, i) => {
    const before = state.tiles[i]
    if (!before || before.water === after.water) return
    if (wetness[after.water] < wetness[before.water]) {
      events.push({ type: 'tile-dried', tileId: after.id, water: after.water })
    } else if (after.water === 'submerged') {
      events.push({ type: 'tile-submerged', tileId: after.id })
      strandedTiles.add(after.id)
    } else {
      events.push({ type: 'tile-flooded', tileId: after.id })
      injuredTiles.add(after.id)
    }
  })

  if (injuredTiles.size === 0 && strandedTiles.size === 0) return { ...state, tiles }

  const residents = state.residents.map((r) => {
    if (!isWaiting(r) || r.tileId === null) return r
    if (strandedTiles.has(r.tileId)) {
      events.push({ type: 'resident-stranded', residentId: r.id, tileId: r.tileId, cause: 'water' })
      return { ...r, tileId: null, status: 'stranded' as const }
    }
    if (injuredTiles.has(r.tileId) && r.status === 'healthy') {
      events.push({ type: 'resident-injured', residentId: r.id, tileId: r.tileId })
      return { ...r, status: 'injured' as const }
    }
    return r
  })
  return { ...state, tiles, residents }
}

/**
 * Voluntário apanhado pela água (regras, seção 8, a testar): quem está em quadra submersa
 * depois da chuva (exceto a Barqueira) vai para o cais, perde o próximo turno e os moradores
 * que carregava ficam ilhados.
 */
function sweepVolunteers(
  state: GameState,
  events: GameEvent[],
): { state: GameState; any: boolean } {
  const params = state.config.rules.roleParams
  const dock = tileIdOfKind(state, 'dock')
  let next = state
  let any = false
  for (const volunteer of state.volunteers) {
    if (volunteer.role === 'boat-pilot') continue
    if (tileOf(state, volunteer.tileId).water !== 'submerged') continue
    any = true
    const carried = new Set(volunteer.carrying)
    for (const residentId of volunteer.carrying) {
      events.push({
        type: 'resident-stranded',
        residentId,
        tileId: volunteer.tileId,
        cause: 'swept',
      })
    }
    events.push({
      type: 'volunteer-swept',
      seat: volunteer.seat,
      from: volunteer.tileId,
      to: dock,
      strandedResidentIds: [...volunteer.carrying],
    })
    next = {
      ...updateVolunteer(next, volunteer.seat, {
        tileId: dock,
        carrying: [],
        skipNextTurn: params.sweptSkipsNextTurn,
      }),
      residents: next.residents.map((r) =>
        carried.has(r.id)
          ? { ...r, tileId: null, carriedBy: null, status: 'stranded' as const }
          : r,
      ),
    }
  }
  return { state: next, any }
}

/**
 * Vitória e derrota (regras, seção 8). A derrota tem prioridade quando as duas acontecem juntas.
 * Vitória: salvos >= meta e todos os voluntários no cais.
 */
function checkOutcome(state: GameState, events: GameEvent[], sweptNow: boolean): GameState {
  if (state.phase !== 'playing') return state
  const { rules, settings, difficulty } = state.config
  const counts = countResidents(state)

  let reason: LossReason | null = null
  if (counts.stranded >= rules.strandedLossCount) reason = 'stranded'
  else if (state.riverLevel >= rules.maxRiverLevel) reason = 'level'
  else if (sweptNow && rules.roleParams.immediateLossOnSwept.includes(difficulty)) reason = 'swept'

  if (reason) {
    events.push({ type: 'lost', reason })
    return { ...state, phase: 'lost', lossReason: reason, turnHistory: [] }
  }

  const dock = tileIdOfKind(state, 'dock')
  if (counts.safe >= settings.goal && state.volunteers.every((v) => v.tileId === dock)) {
    events.push({ type: 'won' })
    return { ...state, phase: 'won', turnHistory: [] }
  }
  return state
}

// ---------- Ações possíveis ----------

/** Todas as ações aceitas agora para quem tem a vez (bots, sugestões e testes). */
export function legalActions(state: GameState): Action[] {
  if (state.phase !== 'playing') return []
  const volunteer = activeVolunteer(state)
  const byCoord = indexTiles(state.tiles)
  const here = tileOf(state, volunteer.tileId)
  const around = neighborIds(here, byCoord, true)

  const candidates: Action[] = [
    ...around.map((to): Action => ({ type: 'move', to })),
    ...state.residents.map((r): Action => ({ type: 'pick-up', residentId: r.id })),
    ...state.residents
      .filter((r) => r.status === 'injured')
      .map((r): Action => ({ type: 'heal', residentId: r.id })),
    ...[here.id, ...around].map((tileId): Action => ({ type: 'reinforce', tileId })),
    { type: 'forecast' },
    { type: 'radio-call' },
    { type: 'undo' },
    { type: 'end-turn' },
  ]
  const ctx = { seat: volunteer.seat }
  return candidates.filter((action) => transition(state, action, ctx).ok)
}

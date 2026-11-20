// Bot heurístico (regras, seção 11; spec, seção 8).
// Avalia todas as sequências de até 3 ações do turno e escolhe a de maior pontuação.
// Usa só informação pública (ver outlook.ts) e é determinístico para o mesmo estado.
import {
  countResidents,
  findVolunteer,
  isWaiting,
  transition,
  adjacentTileIds,
  findTile,
  type Action,
  type GameState,
  type SeatId,
  type TileId,
  type Volunteer,
} from '@village-flood/engine'
import { sandbagKey, tileDangers, type TileDanger } from './danger.ts'
import { projectedRise, rainOutlook, type RainOutlook } from './outlook.ts'
import { pathCosts } from './paths.ts'

/** Pesos da avaliação. São do bot (não do jogo), por isso ficam no código. */
export interface BotWeights {
  /** Morador salvo. */
  safe: number
  /** Morador carregado (menos que salvo, para valer a pena entregar). */
  carried: number
  /** Por ação de distância até a igreja, carregando. */
  distanceToChurch: number
  /** Por ação de distância até o morador alvo. */
  distanceToTarget: number
  /** Por ação de distância até o cais, quando a meta está garantida. */
  distanceToDock: number
  /** Terminar o turno onde a água pode apanhar o voluntário. */
  swept: number
  /** Por nível de folga que falta a um morador esperando (prioriza os urgentes e o saco de areia). */
  urgency: number
  /** Folga, em níveis, a partir da qual o morador esperando não é urgente. */
  urgencyHorizon: number
  /** Bônus por nível de urgência de um morador carregado (prioriza resgatar quem corre risco). */
  rescueUrgency: number
  /** Teto do bônus de resgate urgente (sempre menor que safe - carried, para valer a pena entregar). */
  rescueUrgencyCap: number
  /** Morador ferido esperando (valoriza curar). */
  injured: number
  /** Margem de segurança, em níveis, além da subida esperada. */
  riskMargin: number
  /** Valor de cada ação extra dada a um colega (Chamado pelo rádio). */
  bonusAction: number
}

export const defaultWeights: BotWeights = {
  safe: 100,
  carried: 55,
  distanceToChurch: 3,
  distanceToTarget: 3,
  distanceToDock: 3,
  swept: 400,
  urgency: 1,
  urgencyHorizon: 14,
  rescueUrgency: 4,
  rescueUrgencyCap: 30,
  injured: 4,
  riskMargin: 2,
  bonusAction: 8,
}

/** Profundidade máxima da busca, em ações. */
const MAX_DEPTH = 3
const WON = 1e9
const LOST = -1e9
const UNREACHABLE = 60

/** Informação fixa durante a decisão (não muda com as ações do turno). */
interface DecisionContext {
  readonly seat: SeatId
  readonly weights: BotWeights
  readonly outlook: RainOutlook
  /** Chuvas até a próxima vez deste voluntário (uma por assento). */
  readonly rainsUntilNextTurn: number
  readonly churchId: TileId
  readonly dockId: TileId
  /**
   * Prioridade extra de cada morador esperando, decidida no início da decisão (a partir da
   * posição inicial), para a avaliação não mudar de critério conforme o bot anda:
   * urgência, se outro voluntário de mãos livres chega antes e se ainda dá tempo de salvá-lo.
   */
  readonly residentPenalty: ReadonlyMap<string, number>
  readonly dangerCache: Map<string, Map<TileId, TileDanger>>
}

function dangersFor(state: GameState, ctx: DecisionContext): Map<TileId, TileDanger> {
  const key = sandbagKey(state)
  let dangers = ctx.dangerCache.get(key)
  if (!dangers) {
    dangers = tileDangers(state)
    ctx.dangerCache.set(key, dangers)
  }
  return dangers
}

function tileIdOfKind(state: GameState, kind: 'church' | 'dock'): TileId {
  const tile = state.tiles.find((t) => t.kind === kind)
  if (!tile) throw new Error(`O mapa não tem ${kind}`)
  return tile.id
}

function freeHands(v: Volunteer): boolean {
  return v.carrying.length === 0 && !v.skipNextTurn
}

function createContext(state: GameState, seat: SeatId, weights: BotWeights): DecisionContext {
  const me = findVolunteer(state, seat)
  if (!me) throw new Error(`Assento inexistente: ${seat}`)
  const myCosts = pathCosts(state, me, me.tileId)
  const outlook = rainOutlook(state)
  const rainsUntilNextTurn = state.volunteers.length
  const perTurn = state.config.rules.actionsPerTurn
  const dangerCache = new Map<string, Map<TileId, TileDanger>>()
  dangerCache.set(sandbagKey(state), tileDangers(state))
  const dangers = dangerCache.get(sandbagKey(state)) as Map<TileId, TileDanger>

  const others = state.volunteers.filter((v) => v.seat !== seat && freeHands(v))
  const otherCosts = others.map((v) => pathCosts(state, v, v.tileId))
  const residentPenalty = new Map<string, number>()
  for (const r of state.residents) {
    if (!isWaiting(r) || r.tileId === null) continue
    const mine = myCosts.get(r.tileId) ?? Infinity
    const submerge = dangers.get(r.tileId)?.submerge ?? Infinity
    let penalty: number
    if (mine === Infinity) {
      penalty = 12 // inalcançável agora: tratado como perdido
    } else {
      // Chuvas até chegar: uma por assento a cada turno completo deste voluntário.
      const turns = Math.ceil(Math.max(0, mine - me.actionsLeft) / perTurn)
      const arrival = state.riverLevel + projectedRise(outlook, turns * rainsUntilNextTurn)
      penalty = Math.min(4, Math.max(0, (submerge - arrival) / 4)) // os urgentes primeiro
      if (submerge <= arrival) penalty += 8 // provavelmente já perdido
    }
    const tile = r.tileId
    if (otherCosts.some((costs) => (costs.get(tile) ?? Infinity) < mine)) penalty += 3
    residentPenalty.set(r.id, penalty)
  }

  return {
    seat,
    weights,
    outlook,
    rainsUntilNextTurn,
    churchId: tileIdOfKind(state, 'church'),
    dockId: tileIdOfKind(state, 'dock'),
    residentPenalty,
    dangerCache,
  }
}

/** Pontuação do estado para o voluntário que tem a vez. Maior é melhor. */
function evaluate(state: GameState, ctx: DecisionContext): number {
  if (state.phase === 'won') return WON
  if (state.phase === 'lost') return LOST
  const me = findVolunteer(state, ctx.seat)
  if (!me) return LOST
  const w = ctx.weights
  const { goal } = state.config.settings
  const counts = countResidents(state)
  const dangers = dangersFor(state, ctx)
  const costs = pathCosts(state, me, me.tileId)
  const cost = (id: TileId) => costs.get(id) ?? UNREACHABLE
  const level = state.riverLevel

  let score = w.safe * counts.safe + w.carried * counts.carried
  // Ações extras dadas aos colegas pelo Chamado pelo rádio.
  for (const v of state.volunteers) score += w.bonusAction * v.bonusActions
  // Bônus por ter tirado de casa quem corria mais risco (a casa de origem mostra a urgência).
  for (const r of state.residents) {
    if (r.carriedBy === null) continue
    const slack = (dangers.get(r.homeTileId)?.submerge ?? Infinity) - level
    if (slack < w.urgencyHorizon) {
      score += Math.min(w.rescueUrgencyCap, w.rescueUrgency * (w.urgencyHorizon - slack))
    }
  }

  const goalSecured = counts.safe + counts.carried >= goal
  if (me.carrying.length > 0) {
    score -= w.distanceToChurch * cost(ctx.churchId)
  } else if (goalSecured) {
    score -= w.distanceToDock * cost(ctx.dockId)
  } else {
    score -= w.distanceToTarget * targetDistance(state, ctx, costs)
  }

  // Não terminar onde a água pode apanhar o voluntário antes da próxima vez dele.
  if (me.role !== 'boat-pilot') {
    const danger = dangers.get(me.tileId)
    const reach = level + projectedRise(ctx.outlook, ctx.rainsUntilNextTurn) + w.riskMargin
    if (danger && danger.submerge <= reach) {
      score -= w.swept + w.carried * me.carrying.length
    }
  }

  // Moradores esperando: folga até a casa submergir (saco de areia aumenta) e feridos (curar).
  const horizon = w.urgencyHorizon
  for (const r of state.residents) {
    if (!isWaiting(r) || r.tileId === null) continue
    const slack = (dangers.get(r.tileId)?.submerge ?? Infinity) - level
    if (slack < horizon) score -= w.urgency * (horizon - slack)
    if (r.status === 'injured') score -= w.injured
  }

  return score
}

/**
 * Distância até o melhor morador para resgatar, somada à prioridade decidida no início
 * (ver residentPenalty). Sem morador esperando, não há alvo.
 */
function targetDistance(
  state: GameState,
  ctx: DecisionContext,
  costs: Map<TileId, number>,
): number {
  let best = Infinity
  for (const r of state.residents) {
    if (!isWaiting(r) || r.tileId === null) continue
    const distance = costs.get(r.tileId) ?? UNREACHABLE
    best = Math.min(best, distance + (ctx.residentPenalty.get(r.id) ?? 0))
  }
  return best === Infinity ? 0 : best
}

/** Ações candidatas para a busca (sem desfazer, alerta e fim de turno). */
function candidates(state: GameState, me: Volunteer): Action[] {
  const actions: Action[] = []
  for (const to of adjacentTileIds(state, me.tileId, me.role === 'neighbor')) {
    actions.push({ type: 'move', to })
  }
  for (const r of state.residents) {
    if (r.tileId === me.tileId && isWaiting(r)) actions.push({ type: 'pick-up', residentId: r.id })
  }
  if (me.role === 'medic') {
    const near = new Set([me.tileId, ...adjacentTileIds(state, me.tileId, false)])
    for (const r of state.residents) {
      if (r.status === 'injured' && r.tileId !== null && near.has(r.tileId)) {
        actions.push({ type: 'heal', residentId: r.id })
      }
    }
  }
  if (me.role === 'radio-host' && !state.radioCalled) actions.push({ type: 'radio-call' })
  // Saco de areia só onde faz diferença: casas com morador esperando ou a quadra do voluntário.
  const reach =
    me.role === 'engineer' ? [me.tileId, ...adjacentTileIds(state, me.tileId, false)] : [me.tileId]
  for (const id of reach) {
    const tile = findTile(state, id)
    if (!tile || tile.kind === 'church' || tile.kind === 'dock') continue
    const housesWaiting = state.residents.some((r) => r.tileId === id && isWaiting(r))
    if (housesWaiting || id === me.tileId) actions.push({ type: 'reinforce', tileId: id })
  }
  return actions
}

/** Chave do estado dentro do turno, para não avaliar duas vezes o mesmo resultado. */
function stateKey(state: GameState, me: Volunteer): string {
  let residents = ''
  for (const r of state.residents) residents += r.status[0] + (r.carriedBy === null ? '' : '*')
  return `${me.tileId}|${me.actionsLeft}|${me.carrying.join(',')}|${residents}|${sandbagKey(state)}`
}

export interface Plan {
  /** Sequência escolhida (pode ser vazia: encerrar o turno). */
  readonly actions: readonly Action[]
  readonly score: number
}

/** Melhor sequência de até `actionsLeft` ações para quem tem a vez. */
export function plan(state: GameState, seat: SeatId, weights: BotWeights = defaultWeights): Plan {
  if (state.phase !== 'playing') return { actions: [], score: 0 }
  if (state.activeSeat !== seat) throw new Error(`Não é a vez de ${seat}`)
  const ctx = createContext(state, seat, weights)
  const visited = new Set<string>()
  let best: Plan = { actions: [], score: evaluate(state, ctx) }

  const explore = (current: GameState, path: Action[]) => {
    const me = findVolunteer(current, seat)
    // Até 3 ações por decisão (spec, seção 8). Ações sem custo (curar) valem mesmo sem ações.
    if (!me || path.length >= MAX_DEPTH) return
    for (const action of candidates(current, me)) {
      const result = transition(current, action, { seat })
      if (!result.ok) continue
      const next = result.state
      const nextMe = findVolunteer(next, seat)
      if (!nextMe) continue
      const key = stateKey(next, nextMe)
      if (visited.has(key)) continue
      visited.add(key)
      const nextPath = [...path, action]
      const score = evaluate(next, ctx)
      // Em caso de empate, a sequência mais curta (ex.: vencer já, e não daqui a 3 ações).
      const better =
        score > best.score + 1e-9 ||
        (Math.abs(score - best.score) <= 1e-9 && nextPath.length < best.actions.length)
      if (better) best = { actions: nextPath, score }
      if (next.phase === 'playing') explore(next, nextPath)
    }
  }
  explore(state, [])
  return best
}

/** Pontuação de um estado do ponto de vista de quem tem a vez (testes e depuração). */
export function scoreState(
  state: GameState,
  seat: SeatId,
  weights: BotWeights = defaultWeights,
  reference: GameState = state,
): number {
  return evaluate(state, createContext(reference, seat, weights))
}

/** Próxima ação do bot (kit: GameDefinition.botMove). */
export function botMove(state: GameState, seat: SeatId, weights?: BotWeights): Action {
  return plan(state, seat, weights).actions[0] ?? { type: 'end-turn' }
}

/** Sugestão para o jogador (botão "Dica"): a mesma lógica do bot, com a sequência inteira. */
export function suggest(state: GameState, seat: SeatId, weights?: BotWeights): Plan {
  return plan(state, seat, weights)
}

// Utilidades só para testes (não exportadas pelo pacote).
// Nomes fictícios, como pede o CLAUDE.md.
import {
  carryCapacity,
  countResidents,
  houseMark,
  newGame,
  transition,
  waterModelFor,
} from './game.ts'
import type { Difficulty, RainCardKind, RoleId, TileId } from './schema.ts'
import type { Action, GameState, Resident, SeatId, Volunteer } from './types.ts'

export const names = ['ana', 'bruno', 'carla', 'diego'] as const

/** Cria uma partida com os papéis dados, nos assentos ana, bruno, carla e diego. */
export function setup(
  roles: RoleId[] = ['firefighter', 'medic'],
  difficulty: Difficulty = 'normal',
  seed = 42,
): GameState {
  return newGame({
    difficulty,
    seed,
    seats: roles.map((role, i) => ({ seat: names[i] ?? `seat-${i}`, role })),
  })
}

/** Aplica a ação e exige que seja aceita. */
export function act(state: GameState, action: Action, seat: SeatId = state.activeSeat): GameState {
  const result = transition(state, action, { seat })
  if (!result.ok) throw new Error(`Ação recusada (${result.reason}): ${JSON.stringify(action)}`)
  return result.state
}

export function patchVolunteer(
  state: GameState,
  seat: SeatId,
  patch: Partial<Volunteer>,
): GameState {
  return {
    ...state,
    volunteers: state.volunteers.map((v) => (v.seat === seat ? { ...v, ...patch } : v)),
  }
}

export function patchResident(state: GameState, id: string, patch: Partial<Resident>): GameState {
  return {
    ...state,
    residents: state.residents.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  }
}

/** Põe o morador no colo do voluntário (para montar cenários). */
export function carry(state: GameState, seat: SeatId, residentId: string): GameState {
  const volunteer = state.volunteers.find((v) => v.seat === seat)
  if (!volunteer) throw new Error(`Assento inexistente: ${seat}`)
  return patchResident(
    patchVolunteer(state, seat, { carrying: [...volunteer.carrying, residentId] }),
    residentId,
    { tileId: null, carriedBy: seat },
  )
}

/** Marca todos os moradores como salvos na igreja, exceto os listados. */
export function saveAllExcept(state: GameState, keep: string[] = []): GameState {
  const church = state.tiles.find((t) => t.kind === 'church')?.id ?? 'D3'
  return {
    ...state,
    residents: state.residents.map((r) =>
      keep.includes(r.id) ? r : { ...r, tileId: church, carriedBy: null, status: 'safe' as const },
    ),
  }
}

/** Define o nível e recalcula a água das quadras, sem mexer nos moradores (montagem de cenário). */
export function atLevel(state: GameState, level: number): GameState {
  const next = { ...state, riverLevel: level }
  return { ...next, tiles: waterModelFor(next.config).recompute(next.tiles, level) }
}

/** Define as próximas cartas de chuva (topo primeiro). */
export function withDeck(
  state: GameState,
  deck: RainCardKind[],
  discard: RainCardKind[] = [],
): GameState {
  return { ...state, rainDeck: deck, rainDiscard: discard }
}

export function water(state: GameState, id: TileId) {
  return state.tiles.find((t) => t.id === id)?.water
}

export function resident(state: GameState, id: string): Resident {
  const found = state.residents.find((r) => r.id === id)
  if (!found) throw new Error(`Morador inexistente: ${id}`)
  return found
}

export function volunteer(state: GameState, seat: SeatId): Volunteer {
  const found = state.volunteers.find((v) => v.seat === seat)
  if (!found) throw new Error(`Assento inexistente: ${seat}`)
  return found
}

/** Congela o objeto em profundidade: qualquer mutação lança erro (módulos ES rodam em modo estrito). */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key])
  }
  return value
}

/** Verifica as invariantes do estado. Devolve a lista de problemas (vazia se estiver tudo certo). */
export function checkInvariants(state: GameState, expectedResidents?: number): string[] {
  const problems: string[] = []
  const { rules, settings } = state.config
  const church = state.tiles.find((t) => t.kind === 'church')?.id

  // Conservação de moradores: cada um está em exatamente uma situação.
  const counts = countResidents(state)
  if (counts.waiting + counts.carried + counts.safe + counts.stranded !== counts.total) {
    problems.push('soma das situações dos moradores diferente do total')
  }
  if (expectedResidents !== undefined && counts.total !== expectedResidents) {
    problems.push(`total de moradores mudou: ${counts.total}`)
  }
  for (const r of state.residents) {
    if (r.status === 'safe' && (r.tileId !== church || r.carriedBy !== null)) {
      problems.push(`${r.id}: salvo fora da igreja`)
    }
    if (r.status === 'stranded' && (r.tileId !== null || r.carriedBy !== null)) {
      problems.push(`${r.id}: ilhado com posição`)
    }
    if (r.status === 'healthy' || r.status === 'injured') {
      const onTile = r.tileId !== null && r.carriedBy === null
      const carried = r.tileId === null && r.carriedBy !== null
      if (onTile === carried) problems.push(`${r.id}: deve estar na quadra ou carregado`)
      if (onTile && r.tileId !== r.homeTileId) problems.push(`${r.id}: esperando fora de casa`)
      if (carried) {
        const carrier = state.volunteers.find((v) => v.seat === r.carriedBy)
        if (!carrier?.carrying.includes(r.id)) problems.push(`${r.id}: carregador não o tem`)
      }
    }
  }

  for (const v of state.volunteers) {
    if (v.carrying.length > carryCapacity(state, v)) problems.push(`${v.seat}: carrega demais`)
    for (const id of v.carrying) {
      const r = state.residents.find((x) => x.id === id)
      if (r?.carriedBy !== v.seat) problems.push(`${v.seat}: carrega ${id}, que não é dele`)
    }
    if (v.actionsLeft < 0 || v.actionsLeft > rules.actionsPerTurn) {
      problems.push(`${v.seat}: ações fora da faixa`)
    }
    if (v.seat !== state.activeSeat && v.actionsLeft !== 0) {
      problems.push(`${v.seat}: tem ações fora da sua vez`)
    }
    const tile = state.tiles.find((t) => t.id === v.tileId)
    if (!tile) problems.push(`${v.seat}: em quadra inexistente`)
    else if (tile.water === 'submerged' && v.role !== 'boat-pilot') {
      problems.push(`${v.seat}: em quadra submersa sem ser a Barqueira`)
    }
  }

  // A água guardada é a que o modelo calcula (recompute idempotente).
  const recomputed = waterModelFor(state.config).recompute(state.tiles, state.riverLevel)
  if (recomputed.some((t, i) => t.water !== state.tiles[i]?.water)) {
    problems.push('água das quadras diferente do recálculo')
  }

  const deckSize =
    settings.deck.cloudy + settings.deck.drizzle + settings.deck.rain + settings.deck.storm
  if (state.rainDeck.length + state.rainDiscard.length !== deckSize) {
    problems.push('baralho de chuva perdeu ou ganhou cartas')
  }
  if (state.rainDeck.length === 0) problems.push('baralho de chuva vazio entre turnos')
  if (state.riverLevel < settings.startLevel) problems.push('nível abaixo do inicial')
  if (state.phase !== 'playing' && state.turnHistory.length > 0) {
    problems.push('histórico de desfazer depois do fim da partida')
  }

  for (const tile of state.tiles) {
    if (tile.kind !== 'house') continue
    const waiting = state.residents.some(
      (r) => r.tileId === tile.id && r.carriedBy === null && r.status !== 'safe',
    )
    if (waiting && houseMark(state, tile.id) !== null)
      problems.push(`${tile.id}: marca com morador`)
  }
  return problems
}

/** Dá a vez ao assento, com todas as ações (montagem de cenário). */
export function activate(state: GameState, seat: SeatId): GameState {
  return {
    ...state,
    activeSeat: seat,
    volunteers: state.volunteers.map((v) => ({
      ...v,
      actionsLeft: v.seat === seat ? state.config.rules.actionsPerTurn : 0,
    })),
  }
}

/** Troca um parâmetro de papel só nesta partida (a config vive no estado). */
export function withRoleParams(
  state: GameState,
  patch: Partial<GameState['config']['rules']['roleParams']>,
): GameState {
  const rules = state.config.rules
  return {
    ...state,
    config: { ...state.config, rules: { ...rules, roleParams: { ...rules.roleParams, ...patch } } },
  }
}

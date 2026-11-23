// Modelos de apresentação: transformam o estado do motor em dados para desenhar.
// A interface nunca calcula regra: custos e ações possíveis vêm do próprio motor
// (transition aplicada numa cópia, reachableMoves, houseMark, forecastView).
import {
  countResidents,
  findTile,
  findVolunteer,
  forecastView,
  houseMark,
  isWaiting,
  reachableMoves,
  transition,
  type Action,
  type GameEvent,
  type GameState,
  type HouseMark,
  type RoleId,
  type SeatId,
  type TileId,
  type TileKind,
  type WaterState,
} from '@village-flood/engine'
import { t, type Locale, type MessageKey } from '../i18n.ts'

/** Assento como a interface conhece: apelido, papel, bot ou pessoa e cor do peão. */
export interface SeatInfo {
  readonly seat: SeatId
  readonly name: string
  readonly role: RoleId
  readonly bot: boolean
  readonly color: string
  /** Online: presença do assento (o bot pode estar no lugar de quem caiu). */
  readonly presence?: 'connected' | 'away' | 'bot' | 'returning'
  /** Online: este aparelho. */
  readonly you?: boolean
}

export const seatColors = ['#B39DDB', '#4FC3F7', '#FF8A65', '#81C784'] as const

/** Inicial do peão; bots da sala online ("Bot 1", "Bot 2") viram "B1", "B2" para não repetir. */
export function initialOf(name: string): string {
  const bot = /^bot (\d)$/i.exec(name.trim())
  if (bot) return `B${bot[1]}`
  return (name.trim()[0] ?? '?').toUpperCase()
}

export function seatName(seats: readonly SeatInfo[], seat: SeatId): string {
  return seats.find((s) => s.seat === seat)?.name ?? seat
}

export function costLabel(locale: Locale, cost: number): string {
  if (cost === 0) return t(locale, 'action.cost0')
  if (cost === 1) return t(locale, 'action.cost1')
  return t(locale, 'action.costN', { n: cost })
}

// ---------- Quadras ----------

export interface PawnView {
  readonly seat: SeatId
  readonly initial: string
  readonly color: string
  readonly active: boolean
  readonly carrying: number
}

export interface TilePing {
  readonly initial: string
  readonly color: string
  readonly kind: string
}

export interface TileView {
  readonly id: TileId
  readonly height: number
  readonly kind: TileKind
  readonly water: WaterState
  readonly sandbags: number
  readonly waiting: number
  readonly injured: number
  readonly mark: HouseMark | null
  readonly pawns: readonly PawnView[]
  /** Custo para o voluntário da vez andar até a quadra (null: não alcança num passo). */
  readonly cost: number | null
  /** Sugestões de outros jogadores nesta quadra (online). */
  readonly pings: readonly TilePing[]
  readonly selected: boolean
  readonly suggested: boolean
  readonly aria: string
}

export interface TileViewOptions {
  readonly seats: readonly SeatInfo[]
  readonly selected: TileId | null
  readonly suggested: TileId | null
  readonly showReach: boolean
  readonly locale: Locale
  readonly pings?: readonly { seat: SeatId; target: string; kind: string }[]
}

export function tileViews(state: GameState, options: TileViewOptions): TileView[] {
  const { locale } = options
  const reach = new Map<TileId, number>()
  if (options.showReach && state.phase === 'playing') {
    for (const move of reachableMoves(state, state.activeSeat)) reach.set(move.to, move.cost)
  }
  return state.tiles.map((tile) => {
    const waitingResidents = state.residents.filter((r) => r.tileId === tile.id && isWaiting(r))
    const injured = waitingResidents.filter((r) => r.status === 'injured').length
    const mark = houseMark(state, tile.id)
    const pawns = state.volunteers
      .filter((v) => v.tileId === tile.id)
      .map((v) => {
        const info = options.seats.find((s) => s.seat === v.seat)
        return {
          seat: v.seat,
          initial: initialOf(info?.name ?? v.seat),
          color: info?.color ?? '#C9D8E3',
          active: state.phase === 'playing' && v.seat === state.activeSeat,
          carrying: v.carrying.length,
        }
      })
    const cost = reach.get(tile.id) ?? null
    const pings = (options.pings ?? [])
      .filter((p) => p.target === tile.id)
      .map((p) => {
        const info = options.seats.find((s) => s.seat === p.seat)
        return {
          initial: initialOf(info?.name ?? '?'),
          color: info?.color ?? '#C9D8E3',
          kind: p.kind,
        }
      })

    const parts = [
      t(locale, 'tile.aria', {
        id: tile.id,
        h: tile.height,
        water: t(locale, `tile.water.${tile.water}` as MessageKey),
      }),
    ]
    if (tile.kind === 'church') parts.push(t(locale, 'tile.church'))
    if (tile.kind === 'dock') parts.push(t(locale, 'tile.dock'))
    if (tile.kind === 'house') parts.push(t(locale, 'tile.house'))
    if (waitingResidents.length > 0) {
      parts.push(t(locale, 'tile.residents', { n: waitingResidents.length }))
    }
    if (injured > 0) parts.push(t(locale, 'tile.injured', { n: injured }))
    if (mark === 'cleared') parts.push(t(locale, 'tile.cleared'))
    if (mark === 'lost') parts.push(t(locale, 'tile.lost'))
    if (tile.sandbags > 0) parts.push(t(locale, 'tile.sandbags', { n: tile.sandbags }))
    if (pawns.length > 0) {
      parts.push(
        t(locale, 'tile.volunteers', {
          names: pawns.map((p) => seatName(options.seats, p.seat)).join(', '),
        }),
      )
    }
    if (cost !== null) parts.push(t(locale, 'tile.reachable', { n: cost }))
    for (const p of options.pings ?? []) {
      if (p.target !== tile.id) continue
      parts.push(
        t(locale, 'tile.ping', {
          name: seatName(options.seats, p.seat),
          kind: t(locale, `ping.${p.kind}` as MessageKey),
        }),
      )
    }
    if (options.selected === tile.id) parts.push(t(locale, 'tile.selected'))
    if (options.suggested === tile.id) parts.push(t(locale, 'tile.suggested'))

    return {
      id: tile.id,
      height: tile.height,
      kind: tile.kind,
      water: tile.water,
      sandbags: tile.sandbags,
      waiting: waitingResidents.length,
      injured,
      mark,
      pawns,
      cost,
      pings,
      selected: options.selected === tile.id,
      suggested: options.suggested === tile.id,
      aria: parts.join(', '),
    }
  })
}

/** Título e texto da quadra selecionada. */
export function tileInfo(state: GameState, tileId: TileId, locale: Locale) {
  const tile = findTile(state, tileId)
  if (!tile) return null
  const header = [
    tile.id,
    t(locale, 'tile.heightUpper', { h: tile.height }),
    t(locale, `tile.waterUpper.${tile.water}` as MessageKey),
  ].join(' · ')
  const waiting = state.residents.filter((r) => r.tileId === tile.id && isWaiting(r))
  const injured = waiting.filter((r) => r.status === 'injured').length
  let title: string
  let text = ''
  if (tile.kind === 'church') {
    title = t(locale, 'info.churchTitle')
    text = t(locale, 'info.churchText')
  } else if (tile.kind === 'dock') {
    title = t(locale, 'info.dockTitle')
    text = t(locale, 'info.dockText')
  } else if (tile.kind === 'house') {
    const mark = houseMark(state, tile.id)
    if (mark === 'cleared') title = t(locale, 'info.houseCleared')
    else if (mark === 'lost') title = t(locale, 'info.houseLost')
    else if (injured > 0) title = t(locale, 'info.houseInjured', { n: waiting.length, injured })
    else title = t(locale, 'info.houseWaiting', { n: waiting.length })
  } else {
    title = t(locale, 'info.plain')
  }
  if (tile.sandbags > 0) {
    text = [text, t(locale, 'tile.sandbags', { n: tile.sandbags })].filter(Boolean).join(' ')
  }
  return { header, title, text }
}

// ---------- Ações ----------

export interface ActionOption {
  readonly action: Action
  readonly label: string
  readonly cost: number
}

/** Custo de uma ação para quem tem a vez, medido pelo próprio motor. Null se for recusada. */
export function previewCost(state: GameState, action: Action): number | null {
  const before = findVolunteer(state, state.activeSeat)
  const result = transition(state, action, { seat: state.activeSeat })
  if (!result.ok || !before) return null
  const after = findVolunteer(result.state, state.activeSeat)
  return before.actionsLeft - (after?.actionsLeft ?? 0)
}

function option(state: GameState, action: Action, label: (cost: string) => string, locale: Locale) {
  const cost = previewCost(state, action)
  return cost === null ? null : { action, cost, label: label(costLabel(locale, cost)) }
}

/** Ações do voluntário da vez sobre a quadra escolhida (andar, pegar, curar, saco de areia). */
export function tileActions(state: GameState, tileId: TileId, locale: Locale): ActionOption[] {
  if (state.phase !== 'playing') return []
  const me = findVolunteer(state, state.activeSeat)
  if (!me) return []
  const result: (ActionOption | null)[] = []
  if (me.tileId !== tileId) {
    result.push(
      option(
        state,
        { type: 'move', to: tileId },
        (cost) => t(locale, 'action.move', { tile: tileId, cost }),
        locale,
      ),
    )
  }
  const waiting = state.residents.filter((r) => r.tileId === tileId && isWaiting(r))
  const firstInjured = waiting.find((r) => r.status === 'injured')
  const firstHealthy = waiting.find((r) => r.status === 'healthy')
  if (firstHealthy) {
    result.push(
      option(
        state,
        { type: 'pick-up', residentId: firstHealthy.id },
        (cost) => t(locale, 'action.pickUp', { cost }),
        locale,
      ),
    )
  }
  if (firstInjured) {
    result.push(
      option(
        state,
        { type: 'pick-up', residentId: firstInjured.id },
        (cost) => t(locale, 'action.pickUpInjured', { cost }),
        locale,
      ),
      option(
        state,
        { type: 'heal', residentId: firstInjured.id },
        (cost) => t(locale, 'action.heal', { cost }),
        locale,
      ),
    )
  }
  result.push(
    option(
      state,
      { type: 'reinforce', tileId },
      (cost) => t(locale, 'action.reinforce', { cost }),
      locale,
    ),
  )
  return result.filter((o): o is ActionOption => o !== null)
}

/** Ações que não dependem de quadra: Alerta de temporal e Chamado pelo rádio. */
export function globalActions(state: GameState, locale: Locale): ActionOption[] {
  if (state.phase !== 'playing') return []
  return [
    option(state, { type: 'forecast' }, (cost) => t(locale, 'action.forecast', { cost }), locale),
    option(
      state,
      { type: 'radio-call' },
      (cost) => t(locale, 'action.radioCall', { cost }),
      locale,
    ),
  ].filter((o): o is ActionOption => o !== null)
}

/** Texto curto de uma ação (passos da dica). */
export function describeAction(state: GameState, action: Action, locale: Locale): string {
  const cost = previewCost(state, action) ?? 0
  const c = costLabel(locale, cost)
  switch (action.type) {
    case 'move':
      return t(locale, 'action.move', { tile: action.to, cost: c })
    case 'pick-up': {
      const r = state.residents.find((x) => x.id === action.residentId)
      return t(locale, r?.status === 'injured' ? 'action.pickUpInjured' : 'action.pickUp', {
        cost: c,
      })
    }
    case 'heal':
      return t(locale, 'action.heal', { cost: c })
    case 'reinforce':
      return `${t(locale, 'action.reinforce', { cost: c })} · ${action.tileId}`
    case 'forecast':
      return t(locale, 'action.forecast', { cost: c })
    case 'radio-call':
      return t(locale, 'action.radioCall', { cost: c })
    case 'undo':
      return t(locale, 'action.undo')
    case 'end-turn':
      return t(locale, 'action.endTurnLong')
  }
}

/** Quadra ligada a uma ação (para destacar a dica no tabuleiro). */
export function actionTile(state: GameState, action: Action): TileId | null {
  switch (action.type) {
    case 'move':
      return action.to
    case 'reinforce':
      return action.tileId
    case 'pick-up':
    case 'heal':
      return state.residents.find((r) => r.id === action.residentId)?.tileId ?? null
    default:
      return findVolunteer(state, state.activeSeat)?.tileId ?? null
  }
}

// ---------- Painéis ----------

export function residentSummary(state: GameState) {
  const counts = countResidents(state)
  return {
    ...counts,
    goal: state.config.settings.goal,
    strandedLimit: state.config.rules.strandedLossCount,
  }
}

/** Limiares por altura para a barra do nível do rio (só os que cabem até o nível máximo). */
export function riverMarks(state: GameState) {
  const { thresholds } = state.config.rules.water
  const max = state.config.rules.maxRiverLevel
  const marks = new Set<number>()
  for (const h of [1, 2, 3] as const) {
    if (thresholds[h].flood < max) marks.add(thresholds[h].flood)
    if (thresholds[h].submerge < max) marks.add(thresholds[h].submerge)
  }
  return { level: state.riverLevel, max, marks: [...marks].sort((a, b) => a - b) }
}

export function riverText(state: GameState, locale: Locale): string {
  const { thresholds } = state.config.rules.water
  const max = state.config.rules.maxRiverLevel
  const lines = ([1, 2, 3] as const).map((h) =>
    thresholds[h].submerge < max
      ? t(locale, 'river.height', {
          h,
          flood: thresholds[h].flood,
          submerge: thresholds[h].submerge,
        })
      : t(locale, 'river.heightFloodOnly', { h, flood: thresholds[h].flood }),
  )
  return [...lines, t(locale, 'river.lose', { max })].join(' ')
}

/** Previsão para mostrar (null: sem Radialista). */
export function forecastLines(state: GameState, seats: readonly SeatInfo[], locale: Locale) {
  const view = forecastView(state)
  if (!view) return null
  const host = state.volunteers.find((v) => v.role === 'radio-host')
  const name = host ? seatName(seats, host.seat) : ''
  const rises = state.config.rules.rainCards
  const cardName = (card: keyof typeof rises) => t(locale, `card.${card}` as MessageKey)
  if (view.kind === 'peek') {
    const first = view.cards[0]
    if (!first) return { name, main: '', detail: '' }
    const main =
      view.cards.length === 1
        ? t(locale, 'forecast.next', { card: cardName(first), rise: rises[first] })
        : t(locale, 'forecast.nextTwo', {
            cards: view.cards.map((c) => `${cardName(c)} (+${rises[c]})`).join(', '),
          })
    const total = view.cards.reduce((sum, c) => sum + rises[c], 0)
    return {
      name,
      main,
      detail: t(locale, 'forecast.levelGoes', {
        from: state.riverLevel,
        to: state.riverLevel + total,
      }),
    }
  }
  const main =
    view.result === null
      ? t(locale, 'forecast.stormUnknown', { cost: view.cost })
      : view.result
        ? t(locale, 'forecast.stormYes')
        : t(locale, 'forecast.stormNo')
  return { name, main, detail: '' }
}

// ---------- Eventos ----------

/** Frases curtas dos eventos de uma ação, para o anúncio em aria-live e o aviso na tela. */
export function eventMessages(
  events: readonly GameEvent[],
  seats: readonly SeatInfo[],
  state: GameState,
  locale: Locale,
): { messages: string[]; alerts: string[] } {
  const name = (seat: SeatId) => seatName(seats, seat)
  const messages: string[] = []
  const alerts: string[] = []
  const count = (type: GameEvent['type']) => events.filter((e) => e.type === type).length
  let tilesCounted = false
  for (const e of events) {
    switch (e.type) {
      case 'moved':
        messages.push(t(locale, 'event.moved', { name: name(e.seat), to: e.to }))
        break
      case 'picked-up':
        messages.push(t(locale, 'event.pickedUp', { name: name(e.seat), tile: e.tileId }))
        break
      case 'delivered':
        messages.push(t(locale, 'event.delivered', { name: name(e.seat), n: e.residentIds.length }))
        break
      case 'healed':
        messages.push(t(locale, 'event.healed', { name: name(e.seat) }))
        break
      case 'sandbag-placed':
        messages.push(t(locale, 'event.sandbag', { name: name(e.seat), tile: e.tileId }))
        break
      case 'forecast-revealed':
        messages.push(
          t(locale, e.stormComing ? 'event.forecastYes' : 'event.forecastNo', {
            name: name(e.seat),
          }),
        )
        break
      case 'radio-called':
        messages.push(
          t(locale, 'event.radioCalled', {
            name: name(e.seat),
            target: name(e.target),
            n: e.bonus,
          }),
        )
        break
      case 'action-undone':
        messages.push(t(locale, 'event.undone'))
        break
      case 'rain-drawn':
        messages.push(
          t(locale, 'event.rain', {
            card: t(locale, `card.${e.card}` as MessageKey),
            rise: e.rise,
            level: state.riverLevel,
          }),
        )
        break
      case 'tile-flooded':
      case 'tile-submerged':
      case 'resident-injured':
        if (!tilesCounted) {
          tilesCounted = true
          const flooded = count('tile-flooded')
          const submerged = count('tile-submerged')
          const injured = count('resident-injured')
          if (flooded) messages.push(t(locale, 'event.flooded', { n: flooded }))
          if (submerged) messages.push(t(locale, 'event.submerged', { n: submerged }))
          if (injured) messages.push(t(locale, 'event.injured', { n: injured }))
        }
        break
      case 'resident-stranded':
        break
      case 'volunteer-swept': {
        const text = t(locale, 'event.swept', { name: name(e.seat) })
        alerts.push(
          e.strandedResidentIds.length > 0
            ? `${text} ${t(locale, 'event.sweptLost', { n: e.strandedResidentIds.length })}`
            : text,
        )
        break
      }
      case 'turn-skipped':
        messages.push(t(locale, 'event.skipped', { name: name(e.seat) }))
        break
      case 'turn-started':
        messages.push(t(locale, 'event.turnStarted', { name: name(e.seat) }))
        break
      case 'won':
        messages.push(t(locale, 'event.won'))
        break
      case 'lost':
        messages.push(t(locale, 'event.lost'))
        break
      case 'turn-ended':
      case 'level-rose':
      case 'tile-dried':
        break
    }
  }
  const stranded = events.filter(
    (e) => e.type === 'resident-stranded' && e.cause === 'water',
  ).length
  if (stranded > 0) messages.push(t(locale, 'event.stranded', { n: stranded }))
  // Meta alcançada nesta jogada: lembra que ainda falta levar todos ao cais (a vitória exige as
  // duas coisas). Só avisa na jogada que cruza a meta, e não se a partida já acabou.
  const delivered = events.reduce(
    (n, e) => n + (e.type === 'delivered' ? e.residentIds.length : 0),
    0,
  )
  if (delivered > 0 && state.phase === 'playing') {
    const goal = state.config.settings.goal
    const safe = countResidents(state).safe
    if (safe >= goal && safe - delivered < goal) alerts.push(t(locale, 'event.goalReached'))
  }
  return { messages, alerts }
}

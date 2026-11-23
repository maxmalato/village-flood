// Resumo da partida em texto, para colar no roteiro das partidas de teste
// (docs/playtests/README.md). Sem nomes: só papéis, números e o resultado.
import { countResidents, type GameState, type SeatId } from '@village-flood/engine'
import { t, type Locale, type MessageKey } from '../i18n.ts'
import type { GameMode, SeatStats } from './controller.ts'
import type { SeatInfo } from './view.ts'

export interface SummaryInput {
  readonly state: GameState
  readonly seats: readonly SeatInfo[]
  readonly stats: Readonly<Record<SeatId, SeatStats>>
  readonly mode: GameMode
  /** Duração em ms, ou null se este aparelho não viu a partida desde o começo. */
  readonly durationMs: number | null
}

/** Pessoa ou bot: no online, quem caiu e tem um bot no lugar continua contando como pessoa. */
const isPerson = (seat: SeatInfo) => seat.presence !== undefined || !seat.bot

export function gameSummary(input: SummaryInput, locale: Locale): string {
  const { state, seats, stats, mode, durationMs } = input
  const counts = countResidents(state)
  const people = seats.filter(isPerson).length
  const bots = seats.length - people
  const roles = seats
    .map((s) => {
      const role = t(locale, `role.${s.role}` as MessageKey)
      return isPerson(s) ? role : `${role} (${t(locale, 'summary.bot')})`
    })
    .join(', ')
  const won = state.phase === 'won'
  const result = t(locale, won ? 'summary.won' : 'summary.lost')
  const reason = won
    ? '—'
    : t(locale, `summary.reason.${state.lossReason ?? 'stranded'}` as MessageKey)
  const swept = Object.values(stats).reduce((n, s) => n + (s.swept ?? 0), 0)
  const sweptText =
    swept > 0 ? t(locale, 'summary.sweptYes', { n: swept }) : t(locale, 'summary.no')
  const duration =
    durationMs === null
      ? t(locale, 'summary.unknown')
      : t(locale, 'summary.minutes', { n: Math.max(1, Math.round(durationMs / 60_000)) })
  const modeText = t(locale, `summary.mode.${mode}` as MessageKey)
  const difficulty = t(locale, `difficulty.${state.config.difficulty}` as MessageKey)
  const row = [
    '',
    modeText,
    difficulty,
    `${people} + ${bots}`,
    roles,
    result,
    reason,
    state.turn,
    counts.safe,
    counts.stranded,
    sweptText,
  ].join(' | ')

  return [
    t(locale, 'summary.title'),
    t(locale, 'summary.setup', { mode: modeText, difficulty, people, bots }),
    t(locale, 'summary.roles', { roles }),
    t(locale, 'summary.result', {
      result: won ? result : `${result} (${reason})`,
      turn: state.turn,
      safe: counts.safe,
      goal: state.config.settings.goal,
      stranded: counts.stranded,
    }),
    t(locale, 'summary.extra', { swept: sweptText, duration }),
    '',
    t(locale, 'summary.row'),
    `|${row} |`,
  ].join('\n')
}

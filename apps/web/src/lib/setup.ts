// Configuração da partida local, montada no lobby.
import { roleIds, type Difficulty, type RoleId } from '@village-flood/engine'

export interface SeatSetup {
  name: string
  role: RoleId
  bot: boolean
}

export interface LocalSetup {
  difficulty: Difficulty
  seats: SeatSetup[]
}

export const MIN_SEATS = 2
export const MAX_SEATS = 4

/** Nomes fictícios sugeridos (CLAUDE.md). */
const defaultNames = ['Ana', 'Bruno', 'Carla', 'Diego'] as const
const defaultRoles: RoleId[] = ['firefighter', 'boat-pilot', 'engineer', 'medic']

export function defaultSetup(): LocalSetup {
  return {
    difficulty: 'normal',
    seats: [0, 1, 2].map((i) => ({
      name: defaultNames[i] ?? `Voluntário ${i + 1}`,
      role: defaultRoles[i] ?? 'neighbor',
      bot: i > 0,
    })),
  }
}

/** Primeiro papel ainda livre. */
export function freeRole(seats: readonly SeatSetup[]): RoleId {
  return roleIds.find((role) => !seats.some((s) => s.role === role)) ?? 'neighbor'
}

export function addSeat(setup: LocalSetup): LocalSetup {
  if (setup.seats.length >= MAX_SEATS) return setup
  const i = setup.seats.length
  return {
    ...setup,
    seats: [
      ...setup.seats,
      { name: defaultNames[i] ?? `Voluntário ${i + 1}`, role: freeRole(setup.seats), bot: true },
    ],
  }
}

export function removeSeat(setup: LocalSetup, index: number): LocalSetup {
  if (setup.seats.length <= MIN_SEATS) return setup
  return { ...setup, seats: setup.seats.filter((_, i) => i !== index) }
}

export type SetupError = 'errorHuman' | 'errorRoles' | 'errorNames'

/** Problemas da configuração (vazio: pode começar). O motor valida de novo ao criar a partida. */
export function validateSetup(setup: LocalSetup): SetupError[] {
  const errors: SetupError[] = []
  if (!setup.seats.some((s) => !s.bot)) errors.push('errorHuman')
  if (new Set(setup.seats.map((s) => s.role)).size !== setup.seats.length) errors.push('errorRoles')
  if (setup.seats.some((s) => s.name.trim() === '')) errors.push('errorNames')
  return errors
}

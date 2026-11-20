// Composições de equipe e sementes reprodutíveis.
import { roleIds, type RoleId } from '@village-flood/engine'

/** Todas as combinações de `size` papéis diferentes, em ordem estável. */
export function compositions(size: number, roles: readonly RoleId[] = roleIds): RoleId[][] {
  const result: RoleId[][] = []
  const pick = (start: number, current: RoleId[]) => {
    if (current.length === size) {
      result.push([...current])
      return
    }
    for (let i = start; i < roles.length; i++) {
      const role = roles[i]
      if (role) pick(i + 1, [...current, role])
    }
  }
  pick(0, [])
  return result
}

/** Ordem dos assentos girada pelo número da partida, para não favorecer um papel. */
export function rotate<T>(items: readonly T[], by: number): T[] {
  if (items.length === 0) return []
  const k = by % items.length
  return [...items.slice(k), ...items.slice(0, k)]
}

/** Semente estável a partir de um texto (FNV-1a de 32 bits). */
export function seedFrom(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

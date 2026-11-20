// Monta a lista de partidas da simulação.
import type { Difficulty, RoleId } from '@village-flood/engine'
import { compositions, rotate, seedFrom } from './compositions.ts'

export type Mode = 'sizes' | 'compositions'

export interface Job {
  readonly variant: number
  readonly difficulty: Difficulty
  readonly roles: readonly RoleId[]
  readonly seed: number
  /** Célula da tabela: variante, dificuldade, tamanho e (no modo compositions) a composição. */
  readonly cell: string
}

export interface PlanOptions {
  readonly variants: number
  readonly difficulties: readonly Difficulty[]
  readonly sizes: readonly number[]
  readonly games: number
  readonly mode: Mode
}

export const compositionKey = (roles: readonly RoleId[]) => [...roles].sort().join('+')

export function cellKey(variant: number, difficulty: Difficulty, size: number, comp = '*'): string {
  return `${variant}|${difficulty}|${size}|${comp}`
}

/**
 * As mesmas partidas (composição, ordem dos assentos e semente) para todas as variantes:
 * a diferença entre variantes vem dos dados, não da sorte.
 */
export function planJobs(options: PlanOptions): Job[] {
  const jobs: Job[] = []
  for (let variant = 0; variant < options.variants; variant++) {
    for (const difficulty of options.difficulties) {
      for (const size of options.sizes) {
        const comps = compositions(size)
        if (options.mode === 'sizes') {
          for (let i = 0; i < options.games; i++) {
            const comp = comps[i % comps.length] ?? []
            jobs.push({
              variant,
              difficulty,
              roles: rotate(comp, Math.floor(i / comps.length)),
              seed: seedFrom(`${difficulty}|${size}|${i}`),
              cell: cellKey(variant, difficulty, size),
            })
          }
        } else {
          for (const comp of comps) {
            const key = compositionKey(comp)
            for (let i = 0; i < options.games; i++) {
              jobs.push({
                variant,
                difficulty,
                roles: rotate(comp, i),
                seed: seedFrom(`${difficulty}|${key}|${i}`),
                cell: cellKey(variant, difficulty, size, key),
              })
            }
          }
        }
      }
    }
  }
  return jobs
}

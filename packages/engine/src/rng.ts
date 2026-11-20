// Gerador pseudoaleatório com estado serializável (mulberry32).
// O estado fica no GameState; nada aqui usa Math.random.

/** Normaliza uma semente qualquer para um inteiro de 32 bits sem sinal. */
export function seedToRng(seed: number): number {
  return seed >>> 0
}

/** Devolve um número em [0, 1) e o próximo estado do gerador. */
export function nextRandom(rng: number): { value: number; rng: number } {
  const next = (rng + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, rng: next }
}

/** Embaralha (Fisher-Yates) sem mutar a entrada. */
export function shuffle<T>(items: readonly T[], rng: number): { items: T[]; rng: number } {
  const result = [...items]
  let state = rng
  for (let i = result.length - 1; i > 0; i--) {
    const step = nextRandom(state)
    state = step.rng
    const j = Math.floor(step.value * (i + 1))
    const a = result[i] as T
    result[i] = result[j] as T
    result[j] = a
  }
  return { items: result, rng: state }
}

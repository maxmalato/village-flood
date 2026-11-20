// Variantes de calibração: alteram só os dados do jogo (nunca o código das regras).
import { defaultGameData, parseGameData, type GameData } from '@village-flood/engine'
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

export interface Variant {
  readonly name: string
  readonly description: string
  readonly data: GameData
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

const isObject = (value: unknown): value is Record<string, Json> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Mescla `patch` sobre `base`: objetos são mesclados, o resto (inclusive listas) é trocado. */
export function deepMerge(base: Json, patch: Json): Json {
  if (!isObject(base) || !isObject(patch)) return patch
  const result: Record<string, Json> = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    const current = result[key]
    result[key] = current === undefined ? value : deepMerge(current, value)
  }
  return result
}

export const baseline: Variant = {
  name: 'baseline',
  description: 'Dados atuais do repositório',
  data: defaultGameData,
}

/** Cria a variante aplicando a alteração aos dados atuais e validando pelo schema. */
export function variantFrom(name: string, description: string, patch: unknown): Variant {
  const merged = deepMerge(defaultGameData as unknown as Json, patch as Json)
  return { name, description, data: parseGameData(merged) }
}

/** Lê um arquivo de variante: { "description": "...", "patch": { ... } }. */
export function loadVariant(path: string): Variant {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as { description?: string; patch?: unknown }
  return variantFrom(basename(path, '.json'), raw.description ?? '', raw.patch ?? {})
}

// Link de convite (?sala=CODIGO) e a sala guardada neste aparelho para voltar depois.
import { normalizeCode } from '@village-flood/kit'

const LINK_PARAM = 'sala'
const STORAGE_KEY = 'village-flood:room'

export function roomLink(code: string, origin = location.origin): string {
  return `${origin}/?${LINK_PARAM}=${code}`
}

/** Código da sala no endereço (?sala=), se houver e for válido. */
export function codeFromUrl(search = location.search): string | null {
  const raw = new URLSearchParams(search).get(LINK_PARAM)
  return raw ? normalizeCode(raw) : null
}

/**
 * Sala guardada neste navegador: só o código e o token aleatório do assento (o token é a
 * "chave" para voltar ao mesmo lugar; nenhum dado pessoal).
 */
export interface SavedRoom {
  code: string
  token: string
  /** Este aparelho é a mesa (TV) da sala. */
  table?: boolean
}

export function savedRoom(): SavedRoom | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as unknown
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as SavedRoom).code === 'string' &&
      typeof (value as SavedRoom).token === 'string'
    ) {
      const room = value as SavedRoom
      return { code: room.code, token: room.token, ...(room.table === true ? { table: true } : {}) }
    }
  } catch {
    // sem armazenamento ou valor corrompido
  }
  return null
}

export function saveRoom(room: SavedRoom): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(room))
  } catch {
    // navegação privada: segue sem lembrar
  }
}

export function forgetRoom(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // idem
  }
}

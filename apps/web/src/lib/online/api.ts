// Chamadas HTTP ao servidor de salas (criar sala e conferir um código).
import { normalizeCode } from '@village-flood/kit'
import type { RoomConfig } from '@village-flood/protocol'

export interface RoomInfo {
  status: 'lobby' | 'playing' | 'over'
  seats: number
  maxSeats: number
  config: RoomConfig
}

/** Erro com o código devolvido pelo servidor (ex.: notFound, tooManyRequests) ou "network". */
export class ApiError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(path, init)
  } catch {
    throw new ApiError('network')
  }
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  if (!response.ok) throw new ApiError(body?.error ?? 'network')
  return body
}

export async function createRoom(config: RoomConfig): Promise<string> {
  const body = (await request('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  })) as { code: string }
  return body.code
}

/** Modo mesa: a TV abre a sala e recebe o próprio token (só ela o conhece). */
export async function createTableRoom(
  config: RoomConfig,
): Promise<{ code: string; token: string }> {
  const body = (await request('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, table: true }),
  })) as { code: string; tableToken: string }
  return { code: body.code, token: body.tableToken }
}

export async function roomInfo(input: string): Promise<RoomInfo> {
  const code = normalizeCode(input)
  if (!code) throw new ApiError('invalidCode')
  return (await request(`/api/rooms/${code}`)) as RoomInfo
}

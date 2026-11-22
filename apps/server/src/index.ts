// Worker de entrada: cria salas, mostra o resumo pelo código e encaminha cada conexão para o
// Durable Object da sala. O próprio Worker serve o site (apps/web/dist); só /api/* chega aqui.
import { codeFromBytes, normalizeCode, RateLimiter } from '@village-flood/kit'
import { parseRoomConfig, PROTOCOL_ID } from '@village-flood/protocol'
import { hashToken, newToken } from './tokens.ts'

export { Room } from './room.ts'

/** Tentativas por minuto e por endereço (dificulta adivinhar códigos de sala). */
const createLimiter = new RateLimiter(10, 60_000)
const lookupLimiter = new RateLimiter(60, 60_000)

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Endereço só para o limite de tentativas, em memória; nunca é gravado nem registrado. */
function clientKey(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'local'
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const now = Date.now()

    if (path === '/api/health') return json({ ok: true, protocol: PROTOCOL_ID })

    // criar sala: POST /api/rooms { config: { difficulty }, table?: true }
    // Com table, quem cria é a mesa (TV): recebe o token dela, que só ela conhece.
    if (path === '/api/rooms') {
      if (request.method !== 'POST') return json({ error: 'methodNotAllowed' }, 405)
      if (!createLimiter.allow(clientKey(request), now))
        return json({ error: 'tooManyRequests' }, 429)
      const body = (await request.json().catch(() => null)) as {
        config?: unknown
        table?: unknown
      } | null
      const config = parseRoomConfig(body?.config)
      if (!config) return json({ error: 'invalidConfig' }, 400)
      const tableToken = body?.table === true ? newToken() : null
      const tableHash = tableToken ? await hashToken(tableToken) : null
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = codeFromBytes(crypto.getRandomValues(new Uint8Array(6)))
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code))
        if (await stub.init(code, config, tableHash)) {
          return json(tableToken ? { code, tableToken } : { code }, 201)
        }
      }
      return json({ error: 'tryAgain' }, 503)
    }

    // sala existente: GET /api/rooms/CODIGO (resumo) e /api/rooms/CODIGO/ws (conexão)
    const match = /^\/api\/rooms\/([^/]+)(\/ws)?$/.exec(path)
    if (match) {
      if (!lookupLimiter.allow(clientKey(request), now))
        return json({ error: 'tooManyRequests' }, 429)
      const code = normalizeCode(decodeURIComponent(match[1] ?? ''))
      if (!code) return json({ error: 'notFound' }, 404)
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code))
      if (match[2]) return stub.fetch(request)
      const info = await stub.info()
      return info ? json(info) : json({ error: 'notFound' }, 404)
    }

    return json({ error: 'notFound' }, 404)
  },
} satisfies ExportedHandler<Env>

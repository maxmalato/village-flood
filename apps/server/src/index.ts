// Worker de entrada: encaminha cada sala para o próprio Durable Object.
// As rotas de sala (criar, entrar, WebSocket) entram na Etapa 4.
import { DurableObject } from 'cloudflare:workers'
import { PROTOCOL_ID } from '@village-flood/protocol'

/** Uma sala de jogo. Guarda o estado no armazenamento SQLite do Durable Object. */
export class Room extends DurableObject<Env> {
  override async fetch(_request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 })
  }
}

export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return Response.json({ ok: true, protocol: PROTOCOL_ID })
    }

    return new Response('Not found', { status: 404 })
  },
} satisfies ExportedHandler<Env>

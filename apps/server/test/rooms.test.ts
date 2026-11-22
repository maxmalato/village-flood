// Salas de ponta a ponta no runtime dos Workers: criar, entrar por WebSocket, lobby, partida,
// recusa de quem não tem a vez, ping, desconexão com bot assumindo e volta pelo token.
import { exports } from 'cloudflare:workers'
import type { Notice } from '@village-flood/kit'
import type { VillageRoomView, VillageServerMessage } from '@village-flood/protocol'
import { describe, expect, it } from 'vitest'

type Message = VillageServerMessage

async function createRoom(difficulty = 'easy'): Promise<string> {
  const response = await exports.default.fetch('https://example.com/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ config: { difficulty } }),
  })
  expect(response.status).toBe(201)
  const { code } = (await response.json()) as { code: string }
  return code
}

const describeMessage = (m: Message) => {
  if (m.type === 'error') return `error:${m.code}`
  if (m.type === 'notice') return `notice:${m.notice.type}`
  if (m.type === 'room' || m.type === 'update') {
    const r = m.room
    return `${m.type}[${r.status}/${r.game?.activeSeat ?? '-'}/${r.seats.map((s) => s.presence).join('+')}]`
  }
  return m.type
}

/** Cliente de teste: guarda as mensagens recebidas e espera por uma condição. */
async function connect(code: string, label: string) {
  const response = await exports.default.fetch(`https://example.com/api/rooms/${code}/ws`, {
    headers: { Upgrade: 'websocket' },
  })
  const ws = response.webSocket
  if (!ws) throw new Error(`sem WebSocket (${response.status})`)
  ws.accept()
  const inbox: Message[] = []
  const waiters: (() => void)[] = []
  ws.addEventListener('message', (event) => {
    inbox.push(JSON.parse(event.data as string) as Message)
    for (const wake of waiters.splice(0)) wake()
  })
  const sleep = () =>
    new Promise<void>((resolve) => {
      waiters.push(resolve)
      setTimeout(resolve, 50)
    })

  return {
    ws,
    send: (message: unknown) => ws.send(JSON.stringify(message)),
    /** Espera (e consome) a primeira mensagem que satisfaz a condição. */
    async waitFor<T extends Message>(test: (m: Message) => m is T, timeout = 5000): Promise<T> {
      const deadline = Date.now() + timeout
      for (;;) {
        const found = inbox.find(test)
        if (found) {
          inbox.splice(inbox.indexOf(found), 1)
          return found
        }
        if (Date.now() > deadline) {
          throw new Error(
            `${label}: mensagem não chegou; recebidas: ${inbox.map(describeMessage).join(', ')}`,
          )
        }
        await sleep()
      }
    },
    /** Espera até a visão MAIS RECENTE da sala satisfazer a condição. */
    async room(test: (room: VillageRoomView) => boolean = () => true, timeout = 5000) {
      const deadline = Date.now() + timeout
      for (;;) {
        const views = inbox.flatMap((m) => ('room' in m ? [m.room] : []))
        const latest = views.at(-1)
        if (latest && test(latest)) return latest
        if (Date.now() > deadline) throw new Error(`${label}: a sala não chegou ao estado esperado`)
        await sleep()
      }
    },
  }
}

type Client = Awaited<ReturnType<typeof connect>>

const isError = (m: Message): m is Extract<Message, { type: 'error' }> => m.type === 'error'
const isWelcome = (m: Message): m is Extract<Message, { type: 'welcome' }> => m.type === 'welcome'
const isUpdate = (m: Message): m is Extract<Message, { type: 'update' }> => m.type === 'update'
const isNotice =
  (type: Notice['type']) =>
  (m: Message): m is Extract<Message, { type: 'notice' }> =>
    m.type === 'notice' && m.notice.type === type

async function errorCode(client: Client) {
  return (await client.waitFor(isError)).code
}

async function join(code: string, name: string) {
  const client = await connect(code, name)
  client.send({ type: 'hello', name })
  const welcome = await client.waitFor(isWelcome)
  return { ...client, seat: welcome.seat, token: welcome.token }
}

describe('salas', () => {
  it('cria a sala, mostra o resumo e recusa código inexistente', async () => {
    const code = await createRoom()
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    const info = await exports.default.fetch(`https://example.com/api/rooms/${code}`)
    expect(await info.json()).toEqual({
      status: 'lobby',
      seats: 0,
      maxSeats: 4,
      config: { difficulty: 'easy' },
    })
    const missing = await exports.default.fetch('https://example.com/api/rooms/AAAAAA')
    expect(missing.status).toBe(404)
    const bad = await exports.default.fetch('https://example.com/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ config: { difficulty: 'fácil' } }),
    })
    expect(bad.status).toBe(400)
  })

  it('lobby, partida, recusa de quem não tem a vez, ping e desconexão com bot e volta', async () => {
    const code = await createRoom()
    const ana = await join(code, 'Ana')
    const bruno = await join(code, 'Bruno')
    expect([ana.seat, bruno.seat]).toEqual(['seat-1', 'seat-2'])

    // apelido repetido é recusado
    const intruso = await connect(code, 'intruso')
    intruso.send({ type: 'hello', name: 'ana' })
    expect(await errorCode(intruso)).toBe('nameTaken')

    // papéis: cada um recebe um papel livre ao entrar e pode trocar por outro livre
    const lobbyView = await ana.room((r) => r.seats.length === 2)
    const taken: string[] = lobbyView.seats.map((x) => x.profile)
    const free = ['firefighter', 'medic', 'engineer', 'neighbor'].find((r) => !taken.includes(r))
    bruno.send({ type: 'profile', profile: taken[0] })
    expect(await errorCode(bruno)).toBe('profileTaken')
    ana.send({ type: 'profile', profile: free })
    await ana.room((r) => r.seats[0]?.profile === free)

    // só a anfitriã começa
    bruno.send({ type: 'start' })
    expect(await errorCode(bruno)).toBe('onlyHost')
    ana.send({ type: 'start' })
    const playing = await ana.room((r) => r.status === 'playing')
    const game = playing.game
    if (!game) throw new Error('sem partida')
    expect(game.activeSeat).toBe('seat-1')

    // ação de quem não tem a vez é recusada pelo servidor; ação malformada também
    bruno.send({ type: 'action', action: { type: 'end-turn' } })
    expect(await errorCode(bruno)).toBe('notYourTurn')
    ana.send({ type: 'action', action: { type: 'voar' } })
    expect(await errorCode(ana)).toBe('badAction')

    // ping do Bruno fora da vez, visto por todos
    bruno.send({ type: 'ping', target: 'C3', kind: 'go' })
    const pinged = await ana.room((r) => r.pings.length === 1)
    expect(pinged.pings).toEqual([{ seat: 'seat-2', target: 'C3', kind: 'go' }])

    // Ana anda ao lado do cais (o mapa pode vir espelhado: calcula pela partida),
    // desfaz e encerra: a vez passa ao Bruno e os pings somem
    const dock = game.tiles.find((t) => t.kind === 'dock')
    const target = game.tiles.find((t) => dock && t.x === dock.x + 1 && t.y === dock.y)
    ana.send({ type: 'action', action: { type: 'move', to: target?.id } })
    const moved = await bruno.waitFor(isUpdate)
    expect(moved.events[0]?.type).toBe('moved')
    ana.send({ type: 'action', action: { type: 'undo' } })
    await bruno.room((r) => r.game?.turnHistory.length === 0)
    ana.send({ type: 'action', action: { type: 'end-turn' } })
    const brunoTurn = await bruno.room((r) => r.game?.activeSeat === 'seat-2')
    expect(brunoTurn.pings).toEqual([])

    // Bruno cai na própria vez: aviso para a equipe e, depois do prazo, o bot assume e joga
    bruno.ws.close(1000, 'teste')
    expect((await ana.waitFor(isNotice('player-away'))).notice.seat).toBe('seat-2')
    expect((await ana.waitFor(isNotice('bot-took-over'))).notice.seat).toBe('seat-2')
    // o bot joga até a vez voltar para a Ana
    const beforeBack = await ana.room(
      (r) => r.status !== 'playing' || r.game?.activeSeat === 'seat-1',
    )
    expect(beforeBack.seats[1]?.presence).toBe('bot')

    // Bruno volta pelo token: retoma no início do próprio turno seguinte
    const back = await connect(code, 'volta')
    back.send({ type: 'hello', token: bruno.token })
    expect((await back.waitFor(isWelcome)).seat).toBe('seat-2')
    expect((await ana.waitFor(isNotice('player-back-soon'))).notice.seat).toBe('seat-2')
    ana.send({ type: 'action', action: { type: 'end-turn' } })
    expect((await ana.waitFor(isNotice('player-returned'))).notice.seat).toBe('seat-2')
    const view = await back.room((r) => r.game?.activeSeat === 'seat-2')
    expect(view.seats[1]?.presence).toBe('connected')
  }, 20_000)

  it('token desconhecido é recusado', async () => {
    const code = await createRoom()
    await join(code, 'Ana')
    const stranger = await connect(code, 'estranho')
    stranger.send({ type: 'hello', token: 'token-inventado' })
    expect(await errorCode(stranger)).toBe('unknownToken')
  })

  it('mensagens em excesso são recusadas', async () => {
    const code = await createRoom()
    const ana = await join(code, 'Ana')
    for (let i = 0; i < 45; i++) ana.send({ type: 'resync' })
    expect(await errorCode(ana)).toBe('tooManyRequests')
  })
})

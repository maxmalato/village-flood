import { describe, expect, it } from 'vitest'
import {
  codeFromBytes,
  formatCode,
  normalizeCode,
  ROOM_TTL_MS,
  TABLE_SEAT,
  type RoomTimings,
} from './constants.ts'
import { parseClientMessage, RateLimiter, TABLE_MESSAGES } from './messages.ts'
import {
  act,
  addBot,
  addPing,
  createRoom,
  disconnect,
  isExpired,
  joinRoom,
  leave,
  nextWake,
  playAgain,
  reconnect,
  removePing,
  removeSeat,
  setConfig,
  setProfile,
  setTableOverlay,
  startGame,
  tick,
  viewOf,
  type Outcome,
  type RoomRecord,
} from './room.ts'
import {
  countGame as def,
  type CountConfig,
  type CountEvent,
  type CountProfile,
  type CountState,
} from './testing.ts'

type Room = RoomRecord<CountState, CountConfig, CountProfile>
type Out = Outcome<CountState, CountEvent, CountConfig, CountProfile>

const timings: RoomTimings = { takeoverMs: 20_000, botStepMs: 1_000 }
const random = () => 0

/** Exige sucesso e devolve o registro. */
function okRecord(out: Out): Room {
  if (out.error) throw new Error(out.error)
  return out.record
}

/** Sala com Ana (anfitriã) e Bruno, pessoas conectadas. */
function lobby(): Room {
  let room: Room = createRoom('ABCDEF', def.defaultConfig, 0)
  room = okRecord(joinRoom(def, room, 'Ana', 'hash-ana', 1, random))
  room = okRecord(joinRoom(def, room, 'Bruno', 'hash-bruno', 2, random))
  return room
}

function started(): Room {
  return okRecord(startGame(def, lobby(), 'seat-1', 7, 10, timings))
}

describe('códigos e mensagens', () => {
  it('normaliza e formata o código', () => {
    expect(normalizeCode(' k7p-4qx ')).toBe('K7P4QX')
    expect(normalizeCode('K7P4Q0')).toBeNull() // 0 não existe no alfabeto
    expect(normalizeCode('K7P4Q')).toBeNull()
    expect(formatCode('K7P4QX')).toBe('K7P·4QX')
    expect(codeFromBytes([0, 31, 32, 255, 1, 2])).toBe('A9A9BC')
  })

  it('valida as mensagens recebidas', () => {
    expect(parseClientMessage('{"type":"hello","name":"Ana"}')).toEqual({
      type: 'hello',
      name: 'Ana',
    })
    expect(parseClientMessage('{"type":"action","action":{"type":"end"}}')).toEqual({
      type: 'action',
      action: { type: 'end' },
    })
    expect(parseClientMessage('não é json')).toBeNull()
    expect(parseClientMessage('{"type":"desconhecido"}')).toBeNull()
    expect(parseClientMessage('{"type":"unping","index":1.5}')).toBeNull()
    expect(parseClientMessage('x'.repeat(10_000))).toBeNull()
  })

  it('limita mensagens por janela de tempo', () => {
    const limiter = new RateLimiter(2, 1000)
    expect([limiter.allow('a', 0), limiter.allow('a', 1), limiter.allow('a', 2)]).toEqual([
      true,
      true,
      false,
    ])
    expect(limiter.allow('a', 1000)).toBe(true)
    expect(limiter.allow('b', 2)).toBe(true)
  })
})

describe('lobby', () => {
  it('primeira pessoa é a anfitriã; perfis livres para cada um', () => {
    const room = lobby()
    expect(room.host).toBe('seat-1')
    expect(room.seats.map((s) => [s.seat, s.name, s.profile])).toEqual([
      ['seat-1', 'Ana', 'red'],
      ['seat-2', 'Bruno', 'blue'],
    ])
  })

  it('recusa apelido repetido, vazio e sala cheia', () => {
    const room = lobby()
    expect(joinRoom(def, room, ' ana ', 'h', 3, random).error).toBe('nameTaken')
    expect(joinRoom(def, room, '   ', 'h', 3, random).error).toBe('invalidName')
    const full = okRecord(joinRoom(def, room, 'Carla', 'h3', 3, random))
    expect(joinRoom(def, full, 'Diego', 'h4', 4, random).error).toBe('roomFull')
  })

  it('cada um escolhe o próprio perfil, sem repetir', () => {
    const room = lobby()
    expect(setProfile(def, room, 'seat-2', 'red', 3).error).toBe('profileTaken')
    expect(setProfile(def, room, 'seat-2', 'roxo', 3).error).toBe('invalidProfile')
    expect(okRecord(setProfile(def, room, 'seat-2', 'green', 3)).seats[1]?.profile).toBe('green')
  })

  it('só a anfitriã configura, põe e tira bots', () => {
    const room = lobby()
    expect(setConfig(def, room, 'seat-2', { target: 5 }, 3).error).toBe('onlyHost')
    expect(okRecord(setConfig(def, room, 'seat-1', { target: 5 }, 3)).config).toEqual({ target: 5 })
    expect(addBot(def, room, 'seat-2', 3, random).error).toBe('onlyHost')
    const withBot = okRecord(addBot(def, room, 'seat-1', 3, random))
    expect(withBot.seats[2]).toMatchObject({
      seat: 'seat-3',
      kind: 'bot',
      profile: 'green',
      name: 'Bot 1',
    })
    // o nome do bot nunca repete o de alguém da sala
    let other: Room = createRoom('ABCDEF', def.defaultConfig, 0)
    other = okRecord(joinRoom(def, other, 'Ana', 'hash-ana', 1, random))
    other = okRecord(joinRoom(def, other, 'bot 1', 'hash-x', 1, random))
    expect(okRecord(addBot(def, other, 'seat-1', 2, random)).seats[2]?.name).toBe('Bot 2')
    expect(removeSeat(withBot, 'seat-1', 'seat-2', 4).error).toBe('stillConnected')
    expect(okRecord(removeSeat(withBot, 'seat-1', 'seat-3', 4)).seats).toHaveLength(2)
  })

  it('se a anfitriã cai, outra pessoa conectada comanda', () => {
    const room = okRecord(disconnect(def, lobby(), 'seat-1', 3, timings))
    expect(okRecord(addBot(def, room, 'seat-2', 4, random)).seats).toHaveLength(3)
  })

  it('sair no lobby libera o assento e passa a anfitriã adiante', () => {
    const room = okRecord(leave(def, lobby(), 'seat-1', 3, timings))
    expect(room.seats.map((s) => s.seat)).toEqual(['seat-2'])
    expect(room.host).toBe('seat-2')
  })

  it('para começar: só a anfitriã, assentos suficientes, todos conectados', () => {
    let room: Room = createRoom('ABCDEF', def.defaultConfig, 0)
    room = okRecord(joinRoom(def, room, 'Ana', 'h1', 1, random))
    expect(startGame(def, room, 'seat-1', 1, 2, timings).error).toBe('notEnoughSeats')
    room = okRecord(addBot(def, room, 'seat-1', 2, random))
    expect(startGame(def, room, 'seat-2', 1, 3, timings).error).toBe('onlyHost')
    const away = okRecord(joinRoom(def, room, 'Bruno', 'h2', 3, random))
    const awayRoom = okRecord(disconnect(def, away, 'seat-3', 4, timings))
    expect(startGame(def, awayRoom, 'seat-1', 1, 5, timings).error).toBe('someoneAway')
    const ok = okRecord(startGame(def, room, 'seat-1', 1, 3, timings))
    expect(ok.status).toBe('playing')
    expect(ok.game?.seats).toEqual(['seat-1', 'seat-2'])
  })
})

describe('partida', () => {
  it('só quem tem a vez joga; a ação passa pelo jogo', () => {
    const room = started()
    expect(act(def, room, 'seat-2', { type: 'add', n: 1 }, 11, timings).error).toBe('notYourTurn')
    expect(act(def, room, 'seat-1', { type: 'add', n: 9 }, 11, timings).error).toBe('badAction')
    const out = act(def, room, 'seat-1', { type: 'add', n: 2 }, 11, timings)
    expect(out.events).toEqual([{ type: 'added', n: 2 }])
    expect(out.by).toBe('seat-1')
    expect(out.record.game?.total).toBe(2)
  })

  it('bot no lugar da vez joga no alarme, uma ação por vez', () => {
    let room: Room = createRoom('ABCDEF', def.defaultConfig, 0)
    room = okRecord(joinRoom(def, room, 'Ana', 'h1', 1, random))
    room = okRecord(addBot(def, room, 'seat-1', 2, random))
    room = okRecord(startGame(def, room, 'seat-1', 1, 10, timings))
    room = okRecord(act(def, room, 'seat-1', { type: 'end' }, 11, timings))
    expect(room.nextBotAt).toBe(11 + timings.botStepMs)
    expect(nextWake(room)).toBe(11 + timings.botStepMs)
    // cedo demais: nada acontece
    expect(tick(def, room, 500, timings).events).toEqual([])
    const first = tick(def, room, 1011, timings)
    expect(first.events).toEqual([{ type: 'added', n: 1 }])
    expect(first.by).toBe('seat-2')
    const second = tick(def, first.record, 2011, timings)
    expect(second.events).toEqual([{ type: 'ended' }])
    expect(second.record.nextBotAt).toBeNull() // voltou a vez da Ana
  })

  it('a partida acaba e pode recomeçar no lobby', () => {
    let room = started()
    room = okRecord(act(def, room, 'seat-1', { type: 'add', n: 3 }, 11, timings))
    room = okRecord(act(def, room, 'seat-1', { type: 'end' }, 12, timings))
    room = okRecord(act(def, room, 'seat-2', { type: 'add', n: 3 }, 13, timings))
    room = okRecord(act(def, room, 'seat-2', { type: 'end' }, 14, timings))
    room = okRecord(act(def, room, 'seat-1', { type: 'add', n: 3 }, 15, timings))
    room = okRecord(act(def, room, 'seat-1', { type: 'end' }, 16, timings))
    room = okRecord(act(def, room, 'seat-2', { type: 'add', n: 1 }, 17, timings))
    expect(room.status).toBe('over')
    expect(act(def, room, 'seat-2', { type: 'end' }, 18, timings).error).toBe('notPlaying')
    const again = okRecord(playAgain(room, 'seat-1', 19))
    expect(again).toMatchObject({ status: 'lobby', game: null })
  })

  it('a visão pública não tem os tokens', () => {
    const view = viewOf(started())
    expect(JSON.stringify(view)).not.toContain('hash-ana')
    expect(view.seats[0]).toEqual({
      seat: 'seat-1',
      name: 'Ana',
      kind: 'human',
      profile: 'red',
      presence: 'connected',
      takeoverInMs: null,
    })
  })
})

describe('desconexão e volta (regras, seção 10)', () => {
  it('caiu na própria vez: o bot assume depois de 20 s', () => {
    const room = started()
    const out = disconnect(def, room, 'seat-1', 100, timings)
    expect(out.notices).toEqual([{ type: 'player-away', seat: 'seat-1' }])
    expect(out.record.seats[0]).toMatchObject({ presence: 'away', takeoverAt: 20_100 })
    expect(nextWake(out.record)).toBe(20_100)
    // antes dos 20 s, ninguém joga por ela
    expect(tick(def, out.record, 10_000, timings).record.seats[0]?.presence).toBe('away')
    const taken = tick(def, out.record, 20_100, timings)
    expect(taken.notices).toEqual([{ type: 'bot-took-over', seat: 'seat-1' }])
    expect(taken.record.seats[0]).toMatchObject({ presence: 'bot', takeoverAt: null })
    expect(taken.record.nextBotAt).toBe(20_100 + timings.botStepMs)
  })

  it('volta antes dos 20 s: retoma na hora, sem bot', () => {
    const away = okRecord(disconnect(def, started(), 'seat-1', 100, timings))
    const back = reconnect<CountState, CountConfig, CountProfile, CountEvent>(
      away,
      'hash-ana',
      5_000,
    )
    expect(back.seat).toBe('seat-1')
    expect(back.notices).toEqual([{ type: 'player-returned', seat: 'seat-1' }])
    expect(back.record.seats[0]).toMatchObject({ presence: 'connected', takeoverAt: null })
  })

  it('caiu fora da vez: o bot assume no início do turno dela', () => {
    let room = okRecord(disconnect(def, started(), 'seat-2', 100, timings))
    expect(room.seats[1]).toMatchObject({ presence: 'away', takeoverAt: null })
    const out = act(def, room, 'seat-1', { type: 'end' }, 200, timings)
    expect(out.notices).toEqual([{ type: 'bot-took-over', seat: 'seat-2' }])
    room = out.record
    expect(room.seats[1]?.presence).toBe('bot')
    expect(room.nextBotAt).toBe(200 + timings.botStepMs)
  })

  it('voltou com o bot jogando: retoma só no início do próprio turno seguinte', () => {
    let room = okRecord(disconnect(def, started(), 'seat-2', 100, timings))
    room = okRecord(act(def, room, 'seat-1', { type: 'end' }, 200, timings)) // vez do Bruno (bot)
    const back = reconnect<CountState, CountConfig, CountProfile, CountEvent>(
      room,
      'hash-bruno',
      300,
    )
    expect(back.notices).toEqual([{ type: 'player-back-soon', seat: 'seat-2' }])
    room = back.record
    expect(room.seats[1]?.presence).toBe('returning')
    // nunca no meio do turno do bot: a pessoa ainda não pode agir
    expect(act(def, room, 'seat-2', { type: 'end' }, 400, timings).error).toBe('notYourControl')
    room = okRecord(tick(def, room, 1_200, timings)) // bot soma
    room = okRecord(tick(def, room, 2_200, timings)) // bot encerra: vez da Ana
    room = okRecord(act(def, room, 'seat-1', { type: 'add', n: 1 }, 2_300, timings))
    const handBack = act(def, room, 'seat-1', { type: 'end' }, 2_400, timings)
    expect(handBack.notices).toEqual([{ type: 'player-returned', seat: 'seat-2' }])
    expect(handBack.record.seats[1]?.presence).toBe('connected')
    expect(handBack.record.nextBotAt).toBeNull()
  })

  it('token desconhecido é recusado', () => {
    expect(reconnect(started(), 'outro', 1).error).toBe('unknownToken')
  })

  it('a sala expira depois de 12 h sem atividade', () => {
    const room = started()
    expect(isExpired(room, room.lastActivity + ROOM_TTL_MS - 1)).toBe(false)
    expect(isExpired(room, room.lastActivity + ROOM_TTL_MS)).toBe(true)
  })
})

describe('pings', () => {
  it('fora da vez, até 3 por turno, e somem no turno seguinte', () => {
    let room = started()
    expect(addPing(def, room, 'seat-1', 'a', 'here', 11).error).toBe('yourTurn')
    expect(addPing(def, room, 'seat-2', 'A1', 'here', 11).error).toBe('invalidPing')
    expect(addPing(def, room, 'seat-2', 'a', 'outro', 11).error).toBe('invalidPing')
    for (const target of ['a', 'b', 'c'])
      room = okRecord(addPing(def, room, 'seat-2', target, 'here', 12))
    expect(addPing(def, room, 'seat-2', 'd', 'here', 13).error).toBe('tooManyPings')
    expect(room.pings).toHaveLength(3)
    expect(removePing(room, 'seat-1', 0, 14).error).toBe('invalidPing')
    room = okRecord(removePing(room, 'seat-2', 0, 14))
    expect(room.pings.map((p) => p.target)).toEqual(['b', 'c'])
    room = okRecord(act(def, room, 'seat-1', { type: 'end' }, 15, timings))
    expect(room.pings).toEqual([])
  })
})

describe('modo mesa', () => {
  function tableRoom(): Room {
    let room: Room = createRoom('ABCDEF', def.defaultConfig, 0, 'hash-mesa')
    room = okRecord(joinRoom(def, room, 'Ana', 'hash-ana', 1, random))
    return okRecord(joinRoom(def, room, 'Bruno', 'hash-bruno', 2, random))
  }

  it('a mesa entra pelo próprio token, não ocupa assento e não comanda', () => {
    let room = tableRoom()
    expect(viewOf(room).table).toEqual({ connected: false, overlay: null })
    const back = reconnect<CountState, CountConfig, CountProfile, CountEvent>(room, 'hash-mesa', 3)
    expect(back.seat).toBe(TABLE_SEAT)
    room = okRecord(back)
    expect(room.table?.connected).toBe(true)
    expect(room.seats).toHaveLength(2)
    // quem comanda é a primeira pessoa que entrou
    expect(room.host).toBe('seat-1')
    expect(startGame(def, room, TABLE_SEAT, 7, 4, timings).error).toBe('onlyHost')
    room = okRecord(disconnect(def, room, TABLE_SEAT, 5, timings))
    expect(room.table?.connected).toBe(false)
  })

  it('a legenda abre e fecha na TV pela mesa ou por qualquer pessoa conectada', () => {
    let room = tableRoom()
    room = okRecord(setTableOverlay(def, room, 'seat-2', 'help', 3))
    expect(viewOf(room).table?.overlay).toBe('help')
    room = okRecord(setTableOverlay(def, room, TABLE_SEAT, null, 4))
    expect(room.table?.overlay).toBeNull()
    expect(setTableOverlay(def, room, 'seat-1', 'outra', 5).error).toBe('invalidOverlay')
    expect(setTableOverlay(def, room, 'seat-9', 'help', 5).error).toBe('notYourControl')
    expect(setTableOverlay(def, lobby(), 'seat-1', 'help', 5).error).toBe('noTable')
  })

  it('a mesa só pode pedir o estado e abrir ou fechar a legenda', () => {
    expect([...TABLE_MESSAGES].sort()).toEqual(['hello', 'resync', 'table-overlay'])
    expect(parseClientMessage('{"type":"table-overlay","overlay":null}')).toEqual({
      type: 'table-overlay',
      overlay: null,
    })
    expect(parseClientMessage('{"type":"table-overlay","overlay":3}')).toBeNull()
  })
})

describe('prazo do bot na visão da sala', () => {
  it('mostra quanto falta para o bot assumir a vez de quem caiu, e some quando ele assume', () => {
    let room = started()
    // seat-1 tem a vez e cai: o prazo começa a correr
    room = okRecord(disconnect(def, room, 'seat-1', 100, timings))
    const away = viewOf(room, 100).seats[0]
    expect(away?.presence).toBe('away')
    expect(away?.takeoverInMs).toBe(timings.takeoverMs)
    expect(viewOf(room, 100 + timings.takeoverMs - 1).seats[0]?.takeoverInMs).toBe(1)
    // quem caiu fora da vez não tem prazo: o bot entra no início da vez dela
    expect(viewOf(room, 100).seats[1]?.takeoverInMs).toBeNull()
    room = okRecord(tick(def, room, 100 + timings.takeoverMs, timings))
    expect(viewOf(room, 100 + timings.takeoverMs).seats[0]?.takeoverInMs).toBeNull()
  })
})

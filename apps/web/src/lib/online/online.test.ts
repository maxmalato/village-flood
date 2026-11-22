import { newGame } from '@village-flood/engine'
import type { VillageRoomView } from '@village-flood/protocol'
import { describe, expect, it } from 'vitest'
import { errorText } from '../../i18n.ts'
import { tileViews } from '../view.ts'
import { seatsOf } from './game.svelte.ts'
import { codeFromUrl, roomLink, savedRoom } from './link.ts'
import { socketUrl } from './connection.svelte.ts'

const room: VillageRoomView = {
  code: 'K7P4QX',
  status: 'playing',
  host: 'seat-1',
  seats: [
    { seat: 'seat-1', name: 'Ana', kind: 'human', profile: 'firefighter', presence: 'connected' },
    { seat: 'seat-2', name: 'Bruno', kind: 'human', profile: 'medic', presence: 'bot' },
    { seat: 'seat-3', name: 'Carla', kind: 'bot', profile: 'engineer', presence: 'connected' },
  ],
  config: { difficulty: 'easy' },
  game: null,
  pings: [{ seat: 'seat-2', target: 'C3', kind: 'go' }],
  table: null,
}

describe('link de convite', () => {
  it('monta o link e lê o código do endereço', () => {
    expect(roomLink('K7P4QX', 'https://vila.example')).toBe('https://vila.example/?sala=K7P4QX')
    expect(codeFromUrl('?sala=k7p-4qx')).toBe('K7P4QX')
    expect(codeFromUrl('?sala=0000')).toBeNull()
    expect(codeFromUrl('')).toBeNull()
  })

  it('sem armazenamento, não há sala guardada', () => {
    expect(savedRoom()).toBeNull()
  })

  it('usa wss em https e ws em http', () => {
    expect(socketUrl('K7P4QX', new URL('https://vila.example'))).toBe(
      'wss://vila.example/api/rooms/K7P4QX/ws',
    )
    expect(socketUrl('K7P4QX', new URL('http://localhost:4173'))).toBe(
      'ws://localhost:4173/api/rooms/K7P4QX/ws',
    )
  })
})

describe('assentos online', () => {
  it('marca o próprio assento e trata o bot no lugar de quem caiu como bot', () => {
    const seats = seatsOf(room, 'seat-2')
    expect(seats.map((s) => [s.name, s.bot, s.you, s.presence])).toEqual([
      ['Ana', false, false, 'connected'],
      ['Bruno', true, true, 'bot'],
      ['Carla', true, false, undefined],
    ])
    expect(new Set(seats.map((s) => s.color)).size).toBe(3)
  })

  it('as sugestões aparecem na quadra, com quem sugeriu', () => {
    const seats = seatsOf(room, 'seat-1')
    const state = newGame({
      difficulty: 'easy',
      seed: 3,
      seats: seats.map((s) => ({ seat: s.seat, role: s.role })),
      variation: { scenario: 0, mirrored: false },
    })
    const views = tileViews(state, {
      seats,
      selected: null,
      suggested: null,
      showReach: false,
      locale: 'pt-BR',
      pings: room.pings,
    })
    const c3 = views.find((v) => v.id === 'C3')
    expect(c3?.pings).toEqual([{ initial: 'B', color: seats[1]?.color, kind: 'go' }])
    expect(c3?.aria).toContain('Bruno sugere: Ir para cá')
    expect(views.find((v) => v.id === 'C4')?.pings).toEqual([])
  })
})

describe('erros do servidor', () => {
  it('tem texto para os códigos conhecidos e um genérico para os outros', () => {
    expect(errorText('pt-BR', 'nameTaken')).toBe('Já tem alguém com esse apelido na sala.')
    expect(errorText('en', 'tooManyPings', { n: 3 })).toBe(
      'You already made 3 suggestions this turn.',
    )
    expect(errorText('pt-BR', 'invalidSeats')).toBe('O servidor recusou o pedido.')
  })
})

describe('iniciais', () => {
  it('bots da sala online têm iniciais diferentes', async () => {
    const { initialOf } = await import('../view.ts')
    expect(['Bot 1', 'Bot 2', 'Ana', ' bruno'].map(initialOf)).toEqual(['B1', 'B2', 'A', 'B'])
  })
})

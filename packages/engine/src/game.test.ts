import { describe, expect, it } from 'vitest'
import { defaultGameData } from './data.ts'
import {
  actorsOf,
  adjacentTileIds,
  countResidents,
  forecastView,
  houseMark,
  legalActions,
  newGame,
  reachableMoves,
  transition,
} from './game.ts'
import {
  act,
  activate,
  atLevel,
  carry,
  patchResident,
  patchVolunteer,
  resident,
  saveAllExcept,
  setup,
  volunteer,
  water,
  withDeck,
  withRoleParams,
} from './testing.ts'
import type { Action, GameState } from './types.ts'

const rejectReason = (state: GameState, action: Action, seat = state.activeSeat) => {
  const result = transition(state, action, { seat })
  return result.ok ? 'ok' : result.reason
}

const eventsOf = (state: GameState, action: Action) => {
  const result = transition(state, action, { seat: state.activeSeat })
  if (!result.ok) throw new Error(result.reason)
  return result.events
}

describe('newGame', () => {
  it('cria 12 moradores no Normal, com os extras em A4 e B5', () => {
    const s = setup()
    expect(s.residents).toHaveLength(12)
    expect(s.residents.filter((r) => r.id.endsWith('-2')).map((r) => r.homeTileId)).toEqual([
      'A4',
      'B5',
    ])
    expect(s.residents.every((r) => r.status === 'healthy' && r.tileId === r.homeTileId)).toBe(true)
  })

  it('cria 11 moradores no Tranquilo e 13 na Tempestade', () => {
    expect(setup(undefined, 'easy').residents).toHaveLength(11)
    expect(setup(undefined, 'storm').residents).toHaveLength(13)
  })

  it('começa no nível inicial da dificuldade, com a água já calculada', () => {
    for (const difficulty of ['easy', 'normal', 'storm'] as const) {
      expect(setup(undefined, difficulty).riverLevel).toBe(0)
    }
    const data = {
      ...defaultGameData,
      difficulties: {
        ...defaultGameData.difficulties,
        storm: { ...defaultGameData.difficulties.storm, startLevel: 5 },
      },
    }
    const s = newGame(
      {
        difficulty: 'storm',
        seed: 1,
        seats: [
          { seat: 'ana', role: 'medic' },
          { seat: 'bruno', role: 'engineer' },
        ],
        variation: { scenario: 0, mirrored: false },
      },
      data,
    )
    expect(s.riverLevel).toBe(5)
    expect(water(s, 'A1')).toBe('flooded')
    expect(resident(s, 'B1-1').status).toBe('injured')
  })

  it('põe todos no cais, com 3 ações só para o primeiro assento', () => {
    const s = setup(['firefighter', 'medic', 'engineer'])
    expect(s.volunteers.map((v) => v.tileId)).toEqual(['B3', 'B3', 'B3'])
    expect(s.volunteers.map((v) => v.actionsLeft)).toEqual([3, 0, 0])
    expect(s.activeSeat).toBe('ana')
    expect(s.turn).toBe(1)
  })

  it('monta o baralho com a composição da dificuldade', () => {
    const s = setup()
    const count = (kind: string) => s.rainDeck.filter((c) => c === kind).length
    expect(s.rainDeck).toHaveLength(25)
    expect([count('cloudy'), count('drizzle'), count('rain'), count('storm')]).toEqual([
      13, 8, 3, 1,
    ])
  })

  it('é determinística pela semente', () => {
    expect(setup(undefined, 'normal', 7)).toEqual(setup(undefined, 'normal', 7))
    expect(setup(undefined, 'normal', 7).rainDeck).not.toEqual(
      setup(undefined, 'normal', 8).rainDeck,
    )
  })

  it('recusa configurações inválidas', () => {
    expect(() => setup(['medic'])).toThrow(/2 a 4/)
    expect(() =>
      setup(['medic', 'engineer', 'neighbor', 'firefighter', 'boat-pilot'] as never),
    ).toThrow(/2 a 4/)
    expect(() => setup(['medic', 'medic'])).toThrow(/papel diferente/)
    expect(() =>
      newGame({
        difficulty: 'normal',
        seed: 1,
        seats: [
          { seat: 'ana', role: 'medic' },
          { seat: 'ana', role: 'engineer' },
        ],
      }),
    ).toThrow(/repetidos/)
  })
})

describe('vez e fim de partida', () => {
  it('só quem tem a vez age', () => {
    const s = setup()
    expect(actorsOf(s)).toEqual(['ana'])
    expect(rejectReason(s, { type: 'move', to: 'C3' }, 'bruno')).toBe('not-your-turn')
  })

  it('ninguém age depois do fim', () => {
    const s = { ...setup(), phase: 'won' as const }
    expect(actorsOf(s)).toEqual([])
    expect(rejectReason(s, { type: 'end-turn' })).toBe('game-over')
  })
})

describe('andar (regras, seção 5)', () => {
  // Nível 12: altura 1 submersa, altura 2 alagada, altura 3 seca.
  const base = atLevel(setup(['firefighter', 'medic', 'boat-pilot', 'neighbor']), 12)

  it('Bombeiro paga 1 em quadra alagada', () => {
    const s = act(base, { type: 'move', to: 'B2' })
    expect(volunteer(s, 'ana')).toMatchObject({ tileId: 'B2', actionsLeft: 2 })
  })

  it('os outros pagam 2 em quadra alagada e 1 em quadra seca', () => {
    const s = activate(base, 'bruno')
    expect(volunteer(act(s, { type: 'move', to: 'B2' }), 'bruno').actionsLeft).toBe(1)
    expect(volunteer(act(s, { type: 'move', to: 'C3' }), 'bruno').actionsLeft).toBe(2)
  })

  it('só a Barqueira entra em quadra submersa, por 1 ação', () => {
    expect(rejectReason(activate(base, 'bruno'), { type: 'move', to: 'A3' })).toBe('tile-submerged')
    const s = act(activate(base, 'carla'), { type: 'move', to: 'A3' })
    expect(volunteer(s, 'carla').actionsLeft).toBe(2)
  })

  it('Barqueira paga +1 por passo enquanto carrega 2 moradores (a testar)', () => {
    let s = activate(base, 'carla')
    s = carry(carry(s, 'carla', 'C2-1'), 'carla', 'E2-1')
    expect(reachableMoves(s, 'carla')).toEqual(
      expect.arrayContaining([
        { to: 'B2', cost: 3 },
        { to: 'A3', cost: 2 },
        { to: 'C3', cost: 2 },
      ]),
    )
    s = carry(activate(base, 'carla'), 'carla', 'C2-1')
    expect(reachableMoves(s, 'carla')).toEqual(expect.arrayContaining([{ to: 'B2', cost: 2 }]))
  })

  it('só a Vizinha anda na diagonal', () => {
    expect(rejectReason(activate(base, 'bruno'), { type: 'move', to: 'C2' })).toBe('not-adjacent')
    const s = act(activate(base, 'diego'), { type: 'move', to: 'C2' })
    expect(volunteer(s, 'diego')).toMatchObject({ tileId: 'C2', actionsLeft: 1 })
    expect(rejectReason(activate(base, 'diego'), { type: 'move', to: 'A2' })).toBe('tile-submerged')
  })

  it('recusa quadra distante, inexistente ou sem ações suficientes', () => {
    const s = activate(base, 'bruno')
    expect(rejectReason(s, { type: 'move', to: 'D3' })).toBe('not-adjacent')
    expect(rejectReason(s, { type: 'move', to: 'Z9' })).toBe('unknown-tile')
    const tired = patchVolunteer(s, 'bruno', { actionsLeft: 1 })
    expect(rejectReason(tired, { type: 'move', to: 'B2' })).toBe('not-enough-actions')
  })
})

describe('pegar morador (regras, seção 6)', () => {
  it('pegar saudável custa 1', () => {
    let s = patchVolunteer(setup(), 'ana', { tileId: 'C2' })
    s = act(s, { type: 'pick-up', residentId: 'C2-1' })
    expect(volunteer(s, 'ana')).toMatchObject({ carrying: ['C2-1'], actionsLeft: 2 })
    expect(resident(s, 'C2-1')).toMatchObject({ tileId: null, carriedBy: 'ana' })
  })

  it('pegar ferido custa 2, inclusive para o Bombeiro; a Médica paga 1', () => {
    let s = patchResident(setup(), 'C2-1', { status: 'injured' })
    s = patchVolunteer(patchVolunteer(s, 'ana', { tileId: 'C2' }), 'bruno', { tileId: 'C2' })
    expect(volunteer(act(s, { type: 'pick-up', residentId: 'C2-1' }), 'ana').actionsLeft).toBe(1)
    const medic = activate(s, 'bruno')
    expect(
      volunteer(act(medic, { type: 'pick-up', residentId: 'C2-1' }), 'bruno').actionsLeft,
    ).toBe(2)
  })

  it('cada voluntário carrega 1; a Barqueira carrega 2', () => {
    let s = setup(['firefighter', 'boat-pilot'])
    s = patchVolunteer(patchVolunteer(s, 'ana', { tileId: 'A4' }), 'bruno', { tileId: 'A4' })
    const one = act(s, { type: 'pick-up', residentId: 'A4-1' })
    expect(rejectReason(one, { type: 'pick-up', residentId: 'A4-2' })).toBe('carry-full')
    let pilot = act(activate(s, 'bruno'), { type: 'pick-up', residentId: 'A4-1' })
    pilot = act(pilot, { type: 'pick-up', residentId: 'A4-2' })
    expect(volunteer(pilot, 'bruno').carrying).toEqual(['A4-1', 'A4-2'])
  })

  it('só pega morador esperando na mesma quadra', () => {
    const s = patchVolunteer(setup(), 'ana', { tileId: 'C2' })
    expect(rejectReason(s, { type: 'pick-up', residentId: 'B1-1' })).toBe('resident-not-here')
    expect(rejectReason(s, { type: 'pick-up', residentId: 'nobody' })).toBe('resident-not-here')
  })

  it('entrega na igreja automaticamente, sem custo', () => {
    let s = patchVolunteer(setup(), 'ana', { tileId: 'C2' })
    s = act(s, { type: 'pick-up', residentId: 'C2-1' })
    s = act(s, { type: 'move', to: 'C3' })
    const events = eventsOf(s, { type: 'move', to: 'D3' })
    s = act(s, { type: 'move', to: 'D3' })
    expect(events).toContainEqual({ type: 'delivered', seat: 'ana', residentIds: ['C2-1'] })
    expect(resident(s, 'C2-1')).toMatchObject({ status: 'safe', tileId: 'D3', carriedBy: null })
    expect(volunteer(s, 'ana')).toMatchObject({ carrying: [], actionsLeft: 0 })
    expect(s.phase).toBe('playing') // a igreja não encerra a partida
  })
})

describe('curar (Médica)', () => {
  const base = activate(patchResident(setup(), 'C2-1', { status: 'injured' }), 'bruno')

  it('cura ferido na quadra vizinha de graça, mesmo sem ações', () => {
    const s = act(patchVolunteer(base, 'bruno', { tileId: 'C3' }), {
      type: 'heal',
      residentId: 'C2-1',
    })
    expect(resident(s, 'C2-1').status).toBe('healthy')
    expect(volunteer(s, 'bruno').actionsLeft).toBe(3)
    const tired = patchVolunteer(base, 'bruno', { tileId: 'C3', actionsLeft: 0 })
    expect(rejectReason(tired, { type: 'heal', residentId: 'C2-1' })).toBe('ok')
  })

  it('cura na mesma quadra, mas não na diagonal', () => {
    const here = patchVolunteer(base, 'bruno', { tileId: 'C2' })
    expect(rejectReason(here, { type: 'heal', residentId: 'C2-1' })).toBe('ok')
    const diagonal = patchVolunteer(base, 'bruno', { tileId: 'D3' })
    expect(rejectReason(diagonal, { type: 'heal', residentId: 'C2-1' })).toBe('not-adjacent')
  })

  it('recusa quem não é Médica, morador saudável e morador carregado', () => {
    const s = patchVolunteer(base, 'bruno', { tileId: 'C2' })
    expect(rejectReason(activate(s, 'ana'), { type: 'heal', residentId: 'C2-1' })).toBe(
      'role-required',
    )
    expect(rejectReason(s, { type: 'heal', residentId: 'B1-1' })).toBe('resident-not-injured')
    const carried = carry(s, 'ana', 'C2-1')
    expect(rejectReason(carried, { type: 'heal', residentId: 'C2-1' })).toBe('resident-not-here')
  })
})

describe('saco de areia', () => {
  const base = setup(['engineer', 'medic'])

  it('Engenheiro põe na quadra vizinha por 1 ação', () => {
    const s = act(base, { type: 'reinforce', tileId: 'B2' })
    expect(s.tiles.find((t) => t.id === 'B2')?.sandbags).toBe(1)
    expect(volunteer(s, 'ana').actionsLeft).toBe(2)
  })

  it('os outros só na própria quadra, por 2 ações', () => {
    const s = patchVolunteer(activate(base, 'bruno'), 'bruno', { tileId: 'C2' })
    expect(volunteer(act(s, { type: 'reinforce', tileId: 'C2' }), 'bruno').actionsLeft).toBe(1)
    expect(rejectReason(s, { type: 'reinforce', tileId: 'C3' })).toBe('not-adjacent')
  })

  it('não vale em igreja e cais, e o máximo é 2 por quadra', () => {
    expect(rejectReason(base, { type: 'reinforce', tileId: 'B3' })).toBe('tile-not-reinforceable')
    let s = act(base, { type: 'reinforce', tileId: 'B2' })
    s = act(s, { type: 'reinforce', tileId: 'B2' })
    expect(rejectReason(s, { type: 'reinforce', tileId: 'B2' })).toBe('sandbag-limit')
  })

  it('pode secar a quadra, mas o ferido continua ferido', () => {
    let s = atLevel(base, 12)
    s = patchVolunteer(patchResident(s, 'C2-1', { status: 'injured' }), 'ana', { tileId: 'C3' })
    expect(water(s, 'C2')).toBe('flooded')
    const events = eventsOf(s, { type: 'reinforce', tileId: 'C2' })
    s = act(s, { type: 'reinforce', tileId: 'C2' })
    expect(water(s, 'C2')).toBe('dry')
    expect(events).toContainEqual({ type: 'tile-dried', tileId: 'C2', water: 'dry' })
    expect(resident(s, 'C2-1').status).toBe('injured')
  })

  it('o ilhado nunca volta, mesmo que a quadra seque', () => {
    let s = atLevel(base, 12)
    s = patchResident(s, 'A2-1', { status: 'stranded', tileId: null })
    s = patchVolunteer(s, 'ana', { tileId: 'B2' })
    s = act(s, { type: 'reinforce', tileId: 'A2' })
    expect(water(s, 'A2')).toBe('flooded')
    expect(resident(s, 'A2-1').status).toBe('stranded')
    expect(houseMark(s, 'A2')).toBe('lost')
  })
})

describe('previsão', () => {
  it('Tranquilo e Normal mostram as próximas cartas de graça', () => {
    const easy = withDeck(setup(['radio-host', 'medic'], 'easy'), ['rain', 'storm', 'cloudy'])
    expect(forecastView(easy)).toEqual({ kind: 'peek', cards: ['rain', 'storm'] })
    const normal = withDeck(setup(['radio-host', 'medic']), ['drizzle', 'rain'])
    expect(forecastView(normal)).toEqual({ kind: 'peek', cards: ['drizzle'] })
  })

  it('mostra só as cartas que restam no baralho', () => {
    const s = withDeck(setup(['radio-host', 'medic'], 'easy'), ['rain'], ['storm'])
    expect(forecastView(s)).toEqual({ kind: 'peek', cards: ['rain'] })
  })

  it('sem Radialista não há previsão', () => {
    expect(forecastView(setup(['medic', 'engineer']))).toBeNull()
  })

  describe('Alerta de temporal (Tempestade)', () => {
    const storm = withDeck(setup(['radio-host', 'medic'], 'storm'), ['storm', 'cloudy'])

    it('custa 1 ação e diz se a próxima carta é Temporal', () => {
      expect(forecastView(storm)).toEqual({
        kind: 'storm-warning',
        cards: 1,
        cost: 1,
        result: null,
      })
      const s = act(storm, { type: 'forecast' })
      expect(s.stormWarning).toBe(true)
      expect(volunteer(s, 'ana').actionsLeft).toBe(2)
      expect(forecastView(s)).toMatchObject({ result: true })
      const calm = act(withDeck(storm, ['rain', 'storm']), { type: 'forecast' })
      expect(calm.stormWarning).toBe(false)
    })

    it('é um ponto sem volta para o desfazer', () => {
      let s = act(storm, { type: 'move', to: 'C3' })
      s = act(s, { type: 'forecast' })
      expect(rejectReason(s, { type: 'undo' })).toBe('nothing-to-undo')
      s = act(s, { type: 'move', to: 'B3' })
      s = act(s, { type: 'undo' })
      expect(volunteer(s, 'ana').tileId).toBe('C3')
      expect(s.stormWarning).toBe(true)
    })

    it('uma vez por turno, só a Radialista e só na Tempestade', () => {
      const used = act(storm, { type: 'forecast' })
      expect(rejectReason(used, { type: 'forecast' })).toBe('forecast-unavailable')
      expect(rejectReason(activate(storm, 'bruno'), { type: 'forecast' })).toBe('role-required')
      expect(rejectReason(setup(['radio-host', 'medic']), { type: 'forecast' })).toBe(
        'forecast-unavailable',
      )
    })

    it('a resposta some no fim do turno', () => {
      const s = act(act(storm, { type: 'forecast' }), { type: 'end-turn' })
      expect(s.stormWarning).toBeNull()
    })
  })
})

describe('desfazer', () => {
  it('volta ao estado anterior, ação por ação', () => {
    const start = setup()
    const one = act(start, { type: 'move', to: 'C3' })
    const two = act(one, { type: 'move', to: 'D3' })
    expect(act(two, { type: 'undo' })).toEqual(one)
    expect(act(act(two, { type: 'undo' }), { type: 'undo' })).toEqual(start)
    expect(rejectReason(start, { type: 'undo' })).toBe('nothing-to-undo')
  })

  it('desfaz pegar morador', () => {
    const start = patchVolunteer(setup(), 'ana', { tileId: 'C2' })
    const picked = act(start, { type: 'pick-up', residentId: 'C2-1' })
    expect(act(picked, { type: 'undo' })).toEqual(start)
  })

  it('não atravessa o fim do turno', () => {
    let s = act(setup(), { type: 'move', to: 'C3' })
    s = act(s, { type: 'end-turn' })
    expect(rejectReason(s, { type: 'undo' })).toBe('nothing-to-undo')
  })
})

describe('fim de turno e chuva', () => {
  it('compra a carta, sobe o nível e passa a vez', () => {
    const s = withDeck(setup(), ['rain', 'cloudy', 'drizzle'])
    const events = eventsOf(s, { type: 'end-turn' })
    const next = act(s, { type: 'end-turn' })
    expect(events.map((e) => e.type)).toEqual([
      'turn-ended',
      'rain-drawn',
      'level-rose',
      'turn-started',
    ])
    expect(next).toMatchObject({ riverLevel: 2, turn: 2, activeSeat: 'bruno' })
    expect(next.rainDeck).toEqual(['cloudy', 'drizzle'])
    expect(next.rainDiscard).toEqual(['rain'])
    expect(next.volunteers.map((v) => v.actionsLeft)).toEqual([0, 3])
  })

  it('Nublado não sobe o nível', () => {
    const s = withDeck(setup(), ['cloudy', 'rain'])
    expect(eventsOf(s, { type: 'end-turn' }).map((e) => e.type)).not.toContain('level-rose')
  })

  it('volta ao primeiro assento depois do último', () => {
    let s = withDeck(setup(), ['cloudy', 'cloudy', 'cloudy'])
    s = act(act(s, { type: 'end-turn' }), { type: 'end-turn' })
    expect(s).toMatchObject({ activeSeat: 'ana', turn: 3 })
  })

  it('reembaralha o descarte logo que o baralho acaba', () => {
    const s = withDeck(setup(), ['drizzle'], ['storm', 'rain', 'cloudy'])
    const next = act(s, { type: 'end-turn' })
    expect(next.rainDiscard).toEqual([])
    expect([...next.rainDeck].sort()).toEqual(['cloudy', 'drizzle', 'rain', 'storm'])
  })
})

describe('água e moradores (regras, seção 6)', () => {
  it('quadra que alaga fere os moradores saudáveis dela', () => {
    const s = withDeck(atLevel(setup(), 4), ['drizzle'])
    const events = eventsOf(s, { type: 'end-turn' })
    const next = act(s, { type: 'end-turn' })
    expect(events).toContainEqual({ type: 'tile-flooded', tileId: 'B1' })
    expect(events).toContainEqual({ type: 'resident-injured', residentId: 'B1-1', tileId: 'B1' })
    expect(resident(next, 'B1-1').status).toBe('injured')
    expect(resident(next, 'C2-1').status).toBe('healthy')
  })

  it('morador carregado não sofre efeito da água', () => {
    let s = withDeck(atLevel(setup(), 4), ['drizzle'])
    s = carry(patchVolunteer(s, 'ana', { tileId: 'B2' }), 'ana', 'B1-1')
    expect(resident(act(s, { type: 'end-turn' }), 'B1-1').status).toBe('healthy')
  })

  it('quadra que submerge ilha os moradores; o 4º ilhado derrota a equipe', () => {
    const s = withDeck(atLevel(setup(), 11), ['drizzle'])
    const events = eventsOf(s, { type: 'end-turn' })
    const next = act(s, { type: 'end-turn' })
    expect(events).toContainEqual({
      type: 'resident-stranded',
      residentId: 'A4-1',
      tileId: 'A4',
      cause: 'water',
    })
    expect(countResidents(next).stranded).toBe(8)
    expect(next).toMatchObject({ phase: 'lost', lossReason: 'stranded' })
    expect(events.at(-1)).toEqual({ type: 'lost', reason: 'stranded' })
    expect(houseMark(next, 'A4')).toBe('lost')
  })

  it('curado fica saudável em quadra alagada e só volta a ferir numa nova transição', () => {
    // Todos salvos exceto C2-1; ana fora do cais para não vencer.
    let s = saveAllExcept(atLevel(setup(['firefighter', 'medic']), 12), ['C2-1'])
    s = patchResident(s, 'C2-1', { status: 'injured' })
    s = patchVolunteer(activate(s, 'bruno'), 'bruno', { tileId: 'C3' })
    s = patchVolunteer(s, 'ana', { tileId: 'C3' })
    s = act(s, { type: 'heal', residentId: 'C2-1' })
    s = act(withDeck(s, ['cloudy', 'cloudy']), { type: 'end-turn' })
    expect(water(s, 'C2')).toBe('flooded')
    expect(resident(s, 'C2-1').status).toBe('healthy')

    // Secou com saco de areia e alagou de novo: fere outra vez.
    let dried = saveAllExcept(setup(['firefighter', 'medic']), ['C2-1'])
    dried = { ...dried, tiles: dried.tiles.map((t) => (t.id === 'C2' ? { ...t, sandbags: 1 } : t)) }
    dried = patchVolunteer(atLevel(dried, 12), 'ana', { tileId: 'C3' })
    expect(water(dried, 'C2')).toBe('dry')
    const wet = act(withDeck(dried, ['storm', 'cloudy']), { type: 'end-turn' })
    expect(water(wet, 'C2')).toBe('flooded')
    expect(resident(wet, 'C2-1').status).toBe('injured')
  })
})

describe('voluntário apanhado pela água (regras, seção 8, a testar)', () => {
  // Nível 18: B2 (altura 2) alagada; a Garoa leva a 19 e B2 submerge.
  function scenario() {
    let s = saveAllExcept(atLevel(setup(['firefighter', 'medic', 'boat-pilot']), 18), ['C2-1'])
    s = patchVolunteer(s, 'ana', { tileId: 'C3' })
    s = patchVolunteer(s, 'carla', { tileId: 'B2' })
    s = carry(patchVolunteer(s, 'bruno', { tileId: 'B2' }), 'bruno', 'C2-1')
    return withDeck(s, ['drizzle', 'cloudy', 'cloudy'])
  }

  it('vai para o cais, os moradores carregados ficam ilhados e a casa ganha ✗', () => {
    const s = scenario()
    const events = eventsOf(s, { type: 'end-turn' })
    const next = act(s, { type: 'end-turn' })
    expect(events).toContainEqual({
      type: 'volunteer-swept',
      seat: 'bruno',
      from: 'B2',
      to: 'B3',
      strandedResidentIds: ['C2-1'],
    })
    expect(events).toContainEqual({
      type: 'resident-stranded',
      residentId: 'C2-1',
      tileId: 'B2',
      cause: 'swept',
    })
    expect(volunteer(next, 'bruno')).toMatchObject({ tileId: 'B3', carrying: [] })
    expect(resident(next, 'C2-1').status).toBe('stranded')
    expect(houseMark(next, 'C2')).toBe('lost')
    expect(next.phase).toBe('playing')
  })

  it('a Barqueira é imune', () => {
    const next = act(scenario(), { type: 'end-turn' })
    expect(volunteer(next, 'carla').tileId).toBe('B2')
    expect(water(next, 'B2')).toBe('submerged')
  })

  it('perde o turno seguinte, mas a chuva desse turno ainda cai', () => {
    const s = scenario()
    const events = eventsOf(s, { type: 'end-turn' })
    const next = act(s, { type: 'end-turn' })
    expect(events.filter((e) => e.type === 'rain-drawn')).toHaveLength(2)
    expect(events).toContainEqual({ type: 'turn-skipped', seat: 'bruno', turn: 2 })
    expect(next).toMatchObject({ activeSeat: 'carla', turn: 3 })
    expect(volunteer(next, 'bruno')).toMatchObject({ skipNextTurn: false, actionsLeft: 0 })
    expect(volunteer(next, 'carla').actionsLeft).toBe(3)
  })

  it('sem chuva no turno perdido, se os dados mandarem', () => {
    const s = withRoleParams(scenario(), { sweptDrawsRainOnSkippedTurn: false })
    expect(eventsOf(s, { type: 'end-turn' }).filter((e) => e.type === 'rain-drawn')).toHaveLength(1)
  })

  it('derrota imediata nas dificuldades listadas nos dados', () => {
    const s = withRoleParams(scenario(), { immediateLossOnSwept: ['normal'] })
    expect(act(s, { type: 'end-turn' })).toMatchObject({ phase: 'lost', lossReason: 'swept' })
  })

  it('levado ao cais conta para a vitória', () => {
    let s = saveAllExcept(atLevel(setup(), 18))
    s = withDeck(patchVolunteer(s, 'bruno', { tileId: 'B2' }), ['drizzle'])
    expect(act(s, { type: 'end-turn' })).toMatchObject({ phase: 'won' })
  })

  it('a derrota tem prioridade quando as duas acontecem juntas', () => {
    // Vitória e derrota por ilhados nunca coincidem (moradores = meta + 3, validado no schema).
    // O caso real: a chuva leva o nível a 24 e, ao mesmo tempo, leva o último voluntário ao cais.
    // B2 com 2 sacos: alaga em 18 e submerge em 25.
    let s = saveAllExcept(setup())
    s = { ...s, tiles: s.tiles.map((t) => (t.id === 'B2' ? { ...t, sandbags: 2 } : t)) }
    s = patchVolunteer(atLevel(s, 23), 'bruno', { tileId: 'B2' })
    expect(water(s, 'B2')).toBe('flooded')
    const events = eventsOf(withDeck(s, ['rain']), { type: 'end-turn' })
    const next = act(withDeck(s, ['rain']), { type: 'end-turn' })
    expect(events.map((e) => e.type)).toContain('volunteer-swept')
    expect(next.volunteers.every((v) => v.tileId === 'B3')).toBe(true)
    expect(next).toMatchObject({ phase: 'lost', lossReason: 'level' })
  })
})

describe('vitória e derrota', () => {
  it('vence quando a meta foi atingida e todos chegam ao cais', () => {
    let s = activate(saveAllExcept(setup()), 'bruno')
    s = patchVolunteer(s, 'bruno', { tileId: 'C3' })
    const events = eventsOf(s, { type: 'move', to: 'B3' })
    const next = act(s, { type: 'move', to: 'B3' })
    expect(events.at(-1)).toEqual({ type: 'won' })
    expect(next.phase).toBe('won')
    expect(rejectReason(next, { type: 'undo' })).toBe('game-over')
  })

  it('a igreja não encerra a partida', () => {
    let s = activate(saveAllExcept(setup()), 'bruno')
    s = patchVolunteer(patchVolunteer(s, 'ana', { tileId: 'D3' }), 'bruno', { tileId: 'C3' })
    expect(act(s, { type: 'move', to: 'D3' }).phase).toBe('playing')
  })

  it('não vence sem a meta', () => {
    let s = activate(saveAllExcept(setup(), ['A2-1', 'B1-1', 'E5-1', 'E2-1']), 'bruno')
    s = patchVolunteer(s, 'bruno', { tileId: 'C3' })
    expect(countResidents(s).safe).toBe(8)
    expect(act(s, { type: 'move', to: 'B3' }).phase).toBe('playing')
  })

  it('perde quando o nível chega a 24', () => {
    let s = saveAllExcept(atLevel(setup(), 23))
    s = withDeck(patchVolunteer(s, 'ana', { tileId: 'C3' }), ['drizzle'])
    expect(act(s, { type: 'end-turn' })).toMatchObject({ phase: 'lost', lossReason: 'level' })
  })
})

describe('marca das casas (houseMark)', () => {
  it('casa com morador esperando não tem marca', () => {
    expect(houseMark(setup(), 'C2')).toBeNull()
  })

  it('casa com todos retirados tem ✓, mesmo com morador ainda carregado', () => {
    const s = carry(setup(), 'ana', 'C2-1')
    expect(houseMark(s, 'C2')).toBe('cleared')
    expect(houseMark(saveAllExcept(setup()), 'C2')).toBe('cleared')
  })

  it('casa com 2 moradores, um salvo e um esperando, não tem marca', () => {
    const s = saveAllExcept(setup(), ['A4-2'])
    expect(houseMark(s, 'A4')).toBeNull()
  })

  it('casa com algum ilhado tem ✗', () => {
    let s = saveAllExcept(setup(), ['A4-2'])
    s = patchResident(s, 'A4-2', { status: 'stranded', tileId: null })
    expect(houseMark(s, 'A4')).toBe('lost')
  })

  it('quadra que não é casa não tem marca', () => {
    expect(houseMark(setup(), 'C3')).toBeNull()
    expect(houseMark(setup(), 'D3')).toBeNull()
  })
})

describe('legalActions', () => {
  it('no início: andar para as 4 vizinhas do cais ou encerrar', () => {
    const actions = legalActions(setup())
    expect(actions).toEqual(
      expect.arrayContaining([
        { type: 'move', to: 'B2' },
        { type: 'move', to: 'A3' },
        { type: 'move', to: 'C3' },
        { type: 'move', to: 'B4' },
        { type: 'end-turn' },
      ]),
    )
    expect(actions).toHaveLength(5)
  })

  it('nenhuma ação depois do fim', () => {
    expect(legalActions({ ...setup(), phase: 'lost', lossReason: 'level' })).toEqual([])
  })
})

describe('adjacentTileIds', () => {
  it('lista as vizinhas ortogonais e, se pedido, as diagonais', () => {
    expect(adjacentTileIds(setup(), 'B3', false).sort()).toEqual(['A3', 'B2', 'B4', 'C3'])
    expect(adjacentTileIds(setup(), 'A1', true).sort()).toEqual(['A2', 'B1', 'B2'])
    expect(adjacentTileIds(setup(), 'Z9', false)).toEqual([])
  })
})

describe('Chamado pelo rádio (Radialista)', () => {
  const base = setup(['radio-host', 'medic', 'engineer'])

  it('por 1 ação, o próximo voluntário ganha 1 ação no turno dele', () => {
    const events = transition(base, { type: 'radio-call' }, { seat: 'ana' })
    expect(events.ok && events.events).toEqual([
      { type: 'radio-called', seat: 'ana', target: 'bruno', bonus: 1 },
    ])
    let s = act(base, { type: 'radio-call' })
    expect(volunteer(s, 'ana').actionsLeft).toBe(2)
    expect(volunteer(s, 'bruno').bonusActions).toBe(1)
    s = act(withDeck(s, ['cloudy', 'cloudy']), { type: 'end-turn' })
    expect(volunteer(s, 'bruno')).toMatchObject({ actionsLeft: 4, bonusActions: 0 })
    s = act(s, { type: 'end-turn' })
    expect(volunteer(s, 'carla').actionsLeft).toBe(3)
  })

  it('uma vez por turno, só a Radialista', () => {
    const used = act(base, { type: 'radio-call' })
    expect(rejectReason(used, { type: 'radio-call' })).toBe('radio-call-used')
    expect(rejectReason(activate(base, 'bruno'), { type: 'radio-call' })).toBe('role-required')
    const tired = patchVolunteer(base, 'ana', { actionsLeft: 0 })
    expect(rejectReason(tired, { type: 'radio-call' })).toBe('not-enough-actions')
  })

  it('pode ser desfeito', () => {
    expect(act(act(base, { type: 'radio-call' }), { type: 'undo' })).toEqual(base)
  })

  it('volta a valer no turno seguinte da Radialista', () => {
    let s = act(withDeck(base, ['cloudy', 'cloudy', 'cloudy', 'cloudy']), { type: 'radio-call' })
    for (let i = 0; i < 3; i++) s = act(s, { type: 'end-turn' })
    expect(s.activeSeat).toBe('ana')
    expect(rejectReason(s, { type: 'radio-call' })).toBe('ok')
  })

  it('o bônus se perde se o turno do voluntário for perdido', () => {
    let s = patchVolunteer(base, 'bruno', { skipNextTurn: true, bonusActions: 1 })
    s = act(withDeck(s, ['cloudy', 'cloudy', 'cloudy']), { type: 'end-turn' })
    expect(s.activeSeat).toBe('carla')
    expect(volunteer(s, 'bruno').bonusActions).toBe(0)
  })
})

describe('variação do mapa (cenários e espelhamento)', () => {
  const seats = [
    { seat: 'ana', role: 'medic' as const },
    { seat: 'bruno', role: 'engineer' as const },
  ]
  const make = (seed: number, variation?: { scenario: number; mirrored: boolean }) =>
    newGame({ difficulty: 'normal', seed, seats, ...(variation ? { variation } : {}) })

  it('espelhado de cima para baixo: igreja, cais, casas e alturas trocam de linha', () => {
    const original = make(1, { scenario: 0, mirrored: false })
    const mirrored = make(1, { scenario: 0, mirrored: true })
    expect(mirrored.config.variation).toEqual({ scenario: 0, mirrored: true })
    expect(mirrored.tiles.find((t) => t.kind === 'church')?.id).toBe('D4')
    expect(mirrored.tiles.find((t) => t.kind === 'dock')?.id).toBe('B4')
    expect(mirrored.volunteers.every((v) => v.tileId === 'B4')).toBe(true)
    // A4 (2 moradores) vira A3; a linha 6 (toda altura 1) vira a linha 1.
    expect(mirrored.residents.filter((r) => r.homeTileId === 'A3')).toHaveLength(2)
    for (const tile of original.tiles) {
      const twin = mirrored.tiles.find((t) => t.x === tile.x && t.y === 5 - tile.y)
      expect(twin?.height, tile.id).toBe(tile.height)
      expect(twin?.kind, tile.id).toBe(tile.kind)
    }
  })

  it('a água se comporta igual no mapa espelhado', () => {
    const original = atLevel(make(1, { scenario: 0, mirrored: false }), 12)
    const mirrored = atLevel(make(1, { scenario: 0, mirrored: true }), 12)
    for (const tile of original.tiles) {
      const twin = mirrored.tiles.find((t) => t.x === tile.x && t.y === 5 - tile.y)
      expect(twin?.water, tile.id).toBe(tile.water)
    }
  })

  it('a semente sorteia a variação de forma reprodutível', () => {
    expect(make(9).config.variation).toEqual(make(9).config.variation)
    const seen = new Set<string>()
    for (let seed = 0; seed < 64; seed++) {
      const { mirrored } = make(seed).config.variation
      seen.add(String(mirrored))
    }
    expect(seen).toEqual(new Set(['true', 'false']))
  })

  it('sorteia entre todos os cenários da dificuldade', () => {
    const data = {
      ...defaultGameData,
      difficulties: {
        ...defaultGameData.difficulties,
        normal: {
          ...defaultGameData.difficulties.normal,
          extraResidentScenarios: [
            ['A4', 'B5'],
            ['C2', 'C5'],
            ['F3', 'E5'],
          ],
        },
      },
    }
    const used = new Set<number>()
    for (let seed = 0; seed < 60; seed++) {
      used.add(newGame({ difficulty: 'normal', seed, seats }, data).config.variation.scenario)
    }
    expect([...used].sort()).toEqual([0, 1, 2])
    const forced = newGame(
      { difficulty: 'normal', seed: 1, seats, variation: { scenario: 2, mirrored: false } },
      data,
    )
    expect(forced.residents.filter((r) => r.id.endsWith('-2')).map((r) => r.homeTileId)).toEqual([
      'F3',
      'E5',
    ])
  })

  it('recusa variação inválida', () => {
    expect(() => make(1, { scenario: 5, mirrored: false })).toThrow(/Cenário inexistente/)
    const flat = { ...defaultGameData, map: { ...defaultGameData.map, allowMirror: false } }
    expect(() =>
      newGame(
        { difficulty: 'normal', seed: 1, seats, variation: { scenario: 0, mirrored: true } },
        flat,
      ),
    ).toThrow(/espelhado/)
    for (let seed = 0; seed < 20; seed++) {
      expect(newGame({ difficulty: 'normal', seed, seats }, flat).config.variation.mirrored).toBe(
        false,
      )
    }
  })
})

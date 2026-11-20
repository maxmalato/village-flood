import { describe, expect, it } from 'vitest'
import { addSeat, defaultSetup, removeSeat, validateSetup } from './setup.ts'

describe('setup do lobby', () => {
  it('começa com 3 assentos, 1 pessoa e papéis diferentes', () => {
    const s = defaultSetup()
    expect(s.seats).toHaveLength(3)
    expect(s.seats.filter((x) => !x.bot)).toHaveLength(1)
    expect(validateSetup(s)).toEqual([])
  })

  it('adiciona até 4 e remove até 2 assentos, com papel livre', () => {
    const four = addSeat(defaultSetup())
    expect(four.seats).toHaveLength(4)
    expect(new Set(four.seats.map((x) => x.role)).size).toBe(4)
    expect(addSeat(four).seats).toHaveLength(4)
    expect(removeSeat(removeSeat(four, 0), 0).seats).toHaveLength(2)
    expect(removeSeat(removeSeat(removeSeat(four, 0), 0), 0).seats).toHaveLength(2)
  })

  it('exige uma pessoa, papéis diferentes e apelidos', () => {
    const s = defaultSetup()
    expect(validateSetup({ ...s, seats: s.seats.map((x) => ({ ...x, bot: true })) })).toContain(
      'errorHuman',
    )
    expect(validateSetup({ ...s, seats: s.seats.map((x) => ({ ...x, role: 'medic' })) })).toContain(
      'errorRoles',
    )
    expect(validateSetup({ ...s, seats: s.seats.map((x) => ({ ...x, name: ' ' })) })).toContain(
      'errorNames',
    )
  })
})

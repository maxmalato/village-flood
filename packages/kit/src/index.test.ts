import { describe, expect, it } from 'vitest'
import { ROOM_CODE_LENGTH } from './index.ts'

describe('kit', () => {
  it('usa código de sala com 6 caracteres', () => {
    expect(ROOM_CODE_LENGTH).toBe(6)
  })
})

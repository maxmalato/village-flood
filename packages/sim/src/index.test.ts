import { describe, expect, it } from 'vitest'
import { reportHeader } from './index.ts'

describe('sim', () => {
  it('monta o cabeçalho do relatório', () => {
    expect(reportHeader()).toBe('Simulação: village-flood')
  })
})

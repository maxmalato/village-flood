import { describe, expect, it } from 'vitest'
import { locales, messages, pickLocale, t } from './i18n.ts'

describe('i18n', () => {
  it('todos os idiomas têm as mesmas chaves e nenhum texto vazio', () => {
    const reference = Object.keys(messages['pt-BR']).sort()
    for (const locale of locales) {
      expect(Object.keys(messages[locale]).sort()).toEqual(reference)
      for (const text of Object.values(messages[locale])) expect(text.trim()).not.toBe('')
    }
  })

  it('escolhe o idioma pelas preferências, com PT-BR como padrão', () => {
    expect(pickLocale(['en-US', 'pt-BR'])).toBe('en')
    expect(pickLocale(['pt-PT'])).toBe('pt-BR')
    expect(pickLocale(['fr-FR'])).toBe('pt-BR')
    expect(pickLocale([])).toBe('pt-BR')
  })

  it('traduz uma chave', () => {
    expect(t('en', 'app.title')).toBe('Village Flood')
  })
})

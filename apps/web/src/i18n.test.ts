import { describe, expect, it } from 'vitest'
import { locales, messages, paramsOf, pickLocale, t } from './i18n.ts'

describe('i18n', () => {
  it('todos os idiomas têm as mesmas chaves, os mesmos parâmetros e nenhum texto vazio', () => {
    const reference = messages['pt-BR']
    for (const locale of locales) {
      expect(Object.keys(messages[locale]).sort()).toEqual(Object.keys(reference).sort())
      for (const [key, text] of Object.entries(messages[locale])) {
        expect(text.trim(), key).not.toBe('')
        expect(paramsOf(text), key).toEqual(paramsOf(reference[key as keyof typeof reference]))
      }
    }
  })

  it('escolhe o idioma pelas preferências, com PT-BR como padrão', () => {
    expect(pickLocale(['en-US', 'pt-BR'])).toBe('en')
    expect(pickLocale(['pt-PT'])).toBe('pt-BR')
    expect(pickLocale(['fr-FR'])).toBe('pt-BR')
    expect(pickLocale([])).toBe('pt-BR')
  })

  it('troca os parâmetros', () => {
    expect(t('en', 'app.title')).toBe('Village Flood')
    expect(t('pt-BR', 'game.goal', { goal: 9 })).toBe('Meta: salvar 9 moradores')
    expect(t('pt-BR', 'game.goal')).toBe('Meta: salvar {goal} moradores')
  })
})

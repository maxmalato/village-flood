// Textos da interface em PT-BR e inglês (i18n desde o início).
// Toda chave nova entra nos dois idiomas; o teste garante que os dois têm as mesmas chaves.

export const locales = ['pt-BR', 'en'] as const
export type Locale = (typeof locales)[number]

const ptBR = {
  'app.title': 'Enchente na Vila',
  'app.tagline': 'Jogo cooperativo: levem os moradores até a igreja antes que o rio suba.',
  'app.status': 'Em construção.',
  'app.language': 'Idioma',
} as const

export type MessageKey = keyof typeof ptBR

const en: Record<MessageKey, string> = {
  'app.title': 'Village Flood',
  'app.tagline': 'Co-op game: bring the residents to the church before the river rises.',
  'app.status': 'Under construction.',
  'app.language': 'Language',
}

export const messages: Record<Locale, Record<MessageKey, string>> = { 'pt-BR': ptBR, en }

/** Escolhe o idioma a partir das preferências do navegador. PT-BR é o padrão. */
export function pickLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const lower = tag.toLowerCase()
    if (lower.startsWith('pt')) return 'pt-BR'
    if (lower.startsWith('en')) return 'en'
  }
  return 'pt-BR'
}

/** Devolve o texto da chave no idioma pedido. */
export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key]
}

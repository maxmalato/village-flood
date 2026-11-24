// Conteúdo da tela "Como jogar": seções curtas com os números vindos dos dados do jogo
// (nada fixo no código: se a calibração mudar um valor, o texto acompanha).
import { defaultGameData, roleIds } from '@village-flood/engine'
import type { MessageKey, Params } from '../i18n.ts'

export interface HowToItem {
  readonly key: MessageKey
  readonly params?: Params
  /** Item de papel: nome em destaque e habilidade ao lado. */
  readonly role?: { readonly name: MessageKey; readonly info: MessageKey }
}

export interface HowToSection {
  readonly title: MessageKey
  readonly items: readonly HowToItem[]
}

export function howToSections(): HowToSection[] {
  const { rules } = defaultGameData
  const levels = Object.values(defaultGameData.difficulties).map((d) => d.goal)
  return [
    {
      title: 'howto.goalTitle',
      items: [
        { key: 'howto.goal1' },
        { key: 'howto.goal2', params: { min: Math.min(...levels), max: Math.max(...levels) } },
        { key: 'howto.goal3' },
      ],
    },
    {
      title: 'howto.turnTitle',
      items: [
        { key: 'howto.turn1', params: { n: rules.actionsPerTurn } },
        {
          key: 'howto.turn2',
          params: { dry: rules.costs.move.dry, flooded: rules.costs.move.flooded },
        },
        {
          key: 'howto.turn3',
          params: { healthy: rules.costs.pickUp.healthy, injured: rules.costs.pickUp.injured },
        },
        { key: 'howto.turn4' },
        { key: 'howto.turn5' },
      ],
    },
    {
      title: 'howto.waterTitle',
      items: [
        { key: 'howto.water1' },
        { key: 'howto.water2' },
        { key: 'howto.water3' },
        { key: 'howto.water4', params: { n: rules.costs.reinforce } },
        { key: 'howto.water5' },
      ],
    },
    {
      title: 'howto.rolesTitle',
      items: [
        { key: 'howto.roles1' },
        ...roleIds.map((role) => ({
          key: `role.${role}` as MessageKey,
          role: { name: `role.${role}` as MessageKey, info: `roleInfo.${role}` as MessageKey },
        })),
      ],
    },
    {
      title: 'howto.endTitle',
      items: [
        { key: 'howto.end1' },
        { key: 'howto.end2', params: { n: rules.strandedLossCount, max: rules.maxRiverLevel } },
        { key: 'howto.end3' },
      ],
    },
    {
      title: 'howto.tipsTitle',
      items: [{ key: 'howto.tips1' }, { key: 'howto.tips2' }, { key: 'howto.tips3' }],
    },
  ]
}

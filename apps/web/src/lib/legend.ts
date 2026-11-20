// Itens da legenda: a mesma lista alimenta a legenda completa da mesa e do celular (spec, seção 9).
import type { MessageKey } from '../i18n.ts'

export type Swatch =
  | 'dry'
  | 'flooded'
  | 'submerged'
  | 'church'
  | 'dock'
  | 'injured'
  | 'cleared'
  | 'lost'
  | 'volunteer'
  | 'carrying'
  | 'cost'
  | 'hint'

export interface LegendItem {
  readonly swatch: Swatch
  readonly title: MessageKey
  readonly text: MessageKey
}

export interface LegendGroup {
  readonly title: MessageKey
  readonly items: readonly LegendItem[]
}

export const legendGroups: readonly LegendGroup[] = [
  {
    title: 'legend.tiles',
    items: [
      { swatch: 'dry', title: 'legend.dry', text: 'legend.dryText' },
      { swatch: 'flooded', title: 'legend.flooded', text: 'legend.floodedText' },
      { swatch: 'submerged', title: 'legend.submerged', text: 'legend.submergedText' },
    ],
  },
  {
    title: 'legend.places',
    items: [
      { swatch: 'church', title: 'legend.church', text: 'legend.churchText' },
      { swatch: 'dock', title: 'legend.dock', text: 'legend.dockText' },
      { swatch: 'injured', title: 'legend.injured', text: 'legend.injuredText' },
      { swatch: 'cleared', title: 'legend.cleared', text: 'legend.clearedText' },
      { swatch: 'lost', title: 'legend.lost', text: 'legend.lostText' },
    ],
  },
  {
    title: 'legend.people',
    items: [
      { swatch: 'volunteer', title: 'legend.volunteer', text: 'legend.volunteerText' },
      { swatch: 'carrying', title: 'legend.carrying', text: 'legend.carryingText' },
      { swatch: 'cost', title: 'legend.cost', text: 'legend.costText' },
      { swatch: 'hint', title: 'legend.hint', text: 'legend.hintText' },
    ],
  },
]

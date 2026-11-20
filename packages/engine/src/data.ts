// Dados padrão do jogo, carregados dos arquivos JSON e validados pelo schema.
import difficulties from '../data/difficulties.json' with { type: 'json' }
import map from '../data/maps/village-river.json' with { type: 'json' }
import rules from '../data/rules.json' with { type: 'json' }
import { parseGameData, type GameData } from './schema.ts'

/** Dados validados do mapa "Vila do Rio" com as regras e dificuldades atuais. */
export const defaultGameData: GameData = parseGameData({ rules, difficulties, map })

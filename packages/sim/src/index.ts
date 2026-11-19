// Simulação em lote com bots. O relatório real entra na Etapa 2.
import { BOTS_GAME_ID } from '@village-flood/bots'

/** Texto de cabeçalho do relatório da simulação. */
export function reportHeader(): string {
  return `Simulação: ${BOTS_GAME_ID}`
}

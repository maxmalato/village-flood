// Tipos das mensagens entre cliente e servidor.
// As mensagens (incluindo `pin` e `resync`) entram na Etapa 4.
import { GAME_ID } from '@village-flood/engine'

/** Versão do protocolo. Muda quando o formato das mensagens muda. */
export const PROTOCOL_VERSION = 1

/** Identificador do protocolo, ligado ao jogo. */
export const PROTOCOL_ID = `${GAME_ID}/v${PROTOCOL_VERSION}`

// Sons do jogo: curtos, sintetizados no navegador (Web Audio), sem arquivos de áudio.
// Para não virar barulho, cada grupo de eventos toca só o som mais importante.
import type { GameEvent, SeatId } from '@village-flood/engine'

export type Cue =
  | 'won'
  | 'lost'
  | 'swept'
  | 'stranded'
  | 'delivered'
  | 'submerged'
  | 'flooded'
  | 'rain'
  | 'healed'
  | 'sandbag'
  | 'radio'
  | 'your-turn'
  | 'step'

/** Do mais importante para o menos importante. */
const PRIORITY: readonly Cue[] = [
  'won',
  'lost',
  'swept',
  'stranded',
  'delivered',
  'submerged',
  'flooded',
  'rain',
  'healed',
  'sandbag',
  'radio',
  'your-turn',
  'step',
]

function cueOf(event: GameEvent, mySeat: SeatId | null): Cue | null {
  switch (event.type) {
    case 'won':
      return 'won'
    case 'lost':
      return 'lost'
    case 'volunteer-swept':
      return 'swept'
    case 'resident-stranded':
      return 'stranded'
    case 'delivered':
      return 'delivered'
    case 'tile-submerged':
      return 'submerged'
    case 'tile-flooded':
      return 'flooded'
    case 'rain-drawn':
      return 'rain'
    case 'healed':
      return 'healed'
    case 'sandbag-placed':
      return 'sandbag'
    case 'radio-called':
      return 'radio'
    case 'turn-started':
      return mySeat !== null && event.seat === mySeat ? 'your-turn' : null
    case 'moved':
    case 'picked-up':
      return 'step'
    default:
      return null
  }
}

/**
 * O som de um grupo de eventos (uma jogada). `mySeat`: assento deste aparelho no online, para o
 * aviso "sua vez"; null no modo local e na mesa (todos jogam na mesma tela).
 */
export function cueFor(events: readonly GameEvent[], mySeat: SeatId | null = null): Cue | null {
  let best: Cue | null = null
  for (const event of events) {
    const cue = cueOf(event, mySeat)
    if (cue && (best === null || PRIORITY.indexOf(cue) < PRIORITY.indexOf(best))) best = cue
  }
  return best
}

interface Note {
  /** Frequência em Hz (0: ruído, como chuva). */
  freq: number
  /** Início e duração em segundos. */
  at: number
  dur: number
  wave?: OscillatorType
  volume?: number
  /** Frequência final (deslize). */
  to?: number
  /** Tempo de entrada em segundos (padrão: 0,015 para notas, 0,25 para ruído). */
  attack?: number
}

// Notas originais, compostas para o jogo: arpejos curtos em dó maior para coisas boas,
// intervalos descendentes para perigo; a chuva são gotas (notas agudas e curtas) sobre um
// chiado baixo que entra devagar, sem estalo.
const C4 = 261.63
const E4 = 329.63
const G4 = 392.0
const C5 = 523.25
const E5 = 659.25
const G5 = 783.99
const D6 = 1174.66
const E6 = 1318.51
const G6 = 1567.98
const A6 = 1760.0

export const CUES: Record<Cue, readonly Note[]> = {
  won: [
    { freq: C4, at: 0, dur: 0.18 },
    { freq: E4, at: 0.14, dur: 0.18 },
    { freq: G4, at: 0.28, dur: 0.18 },
    { freq: C5, at: 0.42, dur: 0.5, volume: 0.22 },
    { freq: E5, at: 0.42, dur: 0.5, volume: 0.12 },
  ],
  lost: [
    { freq: G4, at: 0, dur: 0.3, wave: 'triangle' },
    { freq: E4, at: 0.25, dur: 0.3, wave: 'triangle' },
    { freq: C4, at: 0.5, dur: 0.7, wave: 'triangle', to: 220 },
  ],
  swept: [
    { freq: 0, at: 0, dur: 0.7, volume: 0.12, attack: 0.2 },
    { freq: 440, at: 0, dur: 0.5, wave: 'sawtooth', to: 220, volume: 0.08 },
  ],
  stranded: [
    { freq: 392, at: 0, dur: 0.2, wave: 'triangle' },
    { freq: 311.13, at: 0.18, dur: 0.35, wave: 'triangle' },
  ],
  delivered: [
    { freq: E5, at: 0, dur: 0.12 },
    { freq: G5, at: 0.1, dur: 0.25 },
  ],
  submerged: [{ freq: 180, at: 0, dur: 0.45, wave: 'sine', to: 90, volume: 0.25 }],
  flooded: [{ freq: 300, at: 0, dur: 0.3, wave: 'sine', to: 180, volume: 0.18 }],
  rain: [
    { freq: 0, at: 0, dur: 1.1, volume: 0.05, attack: 0.35 },
    { freq: G6, at: 0.05, dur: 0.14, volume: 0.06 },
    { freq: E6, at: 0.22, dur: 0.14, volume: 0.05 },
    { freq: A6, at: 0.38, dur: 0.14, volume: 0.06 },
    { freq: D6, at: 0.55, dur: 0.14, volume: 0.05 },
    { freq: G6, at: 0.72, dur: 0.18, volume: 0.05 },
  ],
  healed: [
    { freq: G4, at: 0, dur: 0.15, volume: 0.14 },
    { freq: C5, at: 0.12, dur: 0.3, volume: 0.14 },
  ],
  sandbag: [{ freq: 110, at: 0, dur: 0.15, wave: 'square', to: 70, volume: 0.1 }],
  radio: [
    { freq: 880, at: 0, dur: 0.07, wave: 'square', volume: 0.05 },
    { freq: 1175, at: 0.09, dur: 0.07, wave: 'square', volume: 0.05 },
  ],
  'your-turn': [
    { freq: C5, at: 0, dur: 0.12, volume: 0.16 },
    { freq: C5, at: 0.16, dur: 0.2, volume: 0.16 },
  ],
  step: [{ freq: 520, at: 0, dur: 0.05, wave: 'sine', volume: 0.06 }],
}

/** Agenda as notas de um som num contexto de áudio (também serve para gerar arquivos de teste). */
export function scheduleCue(ctx: BaseAudioContext, cue: Cue, start: number) {
  for (const note of CUES[cue]) playNote(ctx, start, note)
}

function playNote(ctx: BaseAudioContext, start: number, note: Note) {
  const gain = ctx.createGain()
  const t0 = start + note.at
  const t1 = t0 + note.dur
  const volume = note.volume ?? 0.15
  const attack = note.attack ?? (note.freq === 0 ? 0.25 : 0.015)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + Math.min(attack, note.dur / 2))
  gain.gain.exponentialRampToValueAtTime(0.0001, t1)
  gain.connect(ctx.destination)
  if (note.freq === 0) {
    // ruído filtrado (chuva, água)
    const length = Math.ceil(ctx.sampleRate * note.dur)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    source.buffer = buffer
    // passa-faixa nos agudos: soa como chiado de chuva, não como estouro
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.setValueAtTime(0.7, t0)
    filter.frequency.setValueAtTime(3000, t0)
    filter.frequency.exponentialRampToValueAtTime(1800, t1)
    source.connect(filter).connect(gain)
    source.start(t0)
    source.stop(t1)
    return
  }
  const osc = ctx.createOscillator()
  osc.type = note.wave ?? 'sine'
  osc.frequency.setValueAtTime(note.freq, t0)
  if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, t1)
  osc.connect(gain)
  osc.start(t0)
  osc.stop(t1 + 0.02)
}

const STORAGE_KEY = 'village-flood.sound'

/** Toca os sons; ligado por padrão, com a preferência lembrada neste aparelho. */
export class SoundPlayer {
  private context: AudioContext | null = null
  private listeners = new Set<(on: boolean) => void>()
  enabled: boolean

  constructor() {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      // sem armazenamento: segue ligado
    }
    this.enabled = saved !== 'off'
  }

  setEnabled(on: boolean) {
    this.enabled = on
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
    } catch {
      // idem
    }
    for (const listener of this.listeners) listener(on)
  }

  onChange(listener: (on: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  play(cue: Cue | null) {
    if (!cue || !this.enabled || typeof AudioContext === 'undefined') return
    try {
      this.context ??= new AudioContext()
      const ctx = this.context
      // o navegador só libera o som depois de um toque ou tecla; antes disso, fica em silêncio
      if (ctx.state === 'suspended') void ctx.resume()
      const start = ctx.currentTime + 0.01
      scheduleCue(ctx, cue, start)
    } catch {
      // sem áudio no aparelho: o jogo segue sem som
    }
  }
}

export const sound = new SoundPlayer()

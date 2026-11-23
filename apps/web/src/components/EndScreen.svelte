<script lang="ts">
  import { countResidents } from '@village-flood/engine'
  import { t, type Locale, type MessageKey } from '../i18n.ts'
  import type { GameController, SeatStats } from '../lib/controller.ts'
  import { gameSummary } from '../lib/summary.ts'
  import Icon from './Icon.svelte'

  let {
    game,
    locale,
    onagain,
    onhome,
    waitText = null,
    homeLabel = 'end.home',
    showSummary = true,
  }: {
    game: GameController
    locale: Locale
    /** null: este aparelho não começa outra partida (online, quem não organiza a sala). */
    onagain: (() => void) | null
    onhome: () => void
    waitText?: string | null
    homeLabel?: MessageKey
    /** Botão "Copiar resumo" (a TV da mesa não mostra: não tem onde colar). */
    showSummary?: boolean
  } = $props()

  // Resumo para o roteiro das partidas de teste; a duração conta até esta tela abrir.
  const endedAt = Date.now()
  const summary = $derived(
    gameSummary(
      {
        state: game.state,
        seats: game.seats,
        stats: game.stats,
        mode: game.mode,
        durationMs: game.startedAt === null ? null : endedAt - game.startedAt,
      },
      locale,
    ),
  )
  let copyState = $state<'idle' | 'copied' | 'failed'>('idle')

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      copyState = 'copied'
    } catch {
      // sem HTTPS (ex.: rede local) o navegador não deixa copiar: mostra o texto para copiar à mão
      copyState = 'failed'
    }
  }

  const gs = $derived(game.state)
  const won = $derived(gs.phase === 'won')
  const counts = $derived(countResidents(gs))
  const reason = $derived(gs.lossReason ?? 'stranded')

  function best(key: keyof SeatStats) {
    let winner: { name: string; n: number } | null = null
    for (const seat of game.seats) {
      const n = game.stats[seat.seat]?.[key] ?? 0
      if (n > 0 && (!winner || n > winner.n)) winner = { name: seat.name, n }
    }
    return winner
  }
  const highlights = $derived(
    [
      {
        key: 'rescues' as const,
        title: 'end.mostRescues' as const,
        text: 'end.mostRescuesText' as const,
      },
      {
        key: 'heals' as const,
        title: 'end.mostHeals' as const,
        text: 'end.mostHealsText' as const,
      },
      {
        key: 'radioCalls' as const,
        title: 'end.mostCalls' as const,
        text: 'end.mostCallsText' as const,
      },
    ]
      .map((h) => ({ ...h, winner: best(h.key) }))
      .filter((h) => h.winner !== null),
  )
</script>

<main class="end">
  <span class="badge" class:won aria-hidden="true">
    <Icon name={won ? 'dock' : 'cloud'} size={64} color="#10263B" />
  </span>
  <p class="kicker">{t(locale, won ? 'end.victory' : 'end.defeat')}</p>
  <h1 tabindex="-1">
    {won ? t(locale, 'end.wonTitle') : t(locale, `end.lostTitle.${reason}` as MessageKey)}
  </h1>
  <p class="lead">
    {won
      ? t(locale, 'end.wonText', { safe: counts.safe })
      : t(locale, 'end.lostText', { safe: counts.safe, goal: gs.config.settings.goal })}
  </p>
  {#if !won}<p class="tip">{t(locale, `end.tip.${reason}` as MessageKey)}</p>{/if}

  <dl class="stats">
    <div>
      <dt>{t(locale, 'end.statSafe')}</dt>
      <dd>{counts.safe}/{counts.total}</dd>
    </div>
    <div>
      <dt>{t(locale, 'end.statLevel')}</dt>
      <dd>{gs.riverLevel}</dd>
    </div>
    <div>
      <dt>{t(locale, 'end.statTurn')}</dt>
      <dd>T{gs.turn}</dd>
    </div>
  </dl>

  {#if highlights.length > 0}
    <section class="highlights" aria-labelledby="highlights-title">
      <h2 id="highlights-title" class="panel-title">{t(locale, 'end.highlights')}</h2>
      {#each highlights as h (h.key)}
        <p>
          <strong>{t(locale, h.title)}</strong><br />{t(locale, h.text, {
            name: h.winner?.name ?? '',
            n: h.winner?.n ?? 0,
          })}
        </p>
      {/each}
    </section>
  {/if}

  {#if onagain}
    <button type="button" class="btn-primary" onclick={onagain}>{t(locale, 'end.again')}</button>
  {:else if waitText}
    <p class="tip" role="status">{waitText}</p>
  {/if}
  <button type="button" class="btn" onclick={onhome}>{t(locale, homeLabel)}</button>

  {#if showSummary}
    <button type="button" class="btn" onclick={copySummary}>{t(locale, 'summary.copy')}</button>
    <p class="copy-status" role="status">
      {copyState === 'copied'
        ? t(locale, 'summary.copied')
        : copyState === 'failed'
          ? t(locale, 'summary.copyFailed')
          : ''}
    </p>
    {#if copyState === 'failed'}
      <label class="summary">
        <span>{t(locale, 'summary.label')}</span>
        <textarea readonly rows="9" value={summary} onfocus={(e) => e.currentTarget.select()}
        ></textarea>
      </label>
    {/if}
  {/if}
</main>

<style>
  .end {
    max-width: 32rem;
    margin: 0 auto;
    padding: 32px 16px 48px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    text-align: center;
  }
  .badge {
    align-self: center;
    width: 112px;
    height: 112px;
    border-radius: 50%;
    background: var(--muted);
    border: 6px solid var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .badge.won {
    background: var(--accent);
  }
  .kicker {
    margin: 0;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  h1 {
    font-size: 2.2rem;
  }
  .lead,
  .tip {
    margin: 0;
    font-weight: 700;
    font-size: 1.1rem;
  }
  .tip {
    background: var(--panel);
    border-radius: 14px;
    padding: 12px 14px;
  }
  .stats {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .stats div {
    background: var(--panel);
    border-radius: 14px;
    padding: 10px 4px;
    display: flex;
    flex-direction: column-reverse;
  }
  dt {
    font-weight: 700;
    color: var(--muted);
  }
  dd {
    margin: 0;
    font-family: var(--font-title);
    font-size: 1.6rem;
    color: var(--accent-text);
  }
  .highlights {
    background: var(--card-bg);
    color: var(--card-text);
    border-radius: 16px;
    padding: 14px 18px;
    text-align: left;
  }
  .highlights .panel-title {
    color: var(--card-muted);
  }
  .copy-status {
    margin: 0;
    min-height: 1.2em;
    font-weight: 700;
    color: var(--muted);
  }
  .summary {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    font-weight: 700;
  }
  .summary textarea {
    width: 100%;
    padding: 8px 10px;
    border-radius: 10px;
    border: 2px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .highlights p {
    margin: 8px 0 0;
    font-weight: 700;
  }
</style>

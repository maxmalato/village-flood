<script lang="ts">
  import { countResidents } from '@village-flood/engine'
  import { t, type Locale, type MessageKey } from '../i18n.ts'
  import type { GameController, SeatStats } from '../lib/controller.ts'
  import Icon from './Icon.svelte'

  let {
    game,
    locale,
    onagain,
    onhome,
    waitText = null,
    homeLabel = 'end.home',
  }: {
    game: GameController
    locale: Locale
    /** null: este aparelho não começa outra partida (online, quem não organiza a sala). */
    onagain: (() => void) | null
    onhome: () => void
    waitText?: string | null
    homeLabel?: MessageKey
  } = $props()

  const state = $derived(game.state)
  const won = $derived(state.phase === 'won')
  const counts = $derived(countResidents(state))
  const reason = $derived(state.lossReason ?? 'stranded')

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
      : t(locale, 'end.lostText', { safe: counts.safe, goal: state.config.settings.goal })}
  </p>
  {#if !won}<p class="tip">{t(locale, `end.tip.${reason}` as MessageKey)}</p>{/if}

  <dl class="stats">
    <div>
      <dt>{t(locale, 'end.statSafe')}</dt>
      <dd>{counts.safe}/{counts.total}</dd>
    </div>
    <div>
      <dt>{t(locale, 'end.statLevel')}</dt>
      <dd>{state.riverLevel}</dd>
    </div>
    <div>
      <dt>{t(locale, 'end.statTurn')}</dt>
      <dd>T{state.turn}</dd>
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
  .highlights p {
    margin: 8px 0 0;
    font-weight: 700;
  }
</style>

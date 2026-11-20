<script lang="ts">
  import type { GameState } from '@village-flood/engine'
  import { t, type Locale } from '../i18n.ts'
  import { residentSummary } from '../lib/view.ts'

  let { state, locale }: { state: GameState; locale: Locale } = $props()
  const r = $derived(residentSummary(state))
</script>

<section class="panel" aria-labelledby="residents-title">
  <h2 id="residents-title" class="panel-title">{t(locale, 'residents.title')}</h2>
  <p class="row">
    <span class="label">{t(locale, 'residents.safe')}</span>
    <span class="count">
      <strong>{r.safe}</strong>
      {t(locale, 'residents.of', { goal: r.goal })}
    </span>
  </p>
  <div
    class="bar"
    role="meter"
    aria-valuemin={0}
    aria-valuemax={r.goal}
    aria-valuenow={Math.min(r.safe, r.goal)}
    aria-label={t(locale, 'residents.safe')}
  >
    <span class="fill" style:width="{Math.min(100, (r.safe / r.goal) * 100)}%"></span>
  </div>
  <p class="row">
    <span class="label">{t(locale, 'residents.stranded')}</span>
    <span class="dots" role="img" aria-label="{r.stranded} / {r.strandedLimit}">
      {#each { length: r.strandedLimit } as _, i (i)}
        <span class="dot" class:on={i < r.stranded}></span>
      {/each}
    </span>
  </p>
  <p class="note">
    {t(locale, 'residents.strandedRule', { n: r.strandedLimit })}
    {t(locale, 'residents.carrying', { n: r.carried })}
  </p>
</section>

<style>
  .row {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .label {
    font-weight: 800;
    font-size: 1.1rem;
  }
  .count {
    color: var(--muted);
    font-weight: 700;
  }
  .count strong {
    font-family: var(--font-title);
    font-size: 1.8rem;
    color: var(--text);
  }
  .bar {
    height: 12px;
    border-radius: 6px;
    background: var(--panel-strong);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    background: var(--ok);
  }
  .dots {
    display: flex;
    gap: 6px;
  }
  .dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--danger);
  }
  .dot.on {
    background: var(--danger);
  }
  .note {
    margin: 0;
    color: var(--muted);
    font-weight: 600;
    font-size: 0.95rem;
  }
</style>

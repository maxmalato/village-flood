<script lang="ts">
  import type { GameState } from '@village-flood/engine'
  import { t, type Locale } from '../i18n.ts'
  import { riverMarks, riverText } from '../lib/view.ts'

  let { state, locale }: { state: GameState; locale: Locale } = $props()
  const river = $derived(riverMarks(state))
  const pct = (n: number) => `${Math.min(100, (n / river.max) * 100)}%`
</script>

<section class="panel" aria-labelledby="river-title">
  <h2 id="river-title" class="panel-title">{t(locale, 'river.title')}</h2>
  <p class="value">
    <strong>{river.level}</strong>
    <span>{t(locale, 'river.of', { max: river.max })}</span>
  </p>
  <div
    class="bar"
    role="meter"
    aria-valuemin={0}
    aria-valuemax={river.max}
    aria-valuenow={river.level}
    aria-label={t(locale, 'river.title')}
  >
    <span class="fill" style:width={pct(river.level)}></span>
    {#each river.marks as mark (mark)}
      <span class="tick" style:left={pct(mark)}></span>
    {/each}
  </div>
  <div class="scale" aria-hidden="true">
    {#each river.marks as mark (mark)}
      <span style:left={pct(mark)}>{mark}</span>
    {/each}
    <span class="max">{river.max}</span>
  </div>
  <p class="note">{riverText(state, locale)}</p>
</section>

<style>
  .value {
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .value strong {
    font-family: var(--font-title);
    font-size: 2.6rem;
    line-height: 1;
    color: var(--accent-text);
  }
  .value span {
    color: var(--muted);
    font-weight: 700;
  }
  .bar {
    position: relative;
    height: 18px;
    border-radius: 9px;
    background: var(--panel-strong);
    overflow: hidden;
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--water-bar);
    transition: width 0.4s ease;
  }
  .tick {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--text);
  }
  .scale {
    position: relative;
    height: 20px;
    font-size: 0.875rem;
    font-weight: 800;
    color: var(--muted);
  }
  .scale span {
    position: absolute;
    transform: translateX(-50%);
  }
  .scale .max {
    right: 0;
    transform: none;
    color: var(--danger);
  }
  .note {
    margin: 0;
    color: var(--muted);
    font-weight: 600;
    font-size: 0.95rem;
  }
</style>

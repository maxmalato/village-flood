<script lang="ts">
  // "Enquanto você estava fora": o que mudou na partida desde a última vez que este aparelho viu.
  import { t, type Locale } from '../i18n.ts'
  import type { AwaySummary } from '../lib/online/away.ts'

  let {
    summary,
    locale,
    ondismiss,
  }: { summary: AwaySummary; locale: Locale; ondismiss: () => void } = $props()
</script>

<section class="card" role="status" aria-labelledby="away-title">
  <h2 id="away-title" class="panel-title">{t(locale, 'away.title')}</h2>
  <ul>
    <li>{t(locale, 'away.turns', { from: summary.fromTurn, to: summary.toTurn })}</li>
    <li>
      {summary.levelTo > summary.levelFrom
        ? t(locale, 'away.levelRose', { from: summary.levelFrom, to: summary.levelTo })
        : t(locale, 'away.levelSame', { to: summary.levelTo })}
    </li>
    {#if summary.saved > 0}<li>{t(locale, 'away.saved', { n: summary.saved })}</li>{/if}
    {#if summary.stranded > 0}<li>{t(locale, 'away.stranded', { n: summary.stranded })}</li>{/if}
    {#if summary.saved === 0 && summary.stranded === 0}<li>{t(locale, 'away.nothing')}</li>{/if}
  </ul>
  <button type="button" class="btn" onclick={ondismiss}>{t(locale, 'away.ok')}</button>
</section>

<style>
  .card {
    background: var(--card-bg);
    color: var(--card-text);
    border-radius: 16px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .card .panel-title {
    color: var(--card-muted);
  }
  ul {
    margin: 0;
    padding-left: 20px;
    font-weight: 700;
  }
  .btn {
    align-self: flex-start;
    border-color: var(--card-text);
    color: inherit;
  }
</style>

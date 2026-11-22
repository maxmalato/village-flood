<script lang="ts">
  import type { GameState } from '@village-flood/engine'
  import { t, type Locale } from '../i18n.ts'
  import { forecastLines, type SeatInfo } from '../lib/view.ts'
  import Icon from './Icon.svelte'

  let {
    state,
    seats,
    locale,
    compact = false,
  }: { state: GameState; seats: readonly SeatInfo[]; locale: Locale; compact?: boolean } = $props()
  const lines = $derived(forecastLines(state, seats, locale))
</script>

{#if lines}
  {#if compact}
    <p class="compact">
      <Icon name="cloud" size={20} color="#F2B84B" />
      <span>{t(locale, 'forecast.short', { name: lines.name, text: lines.main })}</span>
    </p>
  {:else}
    <section class="panel" aria-labelledby="forecast-title">
      <h2 id="forecast-title" class="panel-title">
        {t(locale, 'forecast.title', { name: lines.name })}
      </h2>
      <p class="main"><Icon name="cloud" size={26} color="#F2B84B" /> <span>{lines.main}</span></p>
      {#if lines.detail}<p class="detail">{lines.detail}</p>{/if}
    </section>
  {/if}
{/if}

<style>
  .compact {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 12px;
    background: var(--panel);
    font-weight: 700;
  }
  .main {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    font-size: 1.1rem;
  }
  .detail {
    margin: 0;
    color: var(--muted);
    font-weight: 700;
  }
</style>

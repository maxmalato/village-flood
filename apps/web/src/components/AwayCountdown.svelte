<script lang="ts">
  // Quem está sem conexão e quanto falta para o bot assumir a vez dele. A contagem anda a cada
  // meio segundo só na tela: não é anunciada (o aviso da queda já foi, uma vez, em aria-live).
  import type { SeatId } from '@village-flood/engine'
  import { t, type Locale } from '../i18n.ts'

  let {
    seats,
    locale,
  }: {
    seats: readonly { seat: SeatId; name: string; deadline: number | null }[]
    locale: Locale
  } = $props()

  let now = $state(Date.now())
  const ticking = $derived(seats.some((s) => s.deadline !== null))

  $effect(() => {
    if (!ticking) return
    now = Date.now()
    const timer = setInterval(() => (now = Date.now()), 500)
    return () => clearInterval(timer)
  })

  function clock(ms: number): string {
    const total = Math.max(0, Math.ceil(ms / 1000))
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
  }
</script>

{#each seats as s (s.seat)}
  <p class="away">
    {#if s.deadline !== null}
      {t(locale, 'away.countdown', { name: s.name })}
      <strong class="clock">{clock(s.deadline - now)}</strong>
    {:else}
      {t(locale, 'away.waiting', { name: s.name })}
    {/if}
  </p>
{/each}

<style>
  .away {
    margin: 0;
    padding: 8px 14px;
    border-radius: 14px;
    border: 2px dashed var(--accent-line);
    background: var(--panel);
    font-weight: 700;
  }
  .clock {
    font-family: var(--font-title);
    font-variant-numeric: tabular-nums;
    color: var(--accent-text);
  }
</style>

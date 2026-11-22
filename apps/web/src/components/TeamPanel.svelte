<script lang="ts">
  import type { GameState } from '@village-flood/engine'
  import { t, type Locale, type MessageKey } from '../i18n.ts'
  import { initialOf, type SeatInfo } from '../lib/view.ts'

  let { state, seats, locale }: { state: GameState; seats: readonly SeatInfo[]; locale: Locale } =
    $props()

  function note(seat: SeatInfo): string {
    const v = state.volunteers.find((x) => x.seat === seat.seat)
    if (!v) return ''
    const active = state.phase === 'playing' && state.activeSeat === seat.seat
    const parts: string[] = []
    if (active)
      parts.push(
        seat.bot ? t(locale, 'team.botTurn') : t(locale, 'team.yourTurn', { n: v.actionsLeft }),
      )
    if (v.carrying.length > 0) parts.push(t(locale, 'team.carrying', { n: v.carrying.length }))
    if (v.skipNextTurn) parts.push(t(locale, 'team.skip'))
    if (v.bonusActions > 0) parts.push(t(locale, 'team.bonus', { n: v.bonusActions }))
    if (parts.length === 0) parts.push(seat.bot ? t(locale, 'team.bot') : t(locale, 'team.waiting'))
    return parts.join(' · ')
  }
</script>

<section class="panel" aria-labelledby="team-title">
  <h2 id="team-title" class="panel-title">{t(locale, 'team.title')}</h2>
  <ul>
    {#each seats as seat (seat.seat)}
      {@const active = state.phase === 'playing' && state.activeSeat === seat.seat}
      <li class:active aria-current={active ? 'true' : undefined}>
        <span class="dot" style:background={seat.color} aria-hidden="true">
          {initialOf(seat.name)}
        </span>
        <span class="who">
          <span class="name">
            {seat.name} <span class="role">{t(locale, `role.${seat.role}` as MessageKey)}</span>
          </span>
          <span class="note" class:accent={active}>{note(seat)}</span>
        </span>
      </li>
    {/each}
  </ul>
</section>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 6px;
    border-radius: 12px;
    border: 2px solid transparent;
  }
  li.active {
    border-color: var(--accent);
  }
  .dot {
    width: 36px;
    height: 36px;
    flex: none;
    border-radius: 50%;
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-title);
    font-size: 1.2rem;
  }
  .who {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    font-weight: 800;
    font-size: 1.05rem;
  }
  .role {
    font-weight: 700;
    color: var(--muted);
    font-size: 0.95rem;
  }
  .note {
    font-weight: 700;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .note.accent {
    color: var(--accent-text);
  }
</style>

<script lang="ts">
  import { defaultGameData, difficulties, roleIds, type RoleId } from '@village-flood/engine'
  import { formatCode } from '@village-flood/kit'
  import { errorText, t, type Locale, type MessageKey } from '../i18n.ts'
  import type { OnlineGame } from '../lib/online/game.svelte.ts'
  import { roomLink } from '../lib/online/link.ts'
  import { MAX_SEATS, MIN_SEATS } from '../lib/setup.ts'
  import { initialOf } from '../lib/view.ts'
  import QrCode from './QrCode.svelte'

  let { game, locale, onleave }: { game: OnlineGame; locale: Locale; onleave: () => void } =
    $props()

  const room = $derived(game.room)
  const seats = $derived(game.seats)
  const me = $derived(game.me)
  const host = $derived(seats.find((s) => s.seat === room?.host))
  const link = $derived(room ? roomLink(room.code) : '')
  const takenRoles = $derived(new Set(seats.filter((s) => !s.you).map((s) => s.role)))
  const canStart = $derived(
    seats.length >= MIN_SEATS &&
      seats.some((s) => !s.bot) &&
      seats.every((s) => s.bot || s.presence === 'connected'),
  )
  let copied = $state(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      copied = true
    } catch {
      copied = false
    }
  }

  function changeRole(event: Event) {
    game.setProfile((event.currentTarget as HTMLSelectElement).value as RoleId)
  }
</script>

{#if room}
  <main class="lobby">
    <h1 tabindex="-1">{t(locale, 'room.title')}</h1>

    <section class="code-box" aria-labelledby="code-title">
      <h2 id="code-title" class="panel-title">{t(locale, 'room.code')}</h2>
      <div class="code-row">
        <div>
          <p class="code" aria-label={room.code.split('').join(' ')}>{formatCode(room.code)}</p>
          <p class="hint">{t(locale, 'room.codeHint')}</p>
        </div>
        <QrCode
          text={link}
          label={t(locale, 'table.qr', { code: formatCode(room.code) })}
          size={132}
        />
      </div>
      <div class="link">
        <input type="text" readonly value={link} aria-label={t(locale, 'room.copyLink')} />
        <button type="button" class="btn" onclick={copy}>{t(locale, 'room.copyLink')}</button>
      </div>
      <p class="hint" role="status">{copied ? t(locale, 'room.copied') : ''}</p>
    </section>

    {#if room.table?.connected}
      <p class="banner" role="status">{t(locale, 'room.tableConnected')}</p>
    {/if}

    {#if game.connection.status !== 'open'}
      <p class="banner" role="status">{t(locale, 'online.reconnecting')}</p>
    {/if}

    <fieldset>
      <legend>{t(locale, 'room.difficulty')}</legend>
      {#if game.isHost}
        <div class="options">
          {#each difficulties as d (d)}
            <label class="option" class:checked={room.config.difficulty === d}>
              <input
                type="radio"
                name="difficulty"
                value={d}
                checked={room.config.difficulty === d}
                onchange={() => game.setConfig({ difficulty: d })}
              />
              <span class="name">{t(locale, `difficulty.${d}` as MessageKey)}</span>
              <span class="info">
                {t(locale, 'game.goal', { goal: defaultGameData.difficulties[d].goal })}
              </span>
            </label>
          {/each}
        </div>
      {:else}
        <p class="name">
          {t(locale, `difficulty.${room.config.difficulty}` as MessageKey)} ·
          {t(locale, 'game.goal', {
            goal: defaultGameData.difficulties[room.config.difficulty].goal,
          })}
        </p>
      {/if}
    </fieldset>

    <section aria-labelledby="seats-title">
      <h2 id="seats-title" class="legend">
        {t(locale, 'room.seats', { n: seats.length, max: MAX_SEATS })}
      </h2>
      <ol class="seats">
        {#each seats as seat (seat.seat)}
          <li class="seat" class:mine={seat.you}>
            <span class="dot" style:background={seat.color} aria-hidden="true">
              {initialOf(seat.name)}
            </span>
            <span class="who">
              <span class="seat-name">
                {seat.name}
                {#if seat.you}<span class="tag">{t(locale, 'room.you')}</span>{/if}
                {#if seat.seat === room.host}<span class="tag">{t(locale, 'room.host')}</span>{/if}
                {#if seat.bot}<span class="tag">{t(locale, 'room.bot')}</span>{/if}
                {#if seat.presence === 'away'}
                  <span class="tag warn">{t(locale, 'room.away')}</span>
                {/if}
              </span>
              <span class="role">{t(locale, `role.${seat.role}` as MessageKey)}</span>
              <span class="role-info">{t(locale, `roleInfo.${seat.role}` as MessageKey)}</span>
            </span>
            {#if game.isHost && !seat.you && (seat.bot || seat.presence === 'away')}
              <button type="button" class="btn" onclick={() => game.removeSeat(seat.seat)}>
                {t(locale, 'room.remove', { name: seat.name })}
              </button>
            {/if}
          </li>
        {/each}
      </ol>
      {#if game.isHost && seats.length < MAX_SEATS}
        <button type="button" class="btn add" onclick={() => game.addBot()}>
          {t(locale, 'room.addBot')}
        </button>
      {/if}
    </section>

    {#if me}
      <label class="my-role">
        <span>{t(locale, 'room.yourRole')}</span>
        <select value={me.role} onchange={changeRole}>
          {#each roleIds as role (role)}
            <option value={role} disabled={takenRoles.has(role)}>
              {t(locale, `role.${role}` as MessageKey)}
            </option>
          {/each}
        </select>
      </label>
    {/if}

    {#if game.error}
      <p class="error" role="alert">{errorText(locale, game.error)}</p>
    {/if}

    <div class="buttons">
      <button type="button" class="btn" onclick={onleave}>{t(locale, 'room.leave')}</button>
      {#if game.isHost}
        <button
          type="button"
          class="btn-primary"
          disabled={!canStart}
          aria-describedby={canStart ? undefined : 'start-hint'}
          onclick={() => game.start()}
        >
          {t(locale, 'room.start')}
        </button>
      {:else}
        <p class="hint wait" role="status">
          {t(locale, 'room.waitHost', { name: host?.name ?? '' })}
        </p>
      {/if}
    </div>
    {#if game.isHost && !canStart}
      <p id="start-hint" class="hint">{t(locale, 'room.needMore', { n: MIN_SEATS })}</p>
    {/if}
  </main>
{/if}

<style>
  .lobby {
    max-width: 44rem;
    margin: 0 auto;
    padding: 24px 16px 48px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h1 {
    font-size: 2rem;
  }
  .code-box {
    background: var(--card-bg);
    color: var(--card-text);
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .code-box .panel-title,
  .code-box .hint {
    color: var(--card-muted);
  }
  .code {
    margin: 0;
    font-family: var(--font-title);
    font-size: 2.6rem;
    letter-spacing: 0.12em;
  }
  .code-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .link {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .link input {
    flex: 1 1 14rem;
    min-width: 0;
    min-height: 44px;
    padding: 0 10px;
    border-radius: 10px;
    border: 2px solid var(--card-muted);
    background: transparent;
    color: inherit;
  }
  .link .btn {
    border-color: var(--card-text);
    color: inherit;
  }
  .hint,
  .info,
  .role-info {
    margin: 0;
    color: var(--muted);
    font-weight: 600;
  }
  .banner {
    margin: 0;
    padding: 8px 14px;
    border-radius: 14px;
    border: 2px solid var(--accent);
    font-weight: 800;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
  }
  legend,
  .legend {
    font-weight: 800;
    font-size: 1.15rem;
    margin: 0 0 8px;
  }
  .options {
    display: grid;
    gap: 8px;
  }
  .option {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 10px;
    padding: 10px 14px;
    min-height: 44px;
    border-radius: 14px;
    background: var(--panel);
    border: 2px solid transparent;
    cursor: pointer;
  }
  .option.checked {
    border-color: var(--accent);
  }
  .option input {
    width: 22px;
    height: 22px;
    grid-row: span 2;
  }
  .name {
    margin: 0;
    font-weight: 800;
  }
  .seats {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .seat {
    background: var(--panel);
    border-radius: 16px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    border: 2px solid transparent;
  }
  .seat.mine {
    border-color: var(--accent);
  }
  .dot {
    width: 40px;
    height: 40px;
    flex: none;
    border-radius: 50%;
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-title);
    font-size: 1.3rem;
  }
  .who {
    display: flex;
    flex-direction: column;
    flex: 1 1 12rem;
    min-width: 0;
  }
  .seat-name {
    font-weight: 800;
    font-size: 1.1rem;
  }
  .tag {
    display: inline-block;
    margin-left: 4px;
    padding: 0 8px;
    border-radius: 999px;
    border: 2px solid var(--border);
    font-size: 0.85rem;
    font-weight: 800;
  }
  .tag.warn {
    border-color: var(--danger);
    color: var(--danger);
  }
  .role {
    font-weight: 800;
    color: var(--accent-text);
  }
  .add {
    margin-top: 8px;
  }
  .my-role {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 800;
  }
  .error {
    margin: 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--panel);
    color: var(--danger);
    font-weight: 800;
  }
  .buttons {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .buttons .btn-primary {
    flex: 1;
    padding: 0 16px;
  }
  .btn-primary:disabled {
    opacity: 0.6;
  }
  .wait {
    flex: 1;
  }
  @media (min-width: 700px) {
    .options {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>

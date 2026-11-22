<script lang="ts">
  import { findVolunteer } from '@village-flood/engine'
  import { t, type Locale, type MessageKey } from '../i18n.ts'
  import { MAX_PINGS_PER_TURN } from '@village-flood/kit'
  import { pingKinds } from '@village-flood/protocol'
  import type { GameController } from '../lib/controller.ts'
  import { describeAction, globalActions, tileActions, tileInfo } from '../lib/view.ts'

  let { game, locale }: { game: GameController; locale: Locale } = $props()

  const state = $derived(game.state)
  const human = $derived(game.isHumanTurn)
  const me = $derived(findVolunteer(state, state.activeSeat))
  const info = $derived(game.selected ? tileInfo(state, game.selected, locale) : null)
  const options = $derived(human && game.selected ? tileActions(state, game.selected, locale) : [])
  const extras = $derived(human ? globalActions(state, locale) : [])
  const primary = $derived(options[0])
  const secondary = $derived(options.slice(1))
  const online = $derived(game.online)
  const myPings = $derived(online ? online.pings.filter((p) => p.seat === online.mySeat) : [])
  const waitingText = $derived.by(() => {
    const active = game.active
    if (!active) return ''
    if (game.activeIsBot && active.you) return t(locale, 'game.youReturning')
    if (game.activeIsBot) return t(locale, 'game.botThinking', { name: active.name })
    return t(locale, 'game.otherTurn', { name: active.name })
  })
</script>

<section class="actions" aria-label={t(locale, 'info.actions')}>
  <div class="card">
    <div class="head">
      <span class="kicker">{info?.header ?? ''}</span>
      {#if me}
        <span
          class="kicker pips"
          role="img"
          aria-label={t(locale, 'action.actionsLeft', { n: me.actionsLeft })}
        >
          {t(locale, 'info.actions')}
          {#each { length: me.actionsLeft } as _, i (i)}<span class="pip"></span>{/each}
        </span>
      {/if}
    </div>
    {#if !human && game.active}
      <p class="title">{waitingText}</p>
      {#if info}<p class="text">{info.title}</p>{/if}
    {:else if info}
      <p class="title">{info.title}</p>
      {#if info.text}<p class="text">{info.text}</p>{/if}
      {#if options.length === 0}<p class="text">{t(locale, 'info.noAction')}</p>{/if}
    {:else}
      <p class="text">{t(locale, 'info.pick')}</p>
    {/if}
    {#if game.rejected}
      <p class="text rejected" role="status">
        {t(locale, `reason.${game.rejected}` as MessageKey)}
      </p>
    {/if}
  </div>

  {#if online?.canPing && game.active}
    <div class="pings">
      <p class="hint-title">{t(locale, 'ping.title', { name: game.active.name })}</p>
      {#if game.selected}
        <div class="more">
          {#each pingKinds as kind (kind)}
            <button
              type="button"
              class="btn"
              disabled={myPings.length >= MAX_PINGS_PER_TURN}
              onclick={() => game.selected && online.ping(game.selected, kind)}
            >
              {t(locale, `ping.${kind}`)}
            </button>
          {/each}
        </div>
      {:else}
        <p>{t(locale, 'ping.pick', { name: game.active.name })}</p>
      {/if}
      <p class="count">
        {t(locale, 'ping.count', { n: myPings.length, max: MAX_PINGS_PER_TURN })}
      </p>
      {#if myPings.length > 0}
        <ul>
          {#each myPings as ping (ping.index)}
            <li>
              <button type="button" class="btn small" onclick={() => online.unping(ping.index)}>
                {t(locale, 'ping.remove', {
                  kind: t(locale, `ping.${ping.kind}`),
                  tile: ping.target,
                })}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}

  {#if game.hint}
    <div class="hint" role="status">
      <p class="hint-title">{t(locale, 'hint.title')}</p>
      {#if game.hint.actions.length === 0}
        <p>{t(locale, 'hint.end')}</p>
      {:else}
        <ol>
          {#each game.hint.actions as action, i (i)}
            <li>
              {i === 0
                ? describeAction(state, action, locale)
                : describeAction(state, action, locale).replace(/\s\(.*\)$/, '')}
            </li>
          {/each}
        </ol>
      {/if}
      <button type="button" class="btn" onclick={() => game.applyHint()}>
        {t(locale, 'hint.apply')}
      </button>
    </div>
  {/if}

  {#if primary}
    <button type="button" class="btn-primary main" onclick={() => game.act(primary.action)}>
      {primary.label}
    </button>
  {/if}
  {#if secondary.length > 0 || extras.length > 0}
    <div class="more">
      {#each [...secondary, ...extras] as option (option.label)}
        <button type="button" class="btn" onclick={() => game.act(option.action)}>
          {option.label}
        </button>
      {/each}
    </div>
  {/if}

  <div class="row" class:two={!game.hintAvailable} hidden={Boolean(online) && !human}>
    <button
      type="button"
      class="btn"
      disabled={!human || state.turnHistory.length === 0}
      onclick={() => game.act({ type: 'undo' })}
    >
      {t(locale, 'action.undo')}
    </button>
    {#if game.hintAvailable}
      <button type="button" class="btn" disabled={!human} onclick={() => game.showHint()}>
        {t(locale, 'action.hint')}
      </button>
    {/if}
    <button
      type="button"
      class="btn"
      disabled={!human}
      aria-label={t(locale, 'action.endTurnLong')}
      onclick={() => game.act({ type: 'end-turn' })}
    >
      {t(locale, 'action.endTurn')}
    </button>
  </div>
</section>

<style>
  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .card {
    background: var(--card-bg);
    color: var(--card-text);
    border-radius: 16px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 20px;
  }
  .kicker {
    font-size: 0.875rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--card-muted);
  }
  .pips {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .pip {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--card-text);
  }
  .title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
  }
  .text {
    margin: 0;
    font-weight: 700;
    color: var(--card-muted);
  }
  .rejected {
    color: var(--card-text);
  }
  .hint {
    border: 2px dashed var(--border);
    border-radius: 16px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .pings {
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .pings p,
  .pings ul {
    margin: 0;
    font-weight: 700;
  }
  .pings ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .count {
    color: var(--muted);
  }
  .btn.small {
    width: 100%;
    font-size: 0.95rem;
  }
  .row[hidden] {
    display: none;
  }
  .hint p,
  .hint ol {
    margin: 0;
    font-weight: 700;
  }
  .hint-title {
    font-weight: 800;
    color: var(--accent-text);
  }
  .main {
    width: 100%;
    outline: 3px solid var(--cream);
    outline-offset: 3px;
    margin: 3px 0;
  }
  .more {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .more .btn {
    flex: 1 1 auto;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .row.two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .row .btn {
    min-height: 48px;
  }
</style>

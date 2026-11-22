<script lang="ts">
  // Modo mesa: o que a TV (ou o notebook) mostra. Não joga: só mostra a sala, o tabuleiro e os
  // painéis. A legenda completa abre pelo controle remoto/teclado ou pelo celular de alguém.
  import { formatCode, MAX_PINGS_PER_TURN } from '@village-flood/kit'
  import { errorText, t, type Locale, type MessageKey } from '../i18n.ts'
  import type { OnlineGame } from '../lib/online/game.svelte.ts'
  import { roomLink } from '../lib/online/link.ts'
  import { MAX_SEATS } from '../lib/setup.ts'
  import { initialOf, residentSummary, seatName, tileViews } from '../lib/view.ts'
  import Board from './Board.svelte'
  import EndScreen from './EndScreen.svelte'
  import ForecastPanel from './ForecastPanel.svelte'
  import LegendDialog from './LegendDialog.svelte'
  import QrCode from './QrCode.svelte'
  import QuickLegend from './QuickLegend.svelte'
  import ResidentsPanel from './ResidentsPanel.svelte'
  import RiverPanel from './RiverPanel.svelte'
  import TeamPanel from './TeamPanel.svelte'

  let { game, locale, onclose }: { game: OnlineGame; locale: Locale; onclose: () => void } =
    $props()

  const room = $derived(game.room)
  const host = $derived(game.seats.find((s) => s.seat === room?.host))
  const gs = $derived(room?.game ?? null)
  const tiles = $derived(
    gs
      ? tileViews(gs, {
          seats: game.seats,
          selected: null,
          suggested: null,
          showReach: false,
          locale,
          pings: room?.pings ?? [],
        })
      : [],
  )
  const columns = $derived(gs ? Math.max(...gs.tiles.map((tile) => tile.x)) + 1 : 1)
  const summary = $derived(gs ? residentSummary(gs) : null)
  const turnLine = $derived(
    gs && game.active
      ? t(locale, game.active.bot ? 'game.turnBot' : 'game.turnOther', {
          turn: gs.turn,
          name: game.active.name,
        })
      : '',
  )
  const link = $derived(room ? roomLink(room.code) : '')
</script>

{#if room && room.status === 'lobby'}
  <main class="table-lobby">
    <header class="top">
      <h1 tabindex="-1">{t(locale, 'app.title')}</h1>
      <button type="button" class="btn btn-pill" onclick={onclose}>
        {t(locale, 'table.close')}
      </button>
    </header>
    <div class="lobby-grid">
      <section class="join" aria-labelledby="join-title">
        <h2 id="join-title">{t(locale, 'table.join')}</h2>
        <p class="muted">{t(locale, 'table.scan')}</p>
        <div class="qr-row">
          <QrCode
            text={link}
            label={t(locale, 'table.qr', { code: formatCode(room.code) })}
            size={240}
          />
          <div class="code-info">
            <p class="kicker">{t(locale, 'room.code')}</p>
            <p class="code" aria-label={room.code.split('').join(' ')}>{formatCode(room.code)}</p>
            <p class="kicker">{t(locale, 'table.address')}</p>
            <p class="address">{location.host}</p>
          </div>
        </div>
      </section>
      <section class="panel" aria-labelledby="seats-title">
        <h2 id="seats-title" class="panel-title">
          {t(locale, 'room.seats', { n: game.seats.length, max: MAX_SEATS })}
        </h2>
        <p class="difficulty">
          {t(locale, `difficulty.${room.config.difficulty}` as MessageKey)}
        </p>
        {#if game.seats.length === 0}
          <p class="muted">{t(locale, 'table.empty')}</p>
        {:else}
          <ul class="seats">
            {#each game.seats as seat (seat.seat)}
              <li>
                <span class="dot" style:background={seat.color} aria-hidden="true">
                  {initialOf(seat.name)}
                </span>
                <span>
                  <strong>{seat.name}</strong>
                  <span class="muted">{t(locale, `role.${seat.role}` as MessageKey)}</span>
                </span>
              </li>
            {/each}
          </ul>
        {/if}
        <p class="hint" role="status">
          {host ? t(locale, 'room.waitHost', { name: host.name }) : t(locale, 'table.firstHost')}
        </p>
      </section>
    </div>
  </main>
{:else if room && room.status === 'over' && room.game}
  <EndScreen
    {game}
    {locale}
    onagain={null}
    waitText={t(locale, 'end.waitHost', { name: host?.name ?? '' })}
    onhome={onclose}
    homeLabel="table.close"
  />
{:else if room && gs && summary}
  <main class="table-game">
    <header class="top">
      <div class="titles">
        <h1 tabindex="-1">{t(locale, 'app.title')}</h1>
        <p class="turn">{turnLine}</p>
      </div>
      <div class="pills">
        <span class="pill accent">
          {t(locale, `difficulty.${gs.config.difficulty}` as MessageKey)}
        </span>
        <span class="pill">{t(locale, 'game.goal', { goal: gs.config.settings.goal })}</span>
        <button type="button" class="btn btn-pill" onclick={() => game.setTableLegend(true)}>
          {t(locale, 'game.legend')}
        </button>
      </div>
    </header>

    {#if game.alert}<p class="alert" role="alert">{game.alert}</p>{/if}
    <div role="status">
      {#if game.connection.status === 'reconnecting'}
        <p class="banner">{t(locale, 'online.reconnecting')}</p>
      {/if}
      {#if game.notice}<p class="banner">{game.notice}</p>{/if}
      {#if game.error}
        <p class="banner">{errorText(locale, game.error, { n: MAX_PINGS_PER_TURN })}</p>
      {/if}
    </div>

    <div class="layout">
      <Board
        {tiles}
        {columns}
        label={t(locale, 'game.board')}
        onselect={() => {}}
        interactive={false}
      />
      <div class="col">
        <RiverPanel state={gs} {locale} />
        <ResidentsPanel state={gs} {locale} />
        <ForecastPanel state={gs} seats={game.seats} {locale} />
      </div>
      <div class="col">
        <TeamPanel state={gs} seats={game.seats} {locale} />
        <section class="panel" aria-labelledby="suggestions-title">
          <h2 id="suggestions-title" class="panel-title">{t(locale, 'table.suggestions')}</h2>
          {#if game.pings.length === 0}
            <p class="muted">{t(locale, 'table.noSuggestions')}</p>
          {:else}
            <ul class="suggestions">
              {#each game.pings as ping (ping.index)}
                <li>
                  {t(locale, 'table.suggestion', {
                    name: seatName(game.seats, ping.seat),
                    kind: t(locale, `ping.${ping.kind}`),
                    tile: ping.target,
                  })}
                </li>
              {/each}
            </ul>
          {/if}
        </section>
        <QuickLegend {locale} onopen={() => game.setTableLegend(true)} />
      </div>
    </div>

    <div class="visually-hidden" aria-live="polite">{game.messages.join(' ')}</div>
  </main>
{:else}
  <main class="table-lobby">
    <h1 tabindex="-1">{t(locale, 'app.title')}</h1>
    <p role="status">{t(locale, 'online.connecting')}</p>
  </main>
{/if}

<LegendDialog {locale} open={game.tableLegendOpen} onclose={() => game.setTableLegend(false)} />

<style>
  .table-lobby,
  .table-game {
    max-width: 1800px;
    margin: 0 auto;
    padding: 16px 24px 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  h1 {
    font-size: 2.4rem;
  }
  h2 {
    margin: 0;
  }
  .titles {
    display: flex;
    align-items: baseline;
    gap: 16px;
    flex-wrap: wrap;
  }
  .turn {
    margin: 0;
    font-weight: 800;
    font-size: 1.3rem;
    color: var(--muted);
  }
  .pills {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pill.accent {
    color: var(--accent-text);
  }
  .muted {
    margin: 0;
    color: var(--muted);
    font-weight: 700;
  }
  .lobby-grid {
    display: grid;
    gap: 24px;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
    align-items: start;
  }
  .join {
    background: var(--card-bg);
    color: var(--card-text);
    border-radius: 20px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .join h2 {
    font-size: 2rem;
  }
  .join .muted,
  .join .kicker {
    color: var(--card-muted);
  }
  .qr-row {
    display: flex;
    gap: 24px;
    align-items: center;
    flex-wrap: wrap;
  }
  .code-info p {
    margin: 0;
  }
  .kicker {
    font-size: 0.9rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .code {
    font-family: var(--font-title);
    font-size: 3.6rem;
    letter-spacing: 0.12em;
    margin-bottom: 12px !important;
  }
  .address {
    font-size: 1.4rem;
    font-weight: 800;
    word-break: break-all;
  }
  .difficulty {
    margin: 0;
    font-weight: 800;
    color: var(--accent-text);
  }
  .seats {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 1.2rem;
  }
  .seats li {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .seats li > span:last-child {
    display: flex;
    flex-direction: column;
  }
  .dot {
    width: 44px;
    height: 44px;
    flex: none;
    border-radius: 50%;
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-title);
    font-size: 1.4rem;
  }
  .hint {
    margin: 0;
    font-weight: 800;
    font-size: 1.1rem;
  }
  .alert {
    margin: 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--accent);
    color: var(--ink);
    font-weight: 800;
  }
  .banner {
    margin: 0 0 6px;
    padding: 8px 14px;
    border-radius: 14px;
    border: 2px solid var(--accent);
    background: var(--panel);
    font-weight: 800;
  }
  .layout {
    display: grid;
    gap: 20px;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .suggestions {
    margin: 0;
    padding-left: 18px;
    font-weight: 700;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  @media (min-width: 900px) {
    .layout {
      grid-template-columns: minmax(420px, 1.3fr) minmax(0, 1fr) minmax(0, 1fr);
    }
  }
</style>

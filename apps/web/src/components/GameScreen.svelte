<script lang="ts">
  import { t, type Locale, type MessageKey } from '../i18n.ts'
  import type { LocalGame } from '../lib/game.svelte.ts'
  import { actionTile, residentSummary, tileViews } from '../lib/view.ts'
  import ActionPanel from './ActionPanel.svelte'
  import Board from './Board.svelte'
  import ForecastPanel from './ForecastPanel.svelte'
  import LegendDialog from './LegendDialog.svelte'
  import QuickLegend from './QuickLegend.svelte'
  import ResidentsPanel from './ResidentsPanel.svelte'
  import RiverPanel from './RiverPanel.svelte'
  import TeamPanel from './TeamPanel.svelte'

  let { game, locale }: { game: LocalGame; locale: Locale } = $props()
  let legendOpen = $state(false)

  const gs = $derived(game.state)
  const suggested = $derived(game.hint?.actions[0] ? actionTile(gs, game.hint.actions[0]) : null)
  const tiles = $derived(
    tileViews(gs, {
      seats: game.seats,
      selected: game.selected,
      suggested,
      showReach: game.isHumanTurn,
      locale,
    }),
  )
  const columns = $derived(Math.max(...gs.tiles.map((tile) => tile.x)) + 1)
  const summary = $derived(residentSummary(gs))
  const turnLine = $derived(
    game.active
      ? t(locale, game.active.bot ? 'game.turnBot' : 'game.turnYours', {
          turn: gs.turn,
          name: game.active.name,
        })
      : '',
  )
</script>

<main class="game">
  <header>
    <div class="titles">
      <h1 tabindex="-1">{t(locale, 'app.title')}</h1>
      <p class="turn">{turnLine}</p>
    </div>
    <div class="pills">
      <span class="pill accent">
        {t(locale, `difficulty.${gs.config.difficulty}` as MessageKey)}
      </span>
      <span class="pill goal">{t(locale, 'game.goal', { goal: gs.config.settings.goal })}</span>
      <button type="button" class="btn btn-pill" onclick={() => (legendOpen = true)}>
        {t(locale, 'game.legend')}
      </button>
    </div>
  </header>

  {#if game.alert}
    <p class="alert" role="alert">{game.alert}</p>
  {/if}

  <div class="layout">
    <div class="main-col">
      <p class="role-line">
        {#if game.active}{t(locale, `role.${game.active.role}` as MessageKey)}{/if}
      </p>
      <dl class="stats">
        <div>
          <dt>{t(locale, 'game.statRiver')}</dt>
          <dd>{gs.riverLevel}/{gs.config.rules.maxRiverLevel}</dd>
        </div>
        <div>
          <dt>{t(locale, 'game.statSafe')}</dt>
          <dd>{summary.safe}/{summary.goal}</dd>
        </div>
        <div>
          <dt>{t(locale, 'game.statStranded')}</dt>
          <dd>{summary.stranded}/{summary.strandedLimit}</dd>
        </div>
      </dl>
      <div class="compact-forecast">
        <ForecastPanel state={gs} seats={game.seats} {locale} compact />
      </div>
      <Board {tiles} {columns} label={t(locale, 'game.board')} onselect={(id) => game.select(id)} />
      <div class="actions-mobile"><ActionPanel {game} {locale} /></div>
    </div>

    <div class="side">
      <div class="actions-desktop"><ActionPanel {game} {locale} /></div>
      <!-- Duas colunas independentes no desktop (sem buracos); uma coluna no celular. -->
      <div class="cols">
        <div class="col">
          <div class="slot river"><RiverPanel state={gs} {locale} /></div>
          <div class="slot forecast"><ForecastPanel state={gs} seats={game.seats} {locale} /></div>
          <div class="slot legend"><QuickLegend {locale} onopen={() => (legendOpen = true)} /></div>
        </div>
        <div class="col">
          <div class="slot residents"><ResidentsPanel state={gs} {locale} /></div>
          <div class="slot team"><TeamPanel state={gs} seats={game.seats} {locale} /></div>
        </div>
      </div>
    </div>
  </div>

  <div class="visually-hidden" aria-live="polite">{game.messages.join(' ')}</div>
  <LegendDialog {locale} open={legendOpen} onclose={() => (legendOpen = false)} />
</main>

<style>
  .game {
    max-width: 1320px;
    margin: 0 auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  h1 {
    font-size: 1.3rem;
  }
  .turn {
    margin: 0;
    font-weight: 800;
    font-size: 1.05rem;
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
  .pill.goal {
    display: none;
  }
  .alert {
    margin: 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--accent);
    color: var(--ink);
    font-weight: 800;
  }
  .layout {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .main-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .role-line {
    margin: 0;
    color: var(--muted);
    font-weight: 700;
  }
  .stats {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    text-align: center;
  }
  .stats div {
    background: var(--panel);
    border-radius: 12px;
    padding: 6px 4px;
    display: flex;
    flex-direction: column-reverse;
  }
  .stats dt {
    font-weight: 700;
    color: var(--muted);
  }
  .stats dd {
    margin: 0;
    font-family: var(--font-title);
    font-size: 1.4rem;
    color: var(--accent-text);
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  /* Celular: uma coluna só, na ordem rio, moradores, previsão, equipe e legenda. */
  .cols,
  .col {
    display: contents;
  }
  .slot:empty {
    display: none;
  }
  .river {
    order: 1;
  }
  .residents {
    order: 2;
  }
  .forecast {
    order: 3;
  }
  .team {
    order: 4;
  }
  .legend {
    order: 5;
  }
  .actions-desktop {
    display: none;
  }

  @media (min-width: 1000px) {
    h1 {
      font-size: 2.2rem;
    }
    .titles {
      flex-direction: row;
      align-items: baseline;
      gap: 16px;
    }
    .turn {
      color: var(--muted);
      font-size: 1.2rem;
    }
    .pill.goal {
      display: inline;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(440px, 540px) minmax(0, 1fr);
      gap: 28px;
      align-items: start;
    }
    .stats,
    .compact-forecast,
    .role-line,
    .actions-mobile {
      display: none;
    }
    .actions-desktop {
      display: block;
    }
    .cols {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      align-items: start;
    }
    .col {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
  }
</style>

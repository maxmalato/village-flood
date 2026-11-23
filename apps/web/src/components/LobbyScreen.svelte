<script lang="ts">
  import { defaultGameData, difficulties, roleIds, type Difficulty } from '@village-flood/engine'
  import { t, type Locale, type MessageKey } from '../i18n.ts'
  import {
    addSeat,
    MAX_SEATS,
    MIN_SEATS,
    removeSeat,
    validateSetup,
    type LocalSetup,
  } from '../lib/setup.ts'

  let {
    locale,
    setup = $bindable(),
    onstart,
    onback,
  }: { locale: Locale; setup: LocalSetup; onstart: () => void; onback: () => void } = $props()

  const errors = $derived(validateSetup(setup))
  const residentsFor = (d: Difficulty) => {
    const s = defaultGameData.difficulties[d]
    return (
      defaultGameData.map.houses.length * defaultGameData.map.residentsPerHouse + s.extraResidents
    )
  }
</script>

<main class="lobby">
  <h1 tabindex="-1">{t(locale, 'lobby.title')}</h1>

  <fieldset>
    <legend>{t(locale, 'lobby.difficulty')}</legend>
    <div class="options">
      {#each difficulties as d (d)}
        <label class="option" class:checked={setup.difficulty === d}>
          <input type="radio" name="difficulty" value={d} bind:group={setup.difficulty} />
          <span class="name">{t(locale, `difficulty.${d}` as MessageKey)}</span>
          <span class="info">
            {t(locale, 'lobby.goalInfo', {
              goal: defaultGameData.difficulties[d].goal,
              residents: residentsFor(d),
            })}
          </span>
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset>
    <legend>{t(locale, 'lobby.seats')}</legend>
    <p class="note">{t(locale, 'lobby.recommend')}</p>
    <ol class="seats">
      {#each setup.seats as seat, i (i)}
        <li class="seat">
          <h2>{t(locale, 'lobby.seat', { n: i + 1 })}</h2>
          <label>
            <span>{t(locale, 'lobby.name')}</span>
            <input type="text" maxlength="20" autocomplete="off" bind:value={seat.name} />
          </label>
          <label>
            <span>{t(locale, 'lobby.role')}</span>
            <select bind:value={seat.role}>
              {#each roleIds as role (role)}
                <option value={role}>{t(locale, `role.${role}` as MessageKey)}</option>
              {/each}
            </select>
          </label>
          <p class="role-info">{t(locale, `roleInfo.${seat.role}` as MessageKey)}</p>
          <label class="check">
            <input type="checkbox" bind:checked={seat.bot} />
            <span>{t(locale, 'lobby.bot')}</span>
          </label>
          {#if setup.seats.length > MIN_SEATS}
            <button type="button" class="btn remove" onclick={() => (setup = removeSeat(setup, i))}>
              {t(locale, 'lobby.removeSeat', { n: i + 1 })}
            </button>
          {/if}
        </li>
      {/each}
    </ol>
    {#if setup.seats.length < MAX_SEATS}
      <button type="button" class="btn" onclick={() => (setup = addSeat(setup))}>
        {t(locale, 'lobby.addSeat')}
      </button>
    {/if}
  </fieldset>

  {#if errors.length > 0}
    <ul class="errors" role="alert">
      {#each errors as error (error)}<li>{t(locale, `lobby.${error}` as MessageKey)}</li>{/each}
    </ul>
  {/if}

  <div class="buttons">
    <button type="button" class="btn" onclick={onback}>{t(locale, 'lobby.back')}</button>
    <button type="button" class="btn-primary" disabled={errors.length > 0} onclick={onstart}>
      {t(locale, 'lobby.start')}
    </button>
  </div>
</main>

<style>
  .lobby {
    max-width: 52rem;
    margin: 0 auto;
    padding: 24px 16px 48px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h1 {
    font-size: 2rem;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  legend {
    font-weight: 800;
    font-size: 1.15rem;
    margin-bottom: 8px;
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
    font-weight: 800;
  }
  .info,
  .note,
  .role-info {
    color: var(--muted);
    font-weight: 600;
    margin: 0;
  }
  .seats {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    /* coluna que pode encolher: sem isso, a lista de papéis alargava a tela estreita */
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  .seat {
    background: var(--panel);
    border-radius: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .seat h2 {
    font-size: 1.1rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 700;
  }
  input[type='text'] {
    min-height: 44px;
    padding: 0 10px;
    border-radius: 10px;
    border: 2px solid var(--border);
    background: var(--bg);
  }
  .check {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    min-height: 44px;
  }
  .check input {
    width: 22px;
    height: 22px;
  }
  /* ação secundária: discreta e à direita, ainda com 44 px de toque */
  .remove {
    align-self: flex-end;
    border-color: var(--border-muted);
    font-size: 0.95rem;
  }
  .errors {
    margin: 0;
    padding: 10px 14px 10px 32px;
    border-radius: 14px;
    background: var(--panel);
    color: var(--danger);
    font-weight: 800;
  }
  .buttons {
    display: flex;
    gap: 12px;
    justify-content: space-between;
  }
  .buttons .btn-primary {
    flex: 1;
    padding: 0 16px;
  }
  .btn-primary:disabled {
    opacity: 0.6;
  }
  @media (min-width: 700px) {
    .options {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .seats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>

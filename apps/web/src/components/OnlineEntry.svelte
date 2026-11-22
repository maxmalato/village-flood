<script lang="ts">
  import { defaultGameData, difficulties, type Difficulty } from '@village-flood/engine'
  import { MAX_NAME_LENGTH, normalizeCode } from '@village-flood/kit'
  import { errorText, t, type Locale, type MessageKey } from '../i18n.ts'
  import { ApiError, createRoom, roomInfo } from '../lib/online/api.ts'

  let {
    locale,
    mode,
    code: initialCode = '',
    error: initialError = null,
    onconnect,
    onback,
  }: {
    locale: Locale
    mode: 'create' | 'join'
    code?: string
    /** Recusa vinda da conexão (ex.: apelido repetido), mostrada ao voltar para esta tela. */
    error?: string | null
    onconnect: (code: string, name: string) => void
    onback: () => void
  } = $props()

  // Valores iniciais vindos das props; depois, o formulário é de quem digita.
  const start = (() => ({ code: initialCode, error: initialError }))()
  let name = $state('')
  let code = $state(start.code)
  let difficulty = $state<Difficulty>('normal')
  let error = $state<string | null>(start.error)
  let busy = $state(false)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const nickname = name.trim()
    if (nickname.length === 0 || nickname.length > MAX_NAME_LENGTH) {
      error = 'invalidName'
      return
    }
    error = null
    busy = true
    try {
      if (mode === 'create') {
        onconnect(await createRoom({ difficulty }), nickname)
      } else {
        const normalized = normalizeCode(code)
        if (!normalized) throw new ApiError('invalidCode')
        const info = await roomInfo(normalized)
        if (info.status !== 'lobby') throw new ApiError('gameStarted')
        if (info.seats >= info.maxSeats) throw new ApiError('roomFull')
        onconnect(normalized, nickname)
      }
    } catch (caught) {
      error = caught instanceof ApiError ? caught.code : 'network'
    } finally {
      busy = false
    }
  }
</script>

<main class="entry">
  <h1 tabindex="-1">
    {t(locale, mode === 'create' ? 'online.createTitle' : 'online.joinTitle')}
  </h1>

  <form onsubmit={submit} novalidate>
    {#if mode === 'join'}
      <label>
        <span>{t(locale, 'online.code')}</span>
        <input
          class="code"
          type="text"
          bind:value={code}
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          maxlength="9"
          aria-describedby="code-hint"
        />
        <span id="code-hint" class="hint">{t(locale, 'online.codeHint')}</span>
      </label>
    {/if}

    <label>
      <span>{t(locale, 'online.name')}</span>
      <input
        type="text"
        bind:value={name}
        autocomplete="nickname"
        maxlength={MAX_NAME_LENGTH}
        aria-describedby="privacy"
      />
    </label>

    {#if mode === 'create'}
      <fieldset>
        <legend>{t(locale, 'room.difficulty')}</legend>
        <div class="options">
          {#each difficulties as d (d)}
            <label class="option" class:checked={difficulty === d}>
              <input type="radio" name="difficulty" value={d} bind:group={difficulty} />
              <span class="name">{t(locale, `difficulty.${d}` as MessageKey)}</span>
              <span class="info">
                {t(locale, 'game.goal', { goal: defaultGameData.difficulties[d].goal })}
              </span>
            </label>
          {/each}
        </div>
      </fieldset>
    {/if}

    <p id="privacy" class="hint">{t(locale, 'online.privacy')}</p>

    {#if error}
      <p class="error" role="alert">{errorText(locale, error)}</p>
    {/if}

    <div class="buttons">
      <button type="button" class="btn" onclick={onback}>{t(locale, 'online.back')}</button>
      <button type="submit" class="btn-primary" disabled={busy}>
        {t(locale, mode === 'create' ? 'online.create' : 'online.join')}
      </button>
    </div>
  </form>
</main>

<style>
  .entry {
    max-width: 36rem;
    margin: 0 auto;
    padding: 32px 16px 48px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h1 {
    font-size: 2rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
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
  .code {
    font-family: var(--font-title);
    font-size: 1.4rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
  }
  legend {
    font-weight: 800;
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
  .hint {
    margin: 0;
    color: var(--muted);
    font-weight: 600;
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
  }
  .buttons .btn-primary {
    flex: 1;
    padding: 0 16px;
  }
  .btn-primary:disabled {
    opacity: 0.6;
  }
</style>

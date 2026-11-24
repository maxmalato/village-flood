<script lang="ts">
  import EndScreen from './components/EndScreen.svelte'
  import GameScreen from './components/GameScreen.svelte'
  import HomeScreen from './components/HomeScreen.svelte'
  import HowToDialog from './components/HowToDialog.svelte'
  import LobbyScreen from './components/LobbyScreen.svelte'
  import OnlineEntry from './components/OnlineEntry.svelte'
  import OnlineLobby from './components/OnlineLobby.svelte'
  import TableScreen from './components/TableScreen.svelte'
  import { locales, pickLocale, t, type Locale } from './i18n.ts'
  import { LocalGame } from './lib/game.svelte.ts'
  import { ApiError, createTableRoom } from './lib/online/api.ts'
  import { OnlineGame } from './lib/online/game.svelte.ts'
  import { codeFromUrl, savedRoom } from './lib/online/link.ts'
  import { defaultSetup, type LocalSetup } from './lib/setup.ts'
  import { sound } from './lib/sound.ts'

  type Screen = 'home' | 'lobby' | 'game' | 'online-entry' | 'online'

  // Preferência de idioma guardada só neste navegador (sem dado pessoal).
  function savedLocale(): Locale | null {
    try {
      const value = localStorage.getItem('village-flood.locale')
      return locales.includes(value as Locale) ? (value as Locale) : null
    } catch {
      return null
    }
  }

  const params = new URLSearchParams(location.search)
  // Parâmetros para testes e demonstração: ?botDelay=0&seed=42
  const botDelay = Number(params.get('botDelay') ?? 700)
  const fixedSeed = params.get('seed')
  // ?scenario=0&mirror=0 fixa a variação do mapa (testes); sem isso, a semente sorteia.
  const fixedVariation =
    params.get('scenario') !== null
      ? { scenario: Number(params.get('scenario')), mirrored: params.get('mirror') === '1' }
      : undefined

  let locale = $state<Locale>(savedLocale() ?? pickLocale(navigator.languages))
  let screen = $state<Screen>('home')
  let setup = $state<LocalSetup>(defaultSetup())
  let game = $state.raw<LocalGame | null>(null)
  let main: HTMLDivElement | undefined = $state()
  let soundOn = $state(sound.enabled)
  let howToOpen = $state(false)

  // ---- Online ----
  let online = $state.raw<OnlineGame | null>(null)
  let entryMode = $state<'create' | 'join'>('join')
  let entryCode = $state('')
  let entryError = $state<string | null>(null)
  let resumeCode = $state<string | null>(savedRoom()?.code ?? null)
  let tableError = $state<string | null>(null)

  /** Modo mesa: esta tela abre a sala e mostra o jogo; as pessoas entram pelo celular. */
  async function openTable() {
    tableError = null
    try {
      const { code, token } = await createTableRoom({ difficulty: 'normal' })
      connect(code, { token })
    } catch (caught) {
      tableError = caught instanceof ApiError ? caught.code : 'network'
    }
  }

  $effect(() => {
    document.documentElement.lang = locale
    document.title = t(locale, 'app.title')
    game?.setLocale(locale)
    online?.setLocale(locale)
    try {
      localStorage.setItem('village-flood.locale', locale)
    } catch {
      // Sem armazenamento (navegação privada): segue sem lembrar.
    }
  })

  function randomSeed(): number {
    if (fixedSeed !== null) return Number(fixedSeed)
    return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1
  }

  function go(next: Screen) {
    screen = next
    // Leva o foco ao título da nova tela (leitores de tela e teclado).
    queueMicrotask(() => main?.querySelector<HTMLElement>('h1')?.focus())
  }

  function start() {
    game?.destroy()
    game = new LocalGame($state.snapshot(setup), {
      seed: randomSeed(),
      botDelay,
      locale,
      ...(fixedVariation ? { variation: fixedVariation } : {}),
    })
    go('game')
  }

  function home() {
    game?.destroy()
    game = null
    go('home')
  }

  const ended = $derived(game !== null && game.state.phase !== 'playing')

  function openEntry(mode: 'create' | 'join', code = '', error: string | null = null) {
    entryMode = mode
    entryCode = code
    entryError = error
    go('online-entry')
  }

  function connect(code: string, who: { token: string } | { name: string }) {
    online?.destroy()
    online = new OnlineGame(code, who, locale)
    go('online')
  }

  function resume() {
    const saved = savedRoom()
    if (saved) connect(saved.code, { token: saved.token })
    else resumeCode = null
  }

  function leaveRoom() {
    online?.leave()
    online = null
    resumeCode = null
    go('home')
  }

  // A conexão parou de vez (sala expirou, apelido repetido...): volta à entrada com o motivo.
  $effect(() => {
    const fatal = online?.connection.fatal
    if (!online || !fatal) return
    const code = online.connection.code
    online.destroy()
    online = null
    resumeCode = savedRoom()?.code ?? null
    openEntry('join', fatal === 'roomGone' ? '' : code, fatal)
  })

  const onlineStatus = $derived(online?.room?.status ?? null)
  // Leva o foco ao título quando a sala muda de fase (lobby, partida, fim).
  $effect(() => {
    if (onlineStatus) queueMicrotask(() => main?.querySelector<HTMLElement>('h1')?.focus())
  })

  // Link de convite (?sala=CODIGO): volta à sala guardada ou abre "Entrar" com o código.
  // Sem link, uma sala guardada neste aparelho é retomada (ex.: a página recarregou).
  const linkCode = codeFromUrl()
  const saved = savedRoom()
  if (saved && (linkCode === null || linkCode === saved.code)) resume()
  else if (linkCode) openEntry('join', linkCode)
</script>

<div class="app" bind:this={main}>
  <header class="topbar">
    <button
      type="button"
      class="btn btn-pill sound"
      aria-label={t(locale, 'app.sound')}
      aria-pressed={soundOn}
      title={t(locale, soundOn ? 'app.soundOn' : 'app.soundOff')}
      onclick={() => {
        sound.setEnabled(!soundOn)
        soundOn = sound.enabled
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {#if soundOn}
          <path
            d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        {:else}
          <path
            d="M16 9l5 6M21 9l-5 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        {/if}
      </svg>
    </button>
    <!-- "Como jogar": "?" no celular e o nome a partir do tablet; o nome acessível é sempre o
         texto completo. Contorno dourado fixo para chamar a atenção de quem chega. -->
    <button type="button" class="btn btn-pill howto" onclick={() => (howToOpen = true)}>
      <span class="howto-icon" aria-hidden="true">?</span>
      <span class="howto-label">{t(locale, 'howto.open')}</span>
    </button>
    <label>
      <span class="visually-hidden">{t(locale, 'app.language')}</span>
      <select bind:value={locale} aria-label={t(locale, 'app.language')}>
        {#each locales as option (option)}
          <option value={option}>{option === 'pt-BR' ? 'Português' : 'English'}</option>
        {/each}
      </select>
    </label>
  </header>

  <HowToDialog {locale} open={howToOpen} onclose={() => (howToOpen = false)} />

  {#if screen === 'home'}
    <HomeScreen
      {locale}
      {resumeCode}
      onplay={() => go('lobby')}
      oncreate={() => openEntry('create')}
      onjoin={() => openEntry('join')}
      onresume={resume}
      ontable={openTable}
      {tableError}
    />
  {:else if screen === 'online-entry'}
    {#key entryMode + entryCode + entryError}
      <OnlineEntry
        {locale}
        mode={entryMode}
        code={entryCode}
        error={entryError}
        onconnect={(code, name) => connect(code, { name })}
        onback={() => go('home')}
      />
    {/key}
  {:else if screen === 'online'}
    {#if online?.isTable}
      <TableScreen game={online} {locale} onclose={leaveRoom} />
    {:else if !online?.room}
      <main class="connecting">
        <h1 tabindex="-1">{t(locale, 'app.title')}</h1>
        <p role="status">{t(locale, 'online.connecting')}</p>
      </main>
    {:else if online.room.status === 'lobby'}
      <OnlineLobby game={online} {locale} onleave={leaveRoom} />
    {:else if online.room.status === 'over' && online.room.game}
      <EndScreen
        game={online}
        {locale}
        onagain={online.isHost ? () => online?.again() : null}
        waitText={t(locale, 'end.waitHost', {
          name: online.seats.find((s) => s.seat === online?.room?.host)?.name ?? '',
        })}
        onhome={leaveRoom}
        homeLabel="end.leave"
      />
    {:else if online.room.game}
      <GameScreen game={online} {locale} />
    {/if}
  {:else if screen === 'lobby'}
    <LobbyScreen {locale} bind:setup onstart={start} onback={() => go('home')} />
  {:else if game && ended}
    <EndScreen {game} {locale} onagain={start} onhome={home} />
  {:else if game}
    <GameScreen {game} {locale} />
  {/if}
</div>

<style>
  .topbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    padding: 8px 16px 0;
  }
  .connecting {
    max-width: 36rem;
    margin: 0 auto;
    padding: 48px 16px;
    font-weight: 700;
  }
  .sound {
    width: 44px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .howto {
    border-color: var(--accent-line);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-line) 25%, transparent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .howto-icon {
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1;
  }
  /* celular: só o "?" num botão redondo de 44 px; o nome fica para leitores de tela */
  @media (max-width: 767px) {
    .howto {
      width: 44px;
      padding: 0;
    }
    .howto-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      white-space: nowrap;
    }
  }
  /* tablet e maiores: o nome por extenso */
  @media (min-width: 768px) {
    .howto-icon {
      display: none;
    }
  }
  .app :global(h1) {
    outline: none;
  }
  .app :global(h1:focus-visible) {
    outline: 3px solid var(--focus);
  }
</style>

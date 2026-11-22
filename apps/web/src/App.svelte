<script lang="ts">
  import EndScreen from './components/EndScreen.svelte'
  import GameScreen from './components/GameScreen.svelte'
  import HomeScreen from './components/HomeScreen.svelte'
  import LobbyScreen from './components/LobbyScreen.svelte'
  import OnlineEntry from './components/OnlineEntry.svelte'
  import OnlineLobby from './components/OnlineLobby.svelte'
  import { locales, pickLocale, t, type Locale } from './i18n.ts'
  import { LocalGame } from './lib/game.svelte.ts'
  import { OnlineGame } from './lib/online/game.svelte.ts'
  import { codeFromUrl, savedRoom } from './lib/online/link.ts'
  import { defaultSetup, type LocalSetup } from './lib/setup.ts'

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

  // ---- Online ----
  let online = $state.raw<OnlineGame | null>(null)
  let entryMode = $state<'create' | 'join'>('join')
  let entryCode = $state('')
  let entryError = $state<string | null>(null)
  let resumeCode = $state<string | null>(savedRoom()?.code ?? null)

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
    <label>
      <span class="visually-hidden">{t(locale, 'app.language')}</span>
      <select bind:value={locale} aria-label={t(locale, 'app.language')}>
        {#each locales as option (option)}
          <option value={option}>{option === 'pt-BR' ? 'Português (Brasil)' : 'English'}</option>
        {/each}
      </select>
    </label>
  </header>

  {#if screen === 'home'}
    <HomeScreen
      {locale}
      {resumeCode}
      onplay={() => go('lobby')}
      oncreate={() => openEntry('create')}
      onjoin={() => openEntry('join')}
      onresume={resume}
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
    {#if !online?.room}
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
    padding: 8px 16px 0;
  }
  .connecting {
    max-width: 36rem;
    margin: 0 auto;
    padding: 48px 16px;
    font-weight: 700;
  }
  .app :global(h1) {
    outline: none;
  }
  .app :global(h1:focus-visible) {
    outline: 3px solid var(--focus);
  }
</style>

<script lang="ts">
  import EndScreen from './components/EndScreen.svelte'
  import GameScreen from './components/GameScreen.svelte'
  import HomeScreen from './components/HomeScreen.svelte'
  import LobbyScreen from './components/LobbyScreen.svelte'
  import { locales, pickLocale, t, type Locale } from './i18n.ts'
  import { LocalGame } from './lib/game.svelte.ts'
  import { defaultSetup, type LocalSetup } from './lib/setup.ts'

  type Screen = 'home' | 'lobby' | 'game'

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

  let locale = $state<Locale>(savedLocale() ?? pickLocale(navigator.languages))
  let screen = $state<Screen>('home')
  let setup = $state<LocalSetup>(defaultSetup())
  let game = $state.raw<LocalGame | null>(null)
  let main: HTMLDivElement | undefined = $state()

  $effect(() => {
    document.documentElement.lang = locale
    document.title = t(locale, 'app.title')
    game?.setLocale(locale)
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
    game = new LocalGame($state.snapshot(setup), { seed: randomSeed(), botDelay, locale })
    go('game')
  }

  function home() {
    game?.destroy()
    game = null
    go('home')
  }

  const ended = $derived(game !== null && game.state.phase !== 'playing')
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
    <HomeScreen {locale} onplay={() => go('lobby')} />
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
  .app :global(h1) {
    outline: none;
  }
  .app :global(h1:focus-visible) {
    outline: 3px solid var(--focus);
  }
</style>

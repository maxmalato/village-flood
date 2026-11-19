<script lang="ts">
  import { GAME_ID } from '@village-flood/engine'
  import { locales, pickLocale, t, type Locale } from './i18n.ts'

  // Tela provisória da Etapa 0: só confirma que a interface monta e usa o motor.
  let locale = $state<Locale>(pickLocale(navigator.languages))

  $effect(() => {
    document.documentElement.lang = locale
    document.title = t(locale, 'app.title')
  })
</script>

<main data-game={GAME_ID}>
  <h1>{t(locale, 'app.title')}</h1>
  <p>{t(locale, 'app.tagline')}</p>
  <p class="status">{t(locale, 'app.status')}</p>

  <label>
    {t(locale, 'app.language')}
    <select bind:value={locale}>
      {#each locales as option (option)}
        <option value={option}>{option === 'pt-BR' ? 'Português (Brasil)' : 'English'}</option>
      {/each}
    </select>
  </label>
</main>

<style>
  main {
    max-width: 40rem;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .status {
    color: var(--color-muted);
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  select {
    min-height: 44px;
    padding: 0 0.75rem;
    font: inherit;
  }
</style>

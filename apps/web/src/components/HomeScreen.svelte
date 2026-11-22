<script lang="ts">
  import { formatCode } from '@village-flood/kit'
  import { t, type Locale } from '../i18n.ts'

  let {
    locale,
    resumeCode = null,
    onplay,
    oncreate,
    onjoin,
    onresume,
  }: {
    locale: Locale
    /** Sala guardada neste aparelho, para voltar a ela. */
    resumeCode?: string | null
    onplay: () => void
    oncreate: () => void
    onjoin: () => void
    onresume: () => void
  } = $props()
</script>

<main class="home">
  <h1 tabindex="-1">{t(locale, 'app.title')}</h1>
  <p class="tagline">{t(locale, 'app.tagline')}</p>
  {#if resumeCode}
    <button type="button" class="btn-primary" onclick={onresume}>
      {t(locale, 'home.resume', { code: formatCode(resumeCode) })}
    </button>
  {/if}
  <div class="card">
    <button type="button" class={resumeCode ? 'btn' : 'btn-primary'} onclick={onplay}>
      {t(locale, 'home.playLocal')}
    </button>
    <p>{t(locale, 'home.playLocalHint')}</p>
  </div>
  <div class="card">
    <div class="two">
      <button type="button" class="btn" onclick={oncreate}>{t(locale, 'home.createRoom')}</button>
      <button type="button" class="btn" onclick={onjoin}>{t(locale, 'home.joinRoom')}</button>
    </div>
    <p>{t(locale, 'home.onlineHint')}</p>
  </div>
  <p class="soon">{t(locale, 'home.online')}</p>
</main>

<style>
  .home {
    max-width: 36rem;
    margin: 0 auto;
    padding: 48px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h1 {
    font-size: 2.6rem;
  }
  .tagline {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
  }
  .card {
    background: var(--panel);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 8px;
  }
  .card p,
  .soon {
    margin: 0;
    color: var(--muted);
    font-weight: 600;
  }
</style>

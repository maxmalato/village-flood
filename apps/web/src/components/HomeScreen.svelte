<script lang="ts">
  import { formatCode } from '@village-flood/kit'
  import { errorText, t, type Locale } from '../i18n.ts'

  let {
    locale,
    resumeCode = null,
    onplay,
    oncreate,
    onjoin,
    onresume,
    ontable,
    tableError = null,
  }: {
    locale: Locale
    /** Sala guardada neste aparelho, para voltar a ela. */
    resumeCode?: string | null
    onplay: () => void
    oncreate: () => void
    onjoin: () => void
    onresume: () => void
    ontable: () => void
    /** Falha ao abrir a mesa (ex.: sem internet), código de erro. */
    tableError?: string | null
  } = $props()

  let online = $state(navigator.onLine)
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
  <!-- Modo mesa só em tablet e telas maiores: no celular, a tela é pequena demais para servir de
       tabuleiro da mesa (o celular entra na mesa como controle, pelo QR code). -->
  <div class="card table-card">
    <button type="button" class="btn" onclick={ontable}>{t(locale, 'home.openTable')}</button>
    <p>{t(locale, 'home.tableHint')}</p>
    {#if tableError}<p class="error" role="alert">{errorText(locale, tableError)}</p>{/if}
  </div>
  {#if !online}<p class="soon" role="status">{t(locale, 'home.offline')}</p>{/if}
</main>

<svelte:window onoffline={() => (online = false)} ononline={() => (online = true)} />

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
  .error {
    color: var(--danger) !important;
    font-weight: 800 !important;
  }
  .table-card {
    display: none;
  }
  /* tablet (em pé ou deitado) e telas maiores; celular deitado tem altura menor que 500 px */
  @media (min-width: 768px) and (min-height: 500px) {
    .table-card {
      display: flex;
    }
  }
  .card p,
  .soon {
    margin: 0;
    color: var(--muted);
    font-weight: 600;
  }
</style>

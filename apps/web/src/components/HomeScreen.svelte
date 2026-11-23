<script lang="ts">
  import { formatCode } from '@village-flood/kit'
  import { errorText, t, type Locale } from '../i18n.ts'
  import Logo from './Logo.svelte'

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
  <h1 class="brand" tabindex="-1"><Logo size={60} /><span>{t(locale, 'app.title')}</span></h1>
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
  /* título e logo acompanham a largura: no celular, "Enchente na Vila" cabe numa linha */
  h1 {
    font-size: clamp(1.6rem, 8vw, 2.6rem);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: clamp(10px, 3vw, 14px);
  }
  .brand :global(.logo) {
    width: clamp(44px, 13vw, 60px);
    height: auto;
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

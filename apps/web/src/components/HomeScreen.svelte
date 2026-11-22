<script lang="ts">
  import { t, type Locale } from '../i18n.ts'

  let { locale, onplay }: { locale: Locale; onplay: () => void } = $props()
</script>

<main class="home">
  <h1 tabindex="-1">{t(locale, 'app.title')}</h1>
  <p class="tagline">{t(locale, 'app.tagline')}</p>
  <div class="card">
    <button type="button" class="btn-primary" onclick={onplay}>
      {t(locale, 'home.playLocal')}
    </button>
    <p>{t(locale, 'home.playLocalHint')}</p>
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
  .card p,
  .soon {
    margin: 0;
    color: var(--muted);
    font-weight: 600;
  }
</style>

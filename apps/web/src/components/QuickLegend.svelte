<script lang="ts">
  import { t, type Locale } from '../i18n.ts'
  import Swatch from './Swatch.svelte'

  let { locale, onopen }: { locale: Locale; onopen: () => void } = $props()
</script>

<section class="panel" aria-labelledby="quick-legend-title">
  <h2 id="quick-legend-title" class="panel-title">{t(locale, 'legend.quick')}</h2>
  <ul>
    <li><Swatch kind="dry" size={22} /> {t(locale, 'legend.dry')}</li>
    <li><Swatch kind="flooded" size={22} /> {t(locale, 'legend.flooded')}</li>
    <li><Swatch kind="submerged" size={22} /> {t(locale, 'legend.submerged')}</li>
  </ul>
  <p>
    <span><strong>{t(locale, 'legend.church')}:</strong> {t(locale, 'legend.churchShort')}</span>
    <span><strong>{t(locale, 'legend.dock')}:</strong> {t(locale, 'legend.dockShort')}</span>
  </p>
  <button type="button" class="btn" onclick={onopen}>{t(locale, 'legend.open')}</button>
</section>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
  }
  p {
    margin: 0;
    display: flex;
    gap: 12px;
    font-weight: 700;
  }
  strong {
    color: var(--accent-text);
  }
</style>

<script lang="ts">
  import { t, type Locale } from '../i18n.ts'
  import { legendGroups } from '../lib/legend.ts'
  import Swatch from './Swatch.svelte'

  let { locale, open, onclose }: { locale: Locale; open: boolean; onclose: () => void } = $props()
  let dialog: HTMLDialogElement | undefined = $state()

  // <dialog> nativo: prende o foco dentro e devolve ao botão que abriu ao fechar.
  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  })
</script>

<dialog bind:this={dialog} class="legend" aria-labelledby="legend-title" {onclose}>
  <div class="head">
    <h2 id="legend-title">{t(locale, 'legend.title')}</h2>
    <button type="button" class="btn btn-pill" onclick={onclose}>
      {t(locale, 'legend.close')}
    </button>
  </div>
  <p class="intro">{t(locale, 'legend.intro')}</p>
  <div class="groups">
    {#each legendGroups as group (group.title)}
      <section>
        <h3 class="panel-title">{t(locale, group.title)}</h3>
        <ul>
          {#each group.items as item (item.title)}
            <li>
              <Swatch kind={item.swatch} />
              <span>
                <strong>{t(locale, item.title)}</strong>
                <span class="text">{t(locale, item.text)}</span>
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
  <button type="button" class="btn-primary back" onclick={onclose}>
    {t(locale, 'legend.back')}
  </button>
</dialog>

<style>
  .legend {
    width: min(1200px, 100vw);
    max-width: 100vw;
    max-height: 100vh;
    margin: auto;
    border: 0;
    border-radius: 16px;
    padding: 20px;
    background: var(--bg);
    color: var(--text);
  }
  .legend::backdrop {
    background: rgba(0, 0, 0, 0.6);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    font-size: 2rem;
  }
  .intro {
    color: var(--muted);
    font-weight: 700;
  }
  .groups {
    display: grid;
    gap: 16px;
  }
  ul {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--panel);
  }
  li span {
    display: flex;
    flex-direction: column;
  }
  .text {
    color: var(--muted);
    font-weight: 600;
  }
  .back {
    width: 100%;
    margin-top: 16px;
  }
  @media (min-width: 900px) {
    .groups {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>

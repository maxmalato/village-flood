<script lang="ts">
  // "Como jogar": regras resumidas num diálogo nativo. O cabeçalho fica fixo e o conteúdo rola
  // dentro da janela quando passa da altura da tela.
  import { t, type Locale } from '../i18n.ts'
  import { howToSections } from '../lib/howto.ts'

  let { locale, open, onclose }: { locale: Locale; open: boolean; onclose: () => void } = $props()
  let dialog: HTMLDialogElement | undefined = $state()
  const sections = howToSections()

  // <dialog> nativo: prende o foco dentro, fecha com Esc e devolve o foco ao botão que abriu.
  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  })
</script>

<dialog bind:this={dialog} class="howto" aria-labelledby="howto-title" {onclose}>
  <!-- conteúdo só existe com a janela aberta (o diálogo fica no topo de todas as telas) -->
  {#if open}
    <div class="head">
      <div>
        <h2 id="howto-title">{t(locale, 'howto.title')}</h2>
        <p class="intro">{t(locale, 'howto.intro')}</p>
      </div>
      <button type="button" class="btn btn-pill close" onclick={onclose}>
        {t(locale, 'howto.close')}
      </button>
    </div>

    <!-- Região rolável: entra na ordem do Tab para rolar pelo teclado (setas). -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="body" tabindex="0" role="region" aria-label={t(locale, 'howto.region')}>
      {#each sections as section (section.title)}
        <section class="card">
          <h3>{t(locale, section.title)}</h3>
          <ul>
            {#each section.items as item (item.key)}
              <li>
                {#if item.role}
                  <strong>{t(locale, item.role.name)}:</strong>
                  {t(locale, item.role.info)}
                {:else}
                  {t(locale, item.key, item.params)}
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/each}
      <button type="button" class="btn-primary ok" onclick={onclose}>
        {t(locale, 'howto.ok')}
      </button>
    </div>
  {/if}
</dialog>

<style>
  .howto {
    width: min(720px, calc(100vw - 16px));
    max-width: calc(100vw - 16px);
    /* nunca passa da tela: o conteúdo rola por dentro */
    max-height: calc(100dvh - 32px);
    margin: auto;
    border: 2px solid var(--border-muted);
    border-radius: 18px;
    padding: 0;
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
  }
  .howto[open] {
    display: flex;
    flex-direction: column;
  }
  .howto::backdrop {
    background: rgba(0, 0, 0, 0.6);
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px 12px;
    border-bottom: 1px solid var(--border-muted);
  }
  h2 {
    font-size: 1.8rem;
  }
  .intro {
    margin: 4px 0 0;
    color: var(--muted);
    font-weight: 700;
  }
  .close {
    flex: none;
  }
  .body {
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 14px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .body:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: -3px;
  }
  .card {
    background: var(--panel);
    border-radius: 14px;
    padding: 12px 16px;
  }
  h3 {
    margin: 0 0 6px;
    font-size: 1.15rem;
    color: var(--accent-text);
  }
  ul {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-weight: 600;
    line-height: 1.45;
  }
  .ok {
    width: 100%;
    margin-top: 4px;
    flex: none;
  }
</style>

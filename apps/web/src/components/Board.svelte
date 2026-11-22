<script lang="ts">
  import type { TileView } from '../lib/view.ts'
  import Tile from './Tile.svelte'

  let {
    tiles,
    columns,
    label,
    onselect,
    interactive = true,
  }: {
    tiles: readonly TileView[]
    columns: number
    label: string
    onselect: (id: string) => void
    /** false: só mostra (mesa/TV); as quadras saem da ordem do Tab e do controle remoto. */
    interactive?: boolean
  } = $props()

  const rows = $derived(Math.ceil(tiles.length / columns))
  const letters = $derived(Array.from({ length: columns }, (_, i) => String.fromCharCode(65 + i)))
  let grid: HTMLDivElement | undefined = $state()

  // Só uma quadra entra na ordem do Tab (a selecionada ou a primeira); as setas andam no tabuleiro.
  const focusId = $derived(tiles.find((t) => t.selected)?.id ?? tiles[0]?.id ?? '')

  function onkey(event: KeyboardEvent, id: string) {
    const index = tiles.findIndex((t) => t.id === id)
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    }
    const delta = moves[event.key]
    if (delta === undefined) return
    const next = tiles[index + delta]
    const sameRow =
      Math.abs(delta) !== 1 || Math.floor((index + delta) / columns) === Math.floor(index / columns)
    if (!next || !sameRow) return
    event.preventDefault()
    grid?.querySelector<HTMLButtonElement>(`[data-tile="${next.id}"]`)?.focus()
  }
</script>

<div class="board" role="group" aria-label={label} bind:this={grid} style:--columns={columns}>
  <span aria-hidden="true"></span>
  {#each letters as letter (letter)}
    <span class="label" aria-hidden="true">{letter}</span>
  {/each}
  {#each { length: rows } as _, y (y)}
    <span class="label" aria-hidden="true">{y + 1}</span>
    {#each tiles.slice(y * columns, (y + 1) * columns) as tile (tile.id)}
      <Tile {tile} focusable={interactive && tile.id === focusId} {onselect} {onkey} />
    {/each}
  {/each}
</div>

<style>
  .board {
    display: grid;
    grid-template-columns: 18px repeat(var(--columns), minmax(44px, 1fr));
    gap: 3px;
    width: 100%;
  }
  .label {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 18px;
    font-size: 0.875rem;
    font-weight: 800;
    color: var(--muted);
  }
  @media (min-width: 1000px) {
    .board {
      gap: 4px;
    }
  }
</style>

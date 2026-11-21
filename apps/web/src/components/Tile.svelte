<script lang="ts">
  import type { TileView } from '../lib/view.ts'
  import Icon from './Icon.svelte'

  let {
    tile,
    focusable,
    onselect,
    onkey,
  }: {
    tile: TileView
    focusable: boolean
    onselect: (id: string) => void
    onkey: (event: KeyboardEvent, id: string) => void
  } = $props()

  const icon = $derived(
    tile.kind === 'church'
      ? 'church'
      : tile.kind === 'dock'
        ? 'dock'
        : tile.kind === 'house'
          ? tile.waiting > 0
            ? 'house'
            : 'house-empty'
          : null,
  )
</script>

<button
  type="button"
  class="tile {tile.water === 'dry' ? `water-dry-${tile.height}` : `water-${tile.water}`}"
  class:selected={tile.selected}
  class:reachable={tile.cost !== null}
  class:suggested={tile.suggested}
  data-tile={tile.id}
  aria-label={tile.aria}
  aria-pressed={tile.selected}
  tabindex={focusable ? 0 : -1}
  onclick={() => onselect(tile.id)}
  onkeydown={(event) => onkey(event, tile.id)}
>
  <span class="height txt" aria-hidden="true" data-text={tile.height}></span>

  {#if icon}
    <span class="icon {icon}" aria-hidden="true">
      <Icon name={icon} color={icon === 'house-empty' ? '#5B6B78' : '#10263B'} />
    </span>
  {/if}

  {#if tile.sandbags > 0}
    <span class="sandbags" aria-hidden="true">
      {#each { length: tile.sandbags } as _, i (i)}<span class="bag"></span>{/each}
    </span>
  {/if}

  {#if tile.injured > 0}
    <span class="badge injured" aria-hidden="true">
      <Icon name="first-aid" size={12} color="#B3401F" /><span class="txt" data-text={tile.injured}
      ></span>
    </span>
  {:else if tile.waiting > 1}
    <span class="badge waiting txt" aria-hidden="true" data-text={tile.waiting}></span>
  {:else if tile.mark === 'cleared'}
    <span class="mark ok" aria-hidden="true"><Icon name="check" size={11} color="#1F6F66" /></span>
  {:else if tile.mark === 'lost'}
    <span class="mark lost" aria-hidden="true">
      <Icon name="cross" size={10} color="#B3401F" />
    </span>
  {/if}

  {#if tile.pawns.length > 0}
    <span class="pawns" class:many={tile.pawns.length >= 3} aria-hidden="true">
      {#each tile.pawns as pawn (pawn.seat)}
        <span
          class="pawn txt"
          class:active={pawn.active}
          style:background={pawn.color}
          data-text={pawn.initial}
        >
          {#if pawn.carrying > 0}
            <span class="carry">
              <Icon name="person" size={9} color="#F3EBD8" /><span
                class="txt"
                data-text={pawn.carrying}
              ></span>
            </span>
          {/if}
        </span>
      {/each}
    </span>
  {/if}

  {#if tile.cost !== null}
    <span class="cost txt" aria-hidden="true" data-text={tile.cost}></span>
  {/if}
</button>

<style>
  /* Números e iniciais desenhados por CSS: decorativos; quem lê a tela ouve o aria-label. */
  .txt::before {
    content: attr(data-text);
  }

  .tile {
    position: relative;
    aspect-ratio: 1;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(16, 38, 59, 0.35);
    color: var(--ink);
  }

  .reachable {
    box-shadow: inset 0 0 0 3px var(--accent);
  }
  .selected {
    box-shadow:
      inset 0 0 0 3px var(--accent),
      inset 0 0 0 5px #ffffff;
  }
  .suggested {
    outline: 3px dashed #ffffff;
    outline-offset: -6px;
  }

  .height {
    position: absolute;
    top: 3px;
    left: 3px;
    min-width: 16px;
    height: 16px;
    border-radius: 5px;
    background: var(--cream);
    color: var(--ink);
    font-size: 0.8rem;
    font-weight: 800;
    line-height: 16px;
    text-align: center;
  }

  .icon {
    position: absolute;
    top: 22%;
    left: 50%;
    transform: translateX(-50%);
    width: 22px;
    height: 22px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--cream);
  }
  .icon.house-empty {
    background: rgba(243, 235, 216, 0.75);
  }
  .icon.church,
  .icon.dock {
    background: var(--accent);
  }

  .sandbags {
    position: absolute;
    top: 4px;
    right: 22px;
    display: flex;
    gap: 2px;
  }
  .bag {
    width: 8px;
    height: 6px;
    border-radius: 3px;
    background: #7a5b2e;
    box-shadow: 0 0 0 1px var(--cream);
  }

  .badge,
  .mark {
    position: absolute;
    bottom: 3px;
    right: 3px;
    height: 18px;
    border-radius: 9px;
    background: #ffffff;
    color: var(--ink);
    font-size: 0.8rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .badge {
    padding: 0 4px;
    gap: 2px;
    border: 2px solid var(--ink);
  }
  .badge.injured {
    border-color: var(--mark-lost);
  }
  .mark {
    width: 18px;
    border: 2px solid var(--mark-ok);
  }
  .mark.lost {
    border-color: var(--mark-lost);
  }

  .pawns {
    position: absolute;
    bottom: 3px;
    left: 3px;
    display: flex;
  }
  .pawn {
    position: relative;
    width: 22px;
    height: 22px;
    margin-right: -7px;
    border-radius: 50%;
    border: 2px solid var(--ink);
    box-shadow: 0 0 0 1.5px var(--cream);
    color: var(--ink);
    font-family: var(--font-title);
    font-weight: 600;
    font-size: 0.8rem;
    line-height: 18px;
    text-align: center;
  }
  .pawn.active {
    border: 3px solid var(--accent);
    line-height: 16px;
    z-index: 1;
  }
  /* 3 ou 4 voluntários na mesma quadra: peões menores e mais sobrepostos, sem sair da quadra. */
  .many .pawn {
    width: 16px;
    height: 16px;
    margin-right: -5px;
    border-width: 1.5px;
    font-size: 0.6rem;
    line-height: 13px;
  }
  .many .pawn.active {
    border-width: 2px;
    line-height: 12px;
  }
  .many .carry {
    top: -11px;
    left: 4px;
    height: 12px;
    font-size: 0.6rem;
    line-height: 12px;
  }

  .carry {
    position: absolute;
    top: -13px;
    left: 8px;
    height: 14px;
    padding: 0 3px;
    border-radius: 7px;
    background: var(--ink);
    color: var(--cream);
    font-family: var(--font-body);
    font-size: 0.7rem;
    font-weight: 800;
    line-height: 14px;
    display: flex;
    align-items: center;
    gap: 1px;
  }

  .cost {
    position: absolute;
    top: 3px;
    right: 3px;
    min-width: 18px;
    height: 18px;
    padding: 0 3px;
    border-radius: 9px;
    background: var(--accent);
    color: var(--ink);
    font-size: 0.8rem;
    font-weight: 800;
    line-height: 18px;
    text-align: center;
  }

  @media (min-width: 1000px) {
    .height {
      min-width: 20px;
      height: 20px;
      line-height: 20px;
      font-size: 0.875rem;
    }
    .icon {
      width: 32px;
      height: 32px;
    }
    .pawn {
      width: 28px;
      height: 28px;
      line-height: 24px;
      font-size: 0.95rem;
    }
    .pawn.active {
      line-height: 22px;
    }
    .many .pawn {
      width: 22px;
      height: 22px;
      margin-right: -6px;
      font-size: 0.8rem;
      line-height: 19px;
    }
    .many .pawn.active {
      line-height: 18px;
    }
    .badge,
    .mark {
      height: 22px;
      min-width: 22px;
      font-size: 0.875rem;
    }
    .cost {
      min-width: 22px;
      height: 22px;
      line-height: 22px;
      font-size: 0.875rem;
    }
  }
</style>

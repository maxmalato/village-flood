<script lang="ts">
  import type { Swatch } from '../lib/legend.ts'
  import Icon from './Icon.svelte'

  let { kind, size = 40 }: { kind: Swatch; size?: number } = $props()
</script>

<span class="swatch" style:width="{size}px" style:height="{size}px" aria-hidden="true">
  {#if kind === 'dry'}
    <span class="fill water-dry-2"></span>
  {:else if kind === 'flooded'}
    <span class="fill water-flooded"></span>
  {:else if kind === 'submerged'}
    <span class="fill water-submerged"></span>
  {:else if kind === 'church' || kind === 'dock'}
    <span class="fill gold"><Icon name={kind} size={size * 0.6} color="#10263B" /></span>
  {:else if kind === 'injured'}
    <span class="chip injured"><Icon name="first-aid" size={15} color="#B3401F" />1</span>
  {:else if kind === 'cleared'}
    <span class="round ok"><Icon name="check" size={16} color="#1F6F66" /></span>
  {:else if kind === 'lost'}
    <span class="round lost"><Icon name="cross" size={14} color="#B3401F" /></span>
  {:else if kind === 'volunteer'}
    <span class="round pawn">A</span>
  {:else if kind === 'carrying'}
    <span class="chip dark"><Icon name="person" size={12} color="#F3EBD8" />1</span>
  {:else if kind === 'cost'}
    <span class="round cost">2</span>
  {:else if kind === 'hint'}
    <span class="fill water-dry-2 hint"></span>
  {/if}
</span>

<style>
  .swatch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }
  .fill {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    box-shadow: inset 0 0 0 2px rgba(243, 235, 216, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gold {
    background: var(--accent);
  }
  .hint {
    outline: 3px dashed #ffffff;
    outline-offset: -6px;
  }
  .chip {
    height: 26px;
    padding: 0 8px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-weight: 800;
  }
  .chip.injured {
    background: #ffffff;
    color: #10263b;
    border: 2px solid #b3401f;
  }
  .chip.dark {
    background: #10263b;
    color: #f3ebd8;
    border: 2px solid #f3ebd8;
  }
  .round {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
  }
  .round.ok {
    background: #ffffff;
    border: 2px solid #1f6f66;
  }
  .round.lost {
    background: #ffffff;
    border: 2px solid #b3401f;
  }
  .round.pawn {
    background: #4fc3f7;
    color: #10263b;
    border: 3px solid #f2b84b;
    font-family: var(--font-title);
  }
  .round.cost {
    background: #f2b84b;
    color: #10263b;
  }
</style>

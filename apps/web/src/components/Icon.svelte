<script lang="ts">
  // Ícones originais em SVG (traço), decorativos: o texto acessível fica no elemento pai.
  type Name =
    | 'house'
    | 'house-empty'
    | 'church'
    | 'dock'
    | 'check'
    | 'cross'
    | 'first-aid'
    | 'person'
    | 'cloud'
  let {
    name,
    size = 18,
    color = 'currentColor',
  }: { name: Name; size?: number; color?: string } = $props()
</script>

<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  {#if name === 'house'}
    <path
      d="M4 11l8-7 8 7v9H4z"
      fill="none"
      stroke={color}
      stroke-width="2.2"
      stroke-linejoin="round"
    />
    <path d="M10 20v-5h4v5" fill="none" stroke={color} stroke-width="2.2" stroke-linejoin="round" />
  {:else if name === 'house-empty'}
    <path
      d="M4 11l8-7 8 7v9H4z"
      fill="none"
      stroke={color}
      stroke-width="2.2"
      stroke-linejoin="round"
      stroke-dasharray="3 2"
    />
  {:else if name === 'church'}
    <path
      d="M12 2v6M9.5 4.5h5"
      fill="none"
      stroke={color}
      stroke-width="2.2"
      stroke-linecap="round"
    />
    <path
      d="M6 21V12l6-4 6 4v9z"
      fill="none"
      stroke={color}
      stroke-width="2.2"
      stroke-linejoin="round"
    />
    <path d="M10.5 21v-4h3v4" fill="none" stroke={color} stroke-width="2" stroke-linejoin="round" />
  {:else if name === 'dock'}
    <path
      d="M3 15h18l-3 5H6z"
      fill="none"
      stroke={color}
      stroke-width="2.2"
      stroke-linejoin="round"
    />
    <path
      d="M12 3v12M12 4l6 8h-6"
      fill="none"
      stroke={color}
      stroke-width="2.2"
      stroke-linejoin="round"
    />
  {:else if name === 'check'}
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      fill="none"
      stroke={color}
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {:else if name === 'cross'}
    <path
      d="M6 6l12 12M18 6L6 18"
      fill="none"
      stroke={color}
      stroke-width="3"
      stroke-linecap="round"
    />
  {:else if name === 'first-aid'}
    <!-- Caixa de primeiros socorros: quadrado cheio com cruz branca (não se confunde com "+"). -->
    <rect x="2" y="2" width="20" height="20" rx="5" fill={color} />
    <path
      d="M12 6.5v11M6.5 12h11"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="3.5"
      stroke-linecap="round"
    />
  {:else if name === 'person'}
    <circle cx="12" cy="7" r="3.5" fill="none" stroke={color} stroke-width="2.4" />
    <path
      d="M5 21c0-4 3-7 7-7s7 3 7 7"
      fill="none"
      stroke={color}
      stroke-width="2.4"
      stroke-linecap="round"
    />
  {:else if name === 'cloud'}
    <path
      d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 11a3.5 3.5 0 0 1-.5 7z"
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linejoin="round"
    />
  {/if}
</svg>

<script lang="ts">
  // QR code gerado no próprio aparelho (biblioteca uqr): o link da sala nunca passa por um
  // serviço externo. Módulos pretos sobre fundo branco, com margem, para qualquer câmera ler.
  import { encode } from 'uqr'

  let { text, label, size = 200 }: { text: string; label: string; size?: number } = $props()

  const MARGIN = 2
  const qr = $derived(encode(text, { ecc: 'M' }))
  const total = $derived(qr.size + MARGIN * 2)
  const path = $derived(
    qr.data
      .flatMap((row, y) =>
        row.map((dark, x) => (dark ? `M${x + MARGIN} ${y + MARGIN}h1v1h-1z` : '')),
      )
      .join(''),
  )
</script>

<svg
  class="qr"
  role="img"
  aria-label={label}
  viewBox="0 0 {total} {total}"
  width={size}
  height={size}
  shape-rendering="crispEdges"
>
  <rect width={total} height={total} fill="#ffffff" />
  <path d={path} fill="#000000" />
</svg>

<style>
  .qr {
    display: block;
    border-radius: 8px;
    max-width: 100%;
    height: auto;
  }
</style>

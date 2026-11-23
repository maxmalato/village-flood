<script lang="ts">
  // Logo do jogo ao lado do título. Decorativa: o nome já está escrito no título (alt vazio).
  let { size = 40 }: { size?: number } = $props()
</script>

<img class="logo" src="/logo-icon.svg" alt="" width={size} height={size} />

<style>
  .logo {
    flex: none;
    border-radius: 22%;
    box-shadow: 0 0 0 2px rgba(243, 235, 216, 0.25);
  }
</style>

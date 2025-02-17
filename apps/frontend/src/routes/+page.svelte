<script>
  let count = 0;
</script>

<main class="p-4">
  <h1 class="text-xl">SvelteKit Chrome Extension</h1>
  <button on:click={() => count++}>Clicked {count} times</button>
</main>

<style>
  main {
    width: 250px;
    text-align: center;
  }
</style>

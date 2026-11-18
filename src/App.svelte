<script lang="ts">
  import { games as allGames, type GameInfo } from './lib/games';
  import { parseGameId } from './lib/router';
  import Home from './routes/Home.svelte';

  let { games = allGames }: { games?: readonly GameInfo[] } = $props();

  let gameId = $state(parseGameId(window.location.hash));

  function onHashChange(): void {
    gameId = parseGameId(window.location.hash);
    window.scrollTo(0, 0);
  }
</script>

<svelte:window onhashchange={onHashChange} />

{#if gameId === undefined}
  <Home {games} />
{:else}
  {@const game = games.find((candidate) => candidate.id === gameId)}
  {#if game}
    {#await game.load()}
      <p class="status">Henter spillet…</p>
    {:then { default: Game }}
      <Game />
    {:catch}
      <p class="status">Spillet kunne ikke hentes.</p>
      <a href="#/">Tilbage til forsiden</a>
    {/await}
  {:else}
    <p class="status">Det spil findes ikke.</p>
    <a href="#/">Tilbage til forsiden</a>
  {/if}
{/if}

<style>
  .status {
    margin-top: 40vh;
    text-align: center;
    color: var(--text-muted);
  }

  a {
    display: block;
    text-align: center;
  }
</style>

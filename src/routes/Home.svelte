<script lang="ts">
  import type { GameInfo } from '../lib/games';
  import { gameHref } from '../lib/router';

  let { games }: { games: readonly GameInfo[] } = $props();
</script>

<header>
  <h1>Småspil</h1>
  <p>Vælg et spil. Alt virker også uden internet.</p>
</header>

{#if games.length === 0}
  <p class="empty">Spillene er på vej.</p>
{:else}
  <ul>
    {#each games as game (game.id)}
      <li>
        <a href={gameHref(game.id)}>
          <span class="icon" aria-hidden="true">{game.icon}</span>
          <span class="text">
            <strong>{game.title}</strong>
            <span>{game.description}</span>
          </span>
        </a>
      </li>
    {/each}
  </ul>
{/if}

<style>
  header {
    padding: 24px 0 8px;
  }

  h1 {
    margin: 0;
    font-size: 2.2rem;
  }

  header p {
    margin: 4px 0 0;
    color: var(--text-muted);
  }

  .empty {
    margin-top: 32px;
    padding: 32px 16px;
    text-align: center;
    color: var(--text-muted);
    background: var(--bg-raised);
    border-radius: var(--radius);
  }

  ul {
    display: grid;
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  a {
    display: flex;
    gap: var(--gap);
    align-items: center;
    min-height: 80px;
    padding: 16px;
    text-decoration: none;
    background: var(--bg-raised);
    border-radius: var(--radius);
    transition: transform 120ms ease;
  }

  a:active {
    transform: scale(0.97);
    background: var(--bg-pressed);
  }

  .icon {
    font-size: 2.4rem;
  }

  .text {
    display: grid;
    gap: 2px;
  }

  .text span {
    color: var(--text-muted);
  }
</style>

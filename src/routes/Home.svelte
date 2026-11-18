<script lang="ts">
  import type { GameInfo } from '../lib/games';
  import { gameHref } from '../lib/router';

  let { games }: { games: readonly GameInfo[] } = $props();
</script>

<header>
  <span class="badge"><span class="dot" aria-hidden="true"></span>Virker uden internet</span>
  <h1>Småspil</h1>
  <p>Små spil til sofaen, middagsbordet og køreturen.</p>
</header>

{#if games.length === 0}
  <p class="empty">Spillene er på vej.</p>
{:else}
  <ul>
    {#each games as game, index (game.id)}
      <li style:--from={game.colors[0]} style:--to={game.colors[1]} style:--delay="{index * 60}ms">
        {#if game.load}
          <a class="tile" href={gameHref(game.id)}>
            {@render tile(game)}
          </a>
        {:else}
          <div class="tile soon" aria-disabled="true">
            {@render tile(game)}
            <span class="pill">Kommer snart</span>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

{#snippet tile(game: GameInfo)}
  <span class="icon" aria-hidden="true">{game.icon}</span>
  <span class="text">
    <strong>{game.title}</strong>
    <span>{game.description}</span>
  </span>
{/snippet}

<style>
  header {
    padding: 28px 4px 12px;
  }

  .badge {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 6px 12px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--surface-border);
    border-radius: 999px;
    backdrop-filter: blur(12px);
  }

  .dot {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgb(34 197 94 / 20%);
  }

  h1 {
    margin: 16px 0 0;
    font-size: clamp(3rem, 14vw, 4.5rem);
    font-weight: 800;
    line-height: 0.95;
    background: linear-gradient(100deg, #6366f1, #d946ef 55%, #f97316);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  header p {
    margin: 12px 0 0;
    font-size: 1.05rem;
    color: var(--text-muted);
  }

  .empty {
    margin-top: 32px;
    padding: 40px 16px;
    text-align: center;
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-lg);
  }

  ul {
    display: grid;
    gap: 14px;
    margin: 24px 0 0;
    padding: 0;
    list-style: none;
  }

  li {
    animation: rise 520ms var(--ease-spring) both;
    animation-delay: var(--delay);
  }

  .tile {
    position: relative;
    display: flex;
    gap: 16px;
    align-items: center;
    min-height: 104px;
    padding: 18px;
    overflow: hidden;
    color: #fff;
    text-decoration: none;
    background: linear-gradient(135deg, var(--from), var(--to));
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    transition: transform 260ms var(--ease-spring);
  }

  .tile::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(120% 80% at 100% 0%, rgb(255 255 255 / 28%), transparent 55%),
      linear-gradient(to bottom, rgb(255 255 255 / 12%), transparent 40%);
  }

  a.tile:active {
    transform: scale(0.96);
  }

  .soon {
    filter: saturate(0.75);
  }

  .icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 64px;
    height: 64px;
    font-size: 2.1rem;
    background: rgb(255 255 255 / 22%);
    border: 1px solid rgb(255 255 255 / 30%);
    border-radius: var(--radius-md);
    backdrop-filter: blur(8px);
  }

  .text {
    display: grid;
    gap: 4px;
    padding-right: 8px;
  }

  .text strong {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .text span {
    font-size: 0.92rem;
    opacity: 0.9;
  }

  .pill {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 1;
    padding: 4px 10px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: rgb(0 0 0 / 22%);
    border-radius: 999px;
    backdrop-filter: blur(6px);
  }

  .soon .text {
    padding-top: 18px;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.98);
    }
  }
</style>

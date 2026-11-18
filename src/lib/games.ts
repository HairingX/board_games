import type { Component } from 'svelte';

/** A game the home screen offers. */
export interface GameInfo {
  /** The game's part of the address, lowercase letters, digits and hyphens. */
  id: string;
  title: string;
  description: string;
  /** An emoji shown on the game's tile. */
  icon: string;
  /** Loads the game's screen, so each game is fetched only when it is first opened. */
  load: () => Promise<{ default: Component }>;
}

/** Every game, in the order the home screen shows them. */
export const games: readonly GameInfo[] = [];

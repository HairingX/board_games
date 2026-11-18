import type { Component } from 'svelte';

/** A game the home screen offers. */
export interface GameInfo {
  /** The game's part of the address, lowercase letters, digits and hyphens. */
  id: string;
  title: string;
  description: string;
  /** An emoji shown on the game's tile. */
  icon: string;
  /** The two colours of the tile's gradient, as CSS colours. */
  colors: readonly [string, string];
  /**
   * Loads the game's screen, so each game is fetched only when it is first opened. A game
   * without it is shown as coming soon.
   */
  load?: () => Promise<{ default: Component }>;
}

/** Every game, in the order the home screen shows them. */
export const games: readonly GameInfo[] = [
  {
    id: 'regnespil',
    title: 'Regnespil',
    description: 'Plus, minus og gange på tid. Hvem er hurtigst?',
    icon: '🧮',
    colors: ['#22c55e', '#0ea5e9'],
  },
  {
    id: 'parkort',
    title: 'Parkort',
    description: 'Spørgsmål der bringer jer tættere på hinanden.',
    icon: '💞',
    colors: ['#f43f5e', '#f59e0b'],
  },
  {
    id: 'koretur',
    title: 'Quiz på køreturen',
    description: 'Paratviden for hele bilen.',
    icon: '🚗',
    colors: ['#6366f1', '#d946ef'],
  },
];

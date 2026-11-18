import { lazy, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import type { Audience } from '../family/family';
import { Emblem } from '../games/parkort/Emblem';

/** A game the home screen offers. */
export interface GameInfo {
  /** The game's part of the address, lowercase letters, digits and hyphens. */
  id: string;
  title: string;
  description: string;
  /** What its tile shows beside the title. */
  icon: ReactNode;
  /** Who may play it; children never see grown-ups' games. */
  audience: Audience;
  /** The colour of its cards, and the colour of the fine lines on them. */
  colors: { card: string; accent: string };
  /**
   * The game's screen, made with React's lazy so each game is fetched only when it is first
   * opened. A game without one is shown as coming soon.
   */
  Screen?: ComponentType;
}

/** The game's colours as the CSS custom properties its styles and the buttons use. */
export function gameTheme(game: GameInfo): CSSProperties {
  return {
    '--game': game.colors.card,
    '--game-accent': game.colors.accent,
    '--on-game': 'var(--paper)',
  } as CSSProperties;
}

/** Every game, in the order the home screen shows them. */
export const games: readonly GameInfo[] = [
  {
    id: 'parkort',
    title: 'Parkort',
    description: 'Spørgsmål der får jer til at snakke om det, der fylder.',
    icon: <Emblem size={40} />,
    audience: 'voksne',
    colors: { card: '#3b2638', accent: '#c8a96b' },
    Screen: lazy(() => import('../games/parkort/Parkort')),
  },
  {
    id: 'regnespil',
    title: 'Regnespil',
    description: 'Plus, minus og gange på tid. Hvem er hurtigst?',
    icon: '🧮',
    audience: 'børn',
    colors: { card: '#1f4e5a', accent: '#e9c46a' },
  },
  {
    id: 'koretur',
    title: 'Quiz på køreturen',
    description: 'Paratviden for hele bilen.',
    icon: '🚗',
    audience: 'alle',
    colors: { card: '#9e4a30', accent: '#eed9b7' },
  },
];

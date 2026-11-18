import { lazy, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import type { Audience, Profile } from '../family/family';
import { Emblem } from '../games/parkort/Emblem';

/** What a game is given when it starts. */
export interface GameProps {
  /** Who is playing, chosen before the game starts. */
  players: readonly Profile[];
  /**
   * Where the game saves. For a game played together it is the group's own key; for a game
   * where each plays for themselves, each player's progress goes under
   * `playerSaveKey(saveKey, player)`.
   */
  saveKey: string;
}

/** How many play a game, and whether its progress belongs to the group or to each player. */
export interface Players {
  min: number;
  max: number;
  progress: 'sammen' | 'hver';
}

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
  players: Players;
  /** Where the game saved before players were chosen; the first group to play takes it over. */
  formerSaveKey?: string;
  /** The colour of its cards, and the colour of the fine lines on them. */
  colors: { card: string; accent: string };
  /**
   * The game's screen, made with React's lazy so each game is fetched only when it is first
   * opened. A game without one is shown as coming soon.
   */
  Screen?: ComponentType<GameProps>;
}

/**
 * Where the game is saved for these players: for a game played together, one key for the
 * group, the same whoever chose them and in whatever order; otherwise the game's own key.
 */
export function gameSaveKey(game: GameInfo, players: readonly Profile[]): string {
  if (game.players.progress === 'hver') return game.id;
  const ids = players.map((player) => player.id).sort();
  return `${game.id}/${ids.join('+')}`;
}

/** Where a game where each plays for themselves saves one player's progress. */
export function playerSaveKey(saveKey: string, player: Profile): string {
  return `${saveKey}/${player.id}`;
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
    players: { min: 2, max: 2, progress: 'sammen' },
    formerSaveKey: 'parkort',
    colors: { card: '#3b2638', accent: '#c8a96b' },
    Screen: lazy(() => import('../games/parkort/Parkort')),
  },
  {
    id: 'regnespil',
    title: 'Regnespil',
    description: 'Plus, minus og gange på tid. Hvem er hurtigst?',
    icon: '🧮',
    audience: 'børn',
    players: { min: 1, max: 6, progress: 'hver' },
    colors: { card: '#1f4e5a', accent: '#e9c46a' },
  },
  {
    id: 'koretur',
    title: 'Quiz på køreturen',
    description: 'Paratviden for hele bilen.',
    icon: '🚗',
    audience: 'alle',
    players: { min: 1, max: 6, progress: 'hver' },
    colors: { card: '#9e4a30', accent: '#eed9b7' },
  },
];

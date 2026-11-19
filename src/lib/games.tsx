import { lazy, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import type { Audience, Profile } from '../family/family';
import { about as parkort, languages as parkortLanguages } from '../games/parkort/about';
import { Emblem } from '../games/parkort/Emblem';
import { locales, type Locale, type Translations } from '../i18n/locales';

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
  /**
   * Where in the game the players are, as parts of its address after the players, such as
   * `['kort']`; empty at the game's start. It comes back after a reload or an update.
   */
  place: readonly string[];
  /** Goes to another place in the game, as a step the back gesture undoes. */
  go: (place: readonly string[]) => void;
}

/** How many play a game, and whether its progress belongs to the group or to each player. */
export interface Players {
  min: number;
  max: number;
  progress: 'sammen' | 'hver';
}

/** A game's name and a line on what it is, in one language. */
export interface GameAbout {
  title: string;
  /**
   * The start of the title set a little heavier, where the title joins two words that could be
   * misread as one, such as "Par" in Parkort, which is otherwise read as parkour.
   */
  stress?: string;
  description: string;
}

/** A game the home screen offers. */
export interface GameInfo {
  /** The game's part of the address, lowercase letters, digits and hyphens. */
  id: string;
  about: Translations<GameAbout>;
  /**
   * The languages its own content, such as the questions on its cards, is written in. In any
   * other language its screens are translated, and its tile says the content is not.
   */
  languages: readonly Locale[];
  /** What its tile shows beside the title. */
  icon: ReactNode;
  /** Who may play it; children never see grown-ups' games. */
  audience: Audience;
  players: Players;
  /** Where the game saved before players were chosen; the first group to play takes it over. */
  formerSaveKey?: string;
  /**
   * Whether the game is still being built: offered only while beta is on in the settings,
   * marked as in development, so the family can try it as it grows.
   */
  beta?: boolean;
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
    about: parkort,
    languages: parkortLanguages,
    icon: <Emblem size={40} />,
    audience: 'voksne',
    players: { min: 2, max: 2, progress: 'sammen' },
    formerSaveKey: 'parkort',
    colors: { card: '#3b2638', accent: '#c8a96b' },
    Screen: lazy(() => import('../games/parkort/Parkort')),
  },
  {
    id: 'regnespil',
    about: {
      da: { title: 'Regnespil', description: 'Et eventyr, hvor regnestykker besejrer monstre.' },
      en: { title: 'Sum Quest', description: 'An adventure where sums defeat monsters.' },
    },
    languages: locales,
    icon: '🧮',
    audience: 'alle',
    players: { min: 1, max: 6, progress: 'hver' },
    colors: { card: '#1f4e5a', accent: '#e9c46a' },
    beta: true,
    Screen: lazy(() => import('../games/regnespil/Regnespil')),
  },
  {
    id: 'koretur',
    about: {
      da: { title: 'Quiz på køreturen', description: 'Paratviden for hele bilen.' },
      en: { title: 'Road Trip Quiz', description: 'General knowledge for the whole car.' },
    },
    languages: ['da'],
    icon: '🚗',
    audience: 'alle',
    players: { min: 1, max: 6, progress: 'hver' },
    colors: { card: '#9e4a30', accent: '#eed9b7' },
  },
];

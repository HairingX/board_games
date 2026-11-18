import { shuffle, type Random } from '../../lib/random';
import { categories, type CategoryId, type QuestionCard } from './cards';

/** The order cards are drawn in: all shuffled, or light cards before deeper ones. */
export type Mode = 'blandet' | 'let-til-dyb';

/** What the game remembers between sessions. */
export interface DeckState {
  /** Every card's id in the order they are drawn. */
  order: string[];
  /** The ids of the cards talked about. */
  seen: string[];
  /** The categories played. */
  categories: CategoryId[];
  mode: Mode;
}

const allCategories = categories.map((category) => category.id);

/** A new deck: every category, shuffled, nothing seen. */
export function newDeck(cards: readonly QuestionCard[], random?: Random): DeckState {
  return {
    order: shuffle(
      cards.map((card) => card.id),
      random,
    ),
    seen: [],
    categories: [...allCategories],
    mode: 'blandet',
  };
}

/**
 * The saved deck brought up to date with the cards: removed cards are dropped, and new cards
 * are shuffled in after those already in the order.
 */
export function reconcile(
  state: DeckState,
  cards: readonly QuestionCard[],
  random?: Random,
): DeckState {
  const ids = new Set(cards.map((card) => card.id));
  const order = state.order.filter((id) => ids.has(id));
  const known = new Set(order);
  const added = shuffle(
    cards.map((card) => card.id).filter((id) => !known.has(id)),
    random,
  );
  return {
    ...state,
    order: [...order, ...added],
    seen: state.seen.filter((id) => ids.has(id)),
    categories: state.categories.filter((id) => allCategories.includes(id)),
  };
}

/** The cards still to be drawn from the chosen categories, next first. */
export function remaining(state: DeckState, cards: readonly QuestionCard[]): QuestionCard[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const seen = new Set(state.seen);
  const chosen = new Set(state.categories);
  const queue = state.order
    .map((id) => byId.get(id))
    .filter((card): card is QuestionCard => card !== undefined)
    .filter((card) => chosen.has(card.category) && !seen.has(card.id));
  return state.mode === 'let-til-dyb' ? queue.sort((a, b) => a.level - b.level) : queue;
}

/** How many cards of the chosen categories have been talked about, of how many. */
export function progress(
  state: DeckState,
  cards: readonly QuestionCard[],
): { seen: number; total: number } {
  const chosen = new Set(state.categories);
  const seen = new Set(state.seen);
  const inPlay = cards.filter((card) => chosen.has(card.category));
  return { seen: inPlay.filter((card) => seen.has(card.id)).length, total: inPlay.length };
}

/** The deck with the card talked about. */
export function markSeen(state: DeckState, id: string): DeckState {
  return state.seen.includes(id) ? state : { ...state, seen: [...state.seen, id] };
}

/** The deck with the card moved to the bottom, to come back after the others. */
export function skip(state: DeckState, id: string): DeckState {
  return { ...state, order: [...state.order.filter((other) => other !== id), id] };
}

/** The deck with nothing seen and a new shuffle, keeping the chosen categories and mode. */
export function restart(
  state: DeckState,
  cards: readonly QuestionCard[],
  random?: Random,
): DeckState {
  return { ...newDeck(cards, random), categories: state.categories, mode: state.mode };
}

/** Whether a stored value has the shape of a deck. */
export function isDeckState(value: unknown): value is DeckState {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as Record<string, unknown>;
  return (
    isStringArray(state.order) &&
    isStringArray(state.seen) &&
    isStringArray(state.categories) &&
    (state.mode === 'blandet' || state.mode === 'let-til-dyb')
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

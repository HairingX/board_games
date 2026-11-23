import { shuffle, type Random } from '../../lib/random';
import { categories, type CategoryId, type QuestionCard } from './cards';

/** The order cards are drawn in: all shuffled, or light cards before deeper ones. */
export type Mode = 'blandet' | 'let-til-dyb';

/** A card put away: talked about, or put off till later. */
export interface Step {
  id: string;
  action: 'seen' | 'later';
}

/**
 * What the game remembers between sessions: always the furthest point the couple has reached.
 * Looking back at earlier cards is not part of it, so it is never saved.
 */
export interface DeckState {
  /** Every card's id in the order they are drawn. */
  order: string[];
  /** The ids of the cards talked about. */
  seen: string[];
  /** The ids of the cards put off till later, drawn after every other card, first put off first. */
  later: string[];
  /** The cards put away in this round, the latest last, to look back at. */
  history: Step[];
  /** The categories played. */
  categories: CategoryId[];
  mode: Mode;
  /** The id of the card lying face up, so it is face up again when the game is reopened. */
  flipped: string | null;
  /** When a card was last turned, in milliseconds since 1970; null before the first. */
  playedAt: number | null;
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
    later: [],
    history: [],
    categories: [...allCategories],
    mode: 'blandet',
    flipped: null,
    playedAt: null,
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
    later: state.later.filter((id) => ids.has(id)),
    history: state.history.filter((step) => ids.has(step.id)),
    categories: state.categories.filter((id) => allCategories.includes(id)),
  };
}

/**
 * The cards still to be drawn from the chosen categories, next first: those not put off, in
 * the chosen order, then those put off till later.
 */
export function remaining(state: DeckState, cards: readonly QuestionCard[]): QuestionCard[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const seen = new Set(state.seen);
  const later = new Set(state.later);
  const chosen = new Set(state.categories);
  const inPlay = (ids: readonly string[]) =>
    ids
      .map((id) => byId.get(id))
      .filter((card): card is QuestionCard => card !== undefined)
      .filter((card) => chosen.has(card.category) && !seen.has(card.id));
  const now = inPlay(state.order).filter((card) => !later.has(card.id));
  if (state.mode === 'let-til-dyb') now.sort((a, b) => a.level - b.level);
  return [...now, ...inPlay(state.later)];
}

/** The cards put away in this round, latest first, to look back at. */
export function putAway(state: DeckState, cards: readonly QuestionCard[]): QuestionCard[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  return state.history
    .map((step) => byId.get(step.id))
    .filter((card): card is QuestionCard => card !== undefined)
    .reverse();
}

/** How many cards of the chosen categories have been talked about and put off, of how many. */
export function progress(
  state: DeckState,
  cards: readonly QuestionCard[],
): { seen: number; later: number; total: number } {
  const chosen = new Set(state.categories);
  const seen = new Set(state.seen);
  const later = new Set(state.later);
  const inPlay = cards.filter((card) => chosen.has(card.category));
  return {
    seen: inPlay.filter((card) => seen.has(card.id)).length,
    later: inPlay.filter((card) => later.has(card.id) && !seen.has(card.id)).length,
    total: inPlay.length,
  };
}

/** Whether anything has happened since the deck was shuffled. */
export function hasStarted(state: DeckState): boolean {
  return state.seen.length > 0 || state.later.length > 0 || state.flipped !== null;
}

/** Whether a couple has a round going in what is saved under the key, as "Hvem er med?" asks. */
export async function roundGoing(
  read: (key: string) => Promise<unknown>,
  saveKey: string,
): Promise<boolean> {
  const deck = upgradeDeck(await read(saveKey));
  return deck !== undefined && hasStarted(deck);
}

/** The deck with the card turned face up at the given time. */
export function flip(state: DeckState, id: string, now: number): DeckState {
  return { ...state, flipped: id, playedAt: now };
}

/** The deck with the card talked about and put away. */
export function markSeen(state: DeckState, id: string): DeckState {
  return { ...take(state, { id, action: 'seen' }), flipped: null };
}

/** The deck with the card put off till later: it comes back after every other card. */
export function putOff(state: DeckState, id: string): DeckState {
  return { ...take(state, { id, action: 'later' }), flipped: null };
}

function take(state: DeckState, step: Step): DeckState {
  const history = [...state.history, step];
  return step.action === 'seen'
    ? {
        ...state,
        seen: state.seen.includes(step.id) ? state.seen : [...state.seen, step.id],
        history,
      }
    : { ...state, later: [...state.later.filter((id) => id !== step.id), step.id], history };
}

/**
 * The deck with other categories or another order. Looking back starts afresh, as the cards
 * put away before may no longer be in play.
 */
export function choose(
  state: DeckState,
  choice: { categories?: CategoryId[]; mode?: Mode },
): DeckState {
  return { ...state, ...choice, history: [] };
}

/** The deck with nothing seen or put off and a new shuffle, keeping the choices. */
export function restart(
  state: DeckState,
  cards: readonly QuestionCard[],
  random?: Random,
): DeckState {
  return { ...newDeck(cards, random), categories: state.categories, mode: state.mode };
}

/**
 * The deck from a saved value, filling in what an earlier version of the game did not save:
 * the face-up card, the time, the cards put off and the history. One version saved going back
 * as taking cards back, with the way on in `future`; that way is taken again, so the deck is at
 * the furthest point the couple reached. Undefined when the value is no deck at all.
 */
export function upgradeDeck(value: unknown): DeckState | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const saved = value as Partial<Record<keyof DeckState | 'future', unknown>>;
  const { order, seen, categories: chosen, mode } = saved;
  const flipped = saved.flipped ?? null;
  const playedAt = saved.playedAt ?? null;
  const later = saved.later ?? [];
  const history = saved.history ?? [];
  const future = saved.future ?? [];
  if (
    !isStringArray(order) ||
    !isStringArray(seen) ||
    !isStringArray(chosen) ||
    (mode !== 'blandet' && mode !== 'let-til-dyb') ||
    (flipped !== null && typeof flipped !== 'string') ||
    (playedAt !== null && typeof playedAt !== 'number') ||
    !isStringArray(later) ||
    !Array.isArray(history) ||
    !history.every(isStep) ||
    !Array.isArray(future) ||
    !future.every(isRedo)
  ) {
    return undefined;
  }
  const deck: DeckState = {
    order,
    seen,
    later,
    history: history.map(({ id, action }) => ({ id, action })),
    categories: chosen as CategoryId[],
    mode,
    flipped,
    playedAt,
  };
  return [...future]
    .reverse()
    .reduce<DeckState>(
      (state, redo) => ({ ...take(state, redo.step), flipped: redo.flipped }),
      deck,
    );
}

function isStep(value: unknown): value is Step {
  if (typeof value !== 'object' || value === null) return false;
  const step = value as Record<string, unknown>;
  return typeof step.id === 'string' && (step.action === 'seen' || step.action === 'later');
}

/** A step to take again, as one earlier version saved it. */
function isRedo(value: unknown): value is { step: Step; flipped: string | null } {
  if (typeof value !== 'object' || value === null) return false;
  const redo = value as Record<string, unknown>;
  return isStep(redo.step) && (redo.flipped === null || typeof redo.flipped === 'string');
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

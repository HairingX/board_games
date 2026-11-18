import { shuffle, type Random } from '../../lib/random';
import { categories, type CategoryId, type QuestionCard } from './cards';

/** The order cards are drawn in: all shuffled, or light cards before deeper ones. */
export type Mode = 'blandet' | 'let-til-dyb';

/**
 * A card put away, remembered so that "Forrige" can bring it back exactly as it was: talked
 * about, or put off till later from the given place in `later`, or null when it was not there.
 */
export type Step =
  { id: string; action: 'seen' } | { id: string; action: 'later'; from: number | null };

/**
 * A card gone back past with "Forrige", remembered so that going on brings back the same cards
 * without turning them again: the step to take again, and the card that lay face up before.
 */
export interface Redo {
  step: Step;
  flipped: string | null;
}

/** What the game remembers between sessions. */
export interface DeckState {
  /** Every card's id in the order they are drawn. */
  order: string[];
  /** The ids of the cards talked about. */
  seen: string[];
  /** The ids of the cards put off till later, drawn after every other card, first put off first. */
  later: string[];
  /** The cards put away in this round, the latest last. */
  history: Step[];
  /** The cards gone back past, the next to go on to last. */
  future: Redo[];
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
    future: [],
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
    future: state.future.filter((redo) => ids.has(redo.step.id)),
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

/** The deck with the card turned face up at the given time. */
export function flip(state: DeckState, id: string, now: number): DeckState {
  return { ...state, flipped: id, playedAt: now };
}

/**
 * The deck with the card talked about and put away. Going on through cards gone back past, the
 * card after it comes back as it lay, face up if it was.
 */
export function markSeen(state: DeckState, id: string): DeckState {
  return goOn(state, { id, action: 'seen' });
}

/**
 * The deck with the card put off till later: it comes back after every other card. Going on
 * through cards gone back past, the card after it comes back as it lay.
 */
export function putOff(state: DeckState, id: string): DeckState {
  const from = state.later.indexOf(id);
  return goOn(state, { id, action: 'later', from: from === -1 ? null : from });
}

/**
 * The deck with the step taken. When it is the step gone back past last, the card after it
 * lies as it did then, and the way on is kept; any other step starts a new way on.
 */
function goOn(state: DeckState, step: Step): DeckState {
  const redo = state.future.at(-1);
  const again = redo?.step.id === step.id && redo.step.action === step.action;
  return {
    ...take(state, step),
    flipped: again ? redo.flipped : null,
    future: again ? state.future.slice(0, -1) : [],
  };
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
 * The deck with the latest card put away brought back on top, face up, as it was. Going on
 * afterwards brings back the same cards again.
 */
export function previous(state: DeckState): DeckState {
  const step = state.history.at(-1);
  if (!step) return state;
  const back = {
    history: state.history.slice(0, -1),
    future: [...state.future, { step, flipped: state.flipped }],
    flipped: step.id,
  };
  if (step.action === 'seen') {
    return { ...state, ...back, seen: state.seen.filter((id) => id !== step.id) };
  }
  const later = state.later.filter((id) => id !== step.id);
  if (step.from !== null) later.splice(step.from, 0, step.id);
  return { ...state, ...back, later };
}

/**
 * The deck with other categories or another order. "Forrige" starts afresh, as the cards put
 * away before may no longer be in play.
 */
export function choose(
  state: DeckState,
  choice: { categories?: CategoryId[]; mode?: Mode },
): DeckState {
  return { ...state, ...choice, history: [], future: [] };
}

/** The deck with nothing seen or put off and a new shuffle, keeping the choices. */
export function restart(
  state: DeckState,
  cards: readonly QuestionCard[],
  random?: Random,
): DeckState {
  return { ...newDeck(cards, random), categories: state.categories, mode: state.mode };
}

/** Whether a stored value has the shape of a deck. */
export function isDeckState(value: unknown): value is DeckState {
  return upgradeDeck(value) === value;
}

/**
 * The deck from a saved value, filling in what an earlier version of the game did not save:
 * the face-up card, the time, the cards put off, and the ways back and on. Undefined when the value is
 * no deck at all.
 */
export function upgradeDeck(value: unknown): DeckState | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const saved = value as Partial<Record<keyof DeckState, unknown>>;
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
  const complete =
    'flipped' in saved &&
    'playedAt' in saved &&
    'later' in saved &&
    'history' in saved &&
    'future' in saved;
  return complete
    ? (value as DeckState)
    : {
        order,
        seen,
        later,
        history,
        future,
        categories: chosen as CategoryId[],
        mode,
        flipped,
        playedAt,
      };
}

function isStep(value: unknown): value is Step {
  if (typeof value !== 'object' || value === null) return false;
  const step = value as Record<string, unknown>;
  if (typeof step.id !== 'string') return false;
  if (step.action === 'seen') return true;
  return step.action === 'later' && (step.from === null || typeof step.from === 'number');
}

function isRedo(value: unknown): value is Redo {
  if (typeof value !== 'object' || value === null) return false;
  const redo = value as Record<string, unknown>;
  return isStep(redo.step) && (redo.flipped === null || typeof redo.flipped === 'string');
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

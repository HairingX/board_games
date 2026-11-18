import { describe, expect, it } from 'vitest';
import type { QuestionCard } from './cards';
import {
  choose,
  flip,
  hasStarted,
  isDeckState,
  markSeen,
  newDeck,
  previous,
  progress,
  putOff,
  reconcile,
  remaining,
  restart,
  upgradeDeck,
  type DeckState,
} from './deck';

const keepOrder = () => 0.999;

const testCards: QuestionCard[] = [
  { id: 'a', category: 'os-to', level: 3, text: 'A?' },
  { id: 'b', category: 'os-to', level: 1, text: 'B?' },
  { id: 'c', category: 'minder', level: 2, text: 'C?' },
  { id: 'd', category: 'for-sjov', level: 1, text: 'D?' },
];

function deck(overrides: Partial<DeckState> = {}): DeckState {
  return { ...newDeck(testCards, keepOrder), ...overrides };
}

/** The deck as the first version saved it, without what later versions added. */
function firstVersion(state: DeckState): Partial<DeckState> {
  const copy: Partial<DeckState> = { ...state };
  delete copy.flipped;
  delete copy.playedAt;
  delete copy.later;
  delete copy.history;
  delete copy.future;
  return copy;
}

const ids = (cards: QuestionCard[]) => cards.map((card) => card.id);
const next = (state: DeckState) => remaining(state, testCards)[0]?.id;

describe('newDeck', () => {
  it('holds every card, every category, nothing seen, shuffled', () => {
    const state = newDeck(testCards, keepOrder);
    expect(state.order).toEqual(['a', 'b', 'c', 'd']);
    expect(state.seen).toEqual([]);
    expect(state.later).toEqual([]);
    expect(state.history).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.categories).toHaveLength(8);
    expect(state.mode).toBe('blandet');
    expect(hasStarted(state)).toBe(false);
  });
});

describe('remaining', () => {
  it('follows the order, leaving out seen cards and other categories', () => {
    const state = deck({ seen: ['b'], categories: ['os-to', 'for-sjov'] });
    expect(ids(remaining(state, testCards))).toEqual(['a', 'd']);
  });

  it('puts lighter cards first from light to deep, keeping the order within a level', () => {
    expect(ids(remaining(deck({ mode: 'let-til-dyb' }), testCards))).toEqual(['b', 'd', 'c', 'a']);
  });

  it('puts the cards put off after every other card, even from light to deep', () => {
    const state = deck({ mode: 'let-til-dyb', later: ['d', 'b'] });
    expect(ids(remaining(state, testCards))).toEqual(['c', 'a', 'd', 'b']);
  });

  it('leaves out a card put off and then talked about', () => {
    expect(ids(remaining(deck({ later: ['a'], seen: ['a'] }), testCards))).toEqual(['b', 'c', 'd']);
  });

  it('ignores ids that have no card', () => {
    expect(ids(remaining(deck({ order: ['gone', 'a'], later: ['gone'] }), testCards))).toEqual([
      'a',
    ]);
  });
});

describe('progress', () => {
  it('counts the cards talked about and put off in the chosen categories', () => {
    const state = deck({ seen: ['a', 'c'], later: ['b', 'c', 'd'], categories: ['os-to'] });
    expect(progress(state, testCards)).toEqual({ seen: 1, later: 1, total: 2 });
  });
});

describe('a round of play', () => {
  it('turns a card face up and remembers when', () => {
    const state = flip(deck(), 'a', 1234);
    expect(state).toMatchObject({ flipped: 'a', playedAt: 1234 });
    expect(hasStarted(state)).toBe(true);
  });

  it('puts a card talked about away, and brings it back face up with previous', () => {
    const before = flip(deck(), 'a', 1);
    const after = markSeen(before, 'a');
    expect(after.seen).toEqual(['a']);
    expect(after.flipped).toBeNull();
    expect(next(after)).toBe('b');

    const back = previous(after);
    expect(back.seen).toEqual([]);
    expect(back.flipped).toBe('a');
    expect(back.history).toEqual([]);
    expect(next(back)).toBe('a');
  });

  it('does not count a card twice', () => {
    expect(markSeen(markSeen(deck(), 'a'), 'a').seen).toEqual(['a']);
  });

  it('puts a card off till the bottom, and brings it back on top with previous', () => {
    const after = putOff(flip(deck(), 'a', 1), 'a');
    expect(after.later).toEqual(['a']);
    expect(after.flipped).toBeNull();
    expect(hasStarted(after)).toBe(true);
    expect(ids(remaining(after, testCards))).toEqual(['b', 'c', 'd', 'a']);

    const back = previous(after);
    expect(back.later).toEqual([]);
    expect(back.flipped).toBe('a');
    expect(next(back)).toBe('a');
  });

  it('puts a card off again behind the others, and back in its old place with previous', () => {
    const after = putOff(deck({ seen: ['a', 'b'], later: ['c', 'd'] }), 'c');
    expect(after.later).toEqual(['d', 'c']);
    expect(previous(after).later).toEqual(['c', 'd']);
  });

  it('steps back through several cards, latest first', () => {
    let state = deck();
    state = markSeen(state, 'a');
    state = putOff(state, 'b');
    state = markSeen(state, 'c');
    state = previous(state);
    expect(state.flipped).toBe('c');
    state = previous(state);
    expect(state.flipped).toBe('b');
    expect(state.later).toEqual([]);
    state = previous(state);
    expect(state.flipped).toBe('a');
    expect(state.seen).toEqual([]);
  });

  it('goes on again through cards gone back past, as they lay, without turning them', () => {
    let state = flip(deck(), 'a', 1);
    state = markSeen(state, 'a');
    state = flip(state, 'b', 2);
    state = putOff(state, 'b');
    state = flip(state, 'c', 3);
    const where = state;

    state = previous(previous(state));
    expect(state.flipped).toBe('a');
    expect(state.future).toHaveLength(2);

    state = markSeen(state, 'a');
    expect(state.flipped).toBe('b');
    state = putOff(state, 'b');
    expect(state).toEqual(where);
  });

  it('comes back face down to a card that lay face down', () => {
    const back = previous(markSeen(deck(), 'a'));
    const on = markSeen(back, 'a');
    expect(on.flipped).toBeNull();
    expect(on.future).toEqual([]);
  });

  it('starts a new way on when a card gone back to is put away differently', () => {
    let state = markSeen(markSeen(deck(), 'a'), 'b');
    state = previous(previous(state));
    state = putOff(state, 'a');
    expect(state.future).toEqual([]);
    expect(state.flipped).toBeNull();
    expect(next(state)).toBe('b');
  });

  it('stays as it is when there is nothing to go back to', () => {
    const state = deck();
    expect(previous(state)).toBe(state);
  });
});

describe('choose', () => {
  it('changes the categories or order and forgets the way back', () => {
    const state = choose(markSeen(deck(), 'a'), { categories: ['minder'], mode: 'let-til-dyb' });
    expect(state.categories).toEqual(['minder']);
    expect(state.mode).toBe('let-til-dyb');
    expect(state.history).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.seen).toEqual(['a']);
  });
});

describe('restart', () => {
  it('forgets what was seen and put off, and keeps the choices', () => {
    const state = restart(
      deck({ seen: ['a'], later: ['b'], categories: ['minder'], mode: 'let-til-dyb' }),
      testCards,
      keepOrder,
    );
    expect(state.seen).toEqual([]);
    expect(state.later).toEqual([]);
    expect(state.categories).toEqual(['minder']);
    expect(state.mode).toBe('let-til-dyb');
  });
});

describe('reconcile', () => {
  it('drops cards that are gone and adds new ones after the known order', () => {
    const saved = deck({
      order: ['c', 'gone', 'a'],
      seen: ['gone', 'a'],
      later: ['gone', 'c'],
      history: [
        { id: 'gone', action: 'seen' },
        { id: 'a', action: 'seen' },
      ],
      future: [
        { step: { id: 'gone', action: 'seen' }, flipped: null },
        { step: { id: 'c', action: 'seen' }, flipped: 'b' },
      ],
      categories: ['minder', 'old' as 'minder'],
    });
    const state = reconcile(saved, testCards, keepOrder);
    expect(state.order).toEqual(['c', 'a', 'b', 'd']);
    expect(state.seen).toEqual(['a']);
    expect(state.later).toEqual(['c']);
    expect(state.history).toEqual([{ id: 'a', action: 'seen' }]);
    expect(state.future).toEqual([{ step: { id: 'c', action: 'seen' }, flipped: 'b' }]);
    expect(state.categories).toEqual(['minder']);
  });
});

describe('upgradeDeck and isDeckState', () => {
  it('keeps a current deck as it is', () => {
    const current = deck({
      flipped: 'a',
      playedAt: 5,
      later: ['b'],
      history: [{ id: 'b', action: 'later', from: null }],
    });
    expect(upgradeDeck(current)).toBe(current);
    expect(isDeckState(current)).toBe(true);
  });

  it('brings a deck from the first version up to date', () => {
    const old = firstVersion(deck({ seen: ['a'] }));
    expect(isDeckState(old)).toBe(false);
    expect(upgradeDeck(old)).toEqual({
      ...old,
      flipped: null,
      playedAt: null,
      later: [],
      history: [],
      future: [],
    });
  });

  it.each([
    null,
    'text',
    {},
    { ...newDeck(testCards), order: [1] },
    { ...newDeck(testCards), seen: 'a' },
    { ...newDeck(testCards), categories: undefined },
    { ...newDeck(testCards), mode: 'other' },
    { ...newDeck(testCards), flipped: 1 },
    { ...newDeck(testCards), playedAt: '2026' },
    { ...newDeck(testCards), later: [2] },
    { ...newDeck(testCards), history: 'a' },
    { ...newDeck(testCards), history: [null] },
    { ...newDeck(testCards), history: [{ id: 1, action: 'seen' }] },
    { ...newDeck(testCards), history: [{ id: 'a', action: 'gone' }] },
    { ...newDeck(testCards), history: [{ id: 'a', action: 'later', from: 'x' }] },
    { ...newDeck(testCards), future: {} },
    { ...newDeck(testCards), future: [null] },
    { ...newDeck(testCards), future: [{ step: null, flipped: null }] },
    { ...newDeck(testCards), future: [{ step: { id: 'a', action: 'seen' }, flipped: 1 }] },
  ])('refuses %j', (value) => {
    expect(upgradeDeck(value)).toBeUndefined();
    expect(isDeckState(value)).toBe(false);
  });

  it('accepts every kind of step', () => {
    const state = deck({
      history: [
        { id: 'a', action: 'seen' },
        { id: 'b', action: 'later', from: null },
        { id: 'c', action: 'later', from: 0 },
      ],
      future: [
        { step: { id: 'd', action: 'seen' }, flipped: null },
        { step: { id: 'b', action: 'later', from: null }, flipped: 'd' },
      ],
    });
    expect(isDeckState(state)).toBe(true);
  });
});

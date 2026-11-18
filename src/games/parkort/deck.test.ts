import { describe, expect, it } from 'vitest';
import type { QuestionCard } from './cards';
import {
  choose,
  flip,
  hasStarted,
  markSeen,
  newDeck,
  progress,
  putAway,
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

  it('puts a card talked about away and goes on to the next, face down', () => {
    const after = markSeen(flip(deck(), 'a', 1), 'a');
    expect(after.seen).toEqual(['a']);
    expect(after.flipped).toBeNull();
    expect(after.history).toEqual([{ id: 'a', action: 'seen' }]);
    expect(next(after)).toBe('b');
  });

  it('does not count a card twice', () => {
    expect(markSeen(markSeen(deck(), 'a'), 'a').seen).toEqual(['a']);
  });

  it('puts a card off till the bottom, again behind the others when put off again', () => {
    const after = putOff(flip(deck(), 'a', 1), 'a');
    expect(after.later).toEqual(['a']);
    expect(after.flipped).toBeNull();
    expect(hasStarted(after)).toBe(true);
    expect(ids(remaining(after, testCards))).toEqual(['b', 'c', 'd', 'a']);
    expect(putOff(deck({ seen: ['a', 'b'], later: ['c', 'd'] }), 'c').later).toEqual(['d', 'c']);
  });

  it('lists the cards put away, latest first, to look back at', () => {
    const state = markSeen(putOff(markSeen(deck(), 'a'), 'b'), 'c');
    expect(ids(putAway(state, testCards))).toEqual(['c', 'b', 'a']);
    expect(
      ids(putAway({ ...state, history: [{ id: 'gone', action: 'seen' }] }, testCards)),
    ).toEqual([]);
  });
});

describe('choose', () => {
  it('changes the categories or order and starts looking back afresh', () => {
    const state = choose(markSeen(deck(), 'a'), { categories: ['minder'], mode: 'let-til-dyb' });
    expect(state.categories).toEqual(['minder']);
    expect(state.mode).toBe('let-til-dyb');
    expect(state.history).toEqual([]);
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
      categories: ['minder', 'old' as 'minder'],
    });
    const state = reconcile(saved, testCards, keepOrder);
    expect(state.order).toEqual(['c', 'a', 'b', 'd']);
    expect(state.seen).toEqual(['a']);
    expect(state.later).toEqual(['c']);
    expect(state.history).toEqual([{ id: 'a', action: 'seen' }]);
    expect(state.categories).toEqual(['minder']);
  });
});

describe('upgradeDeck', () => {
  it('keeps a current deck as it was', () => {
    const current = deck({
      flipped: 'a',
      playedAt: 5,
      later: ['b'],
      history: [
        { id: 'b', action: 'later' },
        { id: 'c', action: 'seen' },
      ],
    });
    expect(upgradeDeck(current)).toEqual(current);
  });

  it('brings a deck from the first version up to date', () => {
    const old = firstVersion(deck({ seen: ['a'] }));
    expect(upgradeDeck(old)).toEqual({
      ...old,
      flipped: null,
      playedAt: null,
      later: [],
      history: [],
    });
  });

  it('drops what an earlier version kept in a step to take it back', () => {
    const saved = { ...deck(), history: [{ id: 'a', action: 'later', from: 0 }] };
    expect(upgradeDeck(saved)?.history).toEqual([{ id: 'a', action: 'later' }]);
  });

  it('takes again the cards an earlier version had taken back, to the furthest point', () => {
    const saved = {
      ...deck({ flipped: 'a', history: [] }),
      future: [
        { step: { id: 'c', action: 'seen' }, flipped: 'd' },
        { step: { id: 'b', action: 'later', from: null }, flipped: 'c' },
        { step: { id: 'a', action: 'seen' }, flipped: 'b' },
      ],
    };
    const state = upgradeDeck(saved);
    expect(state).toMatchObject({ seen: ['a', 'c'], later: ['b'], flipped: 'd' });
    expect(state?.history.map((step) => step.id)).toEqual(['a', 'b', 'c']);
    expect(state && 'future' in state).toBe(false);
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
    { ...newDeck(testCards), future: {} },
    { ...newDeck(testCards), future: [null] },
    { ...newDeck(testCards), future: [{ step: null, flipped: null }] },
    { ...newDeck(testCards), future: [{ step: { id: 'a', action: 'seen' }, flipped: 1 }] },
  ])('refuses %j', (value) => {
    expect(upgradeDeck(value)).toBeUndefined();
  });
});

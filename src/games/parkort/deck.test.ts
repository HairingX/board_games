import { describe, expect, it } from 'vitest';
import type { QuestionCard } from './cards';
import {
  isDeckState,
  markSeen,
  newDeck,
  progress,
  reconcile,
  remaining,
  restart,
  skip,
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

const ids = (cards: QuestionCard[]) => cards.map((card) => card.id);

describe('newDeck', () => {
  it('holds every card, every category, nothing seen, shuffled', () => {
    const state = newDeck(testCards, keepOrder);
    expect(state.order).toEqual(['a', 'b', 'c', 'd']);
    expect(state.seen).toEqual([]);
    expect(state.categories).toHaveLength(8);
    expect(state.mode).toBe('blandet');
  });
});

describe('remaining', () => {
  it('follows the order, leaving out seen cards and other categories', () => {
    const state = deck({ seen: ['b'], categories: ['os-to', 'for-sjov'] });
    expect(ids(remaining(state, testCards))).toEqual(['a', 'd']);
  });

  it('puts lighter cards first from light to deep, keeping the order within a level', () => {
    const state = deck({ mode: 'let-til-dyb' });
    expect(ids(remaining(state, testCards))).toEqual(['b', 'd', 'c', 'a']);
  });

  it('ignores ids in the order that have no card', () => {
    const state = deck({ order: ['gone', 'a'] });
    expect(ids(remaining(state, testCards))).toEqual(['a']);
  });
});

describe('progress', () => {
  it('counts the seen cards of the chosen categories', () => {
    const state = deck({ seen: ['a', 'c'], categories: ['os-to'] });
    expect(progress(state, testCards)).toEqual({ seen: 1, total: 2 });
  });
});

describe('markSeen and skip', () => {
  it('marks a card seen once', () => {
    const once = markSeen(deck(), 'a');
    expect(once.seen).toEqual(['a']);
    expect(markSeen(once, 'a')).toBe(once);
  });

  it('moves a skipped card to the bottom', () => {
    expect(skip(deck(), 'a').order).toEqual(['b', 'c', 'd', 'a']);
  });
});

describe('restart', () => {
  it('forgets what was seen and keeps the choices', () => {
    const state = restart(
      deck({ seen: ['a'], categories: ['minder'], mode: 'let-til-dyb' }),
      testCards,
      keepOrder,
    );
    expect(state.seen).toEqual([]);
    expect(state.categories).toEqual(['minder']);
    expect(state.mode).toBe('let-til-dyb');
  });
});

describe('reconcile', () => {
  it('drops cards that are gone and adds new ones after the known order', () => {
    const saved = deck({
      order: ['c', 'gone', 'a'],
      seen: ['gone', 'a'],
      categories: ['minder', 'old' as 'minder'],
    });
    const state = reconcile(saved, testCards, keepOrder);
    expect(state.order).toEqual(['c', 'a', 'b', 'd']);
    expect(state.seen).toEqual(['a']);
    expect(state.categories).toEqual(['minder']);
  });
});

describe('isDeckState', () => {
  it('accepts a deck', () => {
    expect(isDeckState(deck())).toBe(true);
    expect(isDeckState(deck({ mode: 'let-til-dyb' }))).toBe(true);
  });

  it.each([
    null,
    'text',
    {},
    { ...newDeck(testCards), order: [1] },
    { ...newDeck(testCards), seen: 'a' },
    { ...newDeck(testCards), categories: undefined },
    { ...newDeck(testCards), mode: 'other' },
  ])('refuses %j', (value) => {
    expect(isDeckState(value)).toBe(false);
  });
});

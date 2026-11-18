import { describe, expect, it } from 'vitest';
import { cards, categories, categoryById } from './cards';

describe('cards', () => {
  it('has 200 cards, 25 in each category', () => {
    expect(cards).toHaveLength(200);
    for (const category of categories) {
      expect(cards.filter((card) => card.category === category.id)).toHaveLength(25);
    }
  });

  it('gives every card its own id', () => {
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
  });

  it('has light, medium and deep cards in every category but the playful one', () => {
    for (const category of categories.filter((c) => c.id !== 'for-sjov')) {
      const levels = new Set(cards.filter((c) => c.category === category.id).map((c) => c.level));
      expect([...levels].sort()).toEqual([1, 2, 3]);
    }
  });

  it('writes every card as one question or request that ends properly', () => {
    for (const card of cards) {
      expect(card.text).toMatch(/[?.«]$/);
      expect(card.text).not.toMatch(/\s{2}/);
    }
  });

  it('finds each category by its id', () => {
    for (const category of categories) {
      expect(categoryById[category.id]).toBe(category);
    }
  });
});

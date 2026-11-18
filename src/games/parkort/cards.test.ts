import { describe, expect, it } from 'vitest';
import { cards, categories, categoryById, retired } from './cards';

describe('cards', () => {
  it('has at least 25 cards in each category', () => {
    for (const category of categories) {
      expect(cards.filter((card) => card.category === category.id).length).toBeGreaterThanOrEqual(
        25,
      );
    }
  });

  it('never uses the number of a card taken out again', () => {
    for (const category of categories) {
      for (const number of retired[category.id]) {
        expect(cards.map((card) => card.id)).not.toContain(`${category.id}-${String(number)}`);
      }
    }
  });

  it('gives every card its own id', () => {
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
  });

  it('has light, medium and deep cards in every category', () => {
    for (const category of categories) {
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

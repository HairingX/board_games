import { describe, expect, it } from 'vitest';
import { seeded } from '../../lib/random';
import { monsterName } from './names';
import { text } from './text';

describe('a monster’s name', () => {
  it('is the same for the same seed, and made from the pools', () => {
    const name = monsterName(text.da.names.slime, 42);
    expect(monsterName(text.da.names.slime, 42)).toBe(name);
    const [first, second] = name.split(' ');
    expect(text.da.names.slime.describe).toContain(first);
    expect(text.da.names.slime.name).toContain(second);
  });

  it('mostly begins its two parts with the same letter, as children like', () => {
    const names = Array.from({ length: 200 }, (_, seed) => monsterName(text.en.names.slime, seed));
    const rhyming = names.filter((name) => {
      const [first, second] = name.split(' ');
      return first?.charAt(0) === second?.charAt(0);
    });
    expect(rhyming.length).toBeGreaterThan(100);
    expect(rhyming.length).toBeLessThan(200);
    expect(new Set(names).size).toBeGreaterThan(20);
  });

  it('takes any second part when none rhymes', () => {
    const name = monsterName({ describe: ['Zany'], name: ['Bob'] }, 1);
    expect(name).toBe('Zany Bob');
  });
});

describe('a seeded random source', () => {
  it('gives the same numbers for the same seed, between 0 and 1', () => {
    const one = seeded(5);
    const two = seeded(5);
    const drawn = Array.from({ length: 50 }, () => one());
    expect(Array.from({ length: 50 }, () => two())).toEqual(drawn);
    expect(drawn.every((number) => number >= 0 && number < 1)).toBe(true);
    expect(seeded(6)()).not.toBe(drawn[0]);
  });
});

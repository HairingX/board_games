import { describe, expect, it } from 'vitest';
import { levels } from './levels';
import { freshFor, freshTask, judge, makeTask, sumKey, type Token } from './tasks';
import { numeric, valueKey, type Value } from './values';

/** A source of random numbers that repeats, so tasks can be checked by the thousand. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

/**
 * Works a sum out on its own, the way a calculator does: brackets, roots and powers first, then
 * ×, ÷ and "of", then + and −, each from left to right.
 */
function work(sum: readonly Token[]): number {
  let at = 0;
  const next = () => sum[at];
  function value(): number {
    const token = sum[at++];
    let result: number;
    if (token === '(') {
      result = terms();
      at++;
    } else if (token === '√') {
      result = Math.sqrt(value());
    } else if (typeof token === 'object' && 'percent' in token) {
      result = token.percent / 100;
    } else {
      result = numeric(token as Value);
    }
    const after = next();
    if (typeof after === 'object' && 'power' in after) {
      at++;
      return result ** after.power;
    }
    return result;
  }
  function factors(): number {
    let result = value();
    while (next() === '×' || next() === '÷' || next() === 'of') {
      const operator = sum[at++];
      const right = value();
      result = operator === '÷' ? result / right : result * right;
    }
    return result;
  }
  function terms(): number {
    let result = factors();
    while (next() === '+' || next() === '−') {
      const operator = sum[at++];
      const right = factors();
      result = operator === '+' ? result + right : result - right;
    }
    return result;
  }
  return terms();
}

const numbers = (sum: readonly Token[]) =>
  sum.filter((token): token is number => typeof token === 'number');

/** The levels before decimals, fractions and negative numbers. */
const basic = levels.filter((level) => level <= 8);

describe('makeTask', () => {
  it.each(levels)('makes right sums at level %i, with three distinct answers', (level) => {
    const random = seeded(level);
    for (let i = 0; i < 2000; i++) {
      const task = makeTask(level, random);
      expect(work(task.sum)).toBeCloseTo(numeric(task.answer), 9);
      expect(task.choices).toHaveLength(3);
      expect(new Set(task.choices.map(valueKey)).size).toBe(3);
      expect(task.choices).toContainEqual(task.answer);
      expect(task.near).toBeGreaterThan(0);
    }
  });

  it.each(basic)('keeps to whole numbers, never below zero, at level %i', (level) => {
    const random = seeded(level + 50);
    for (let i = 0; i < 2000; i++) {
      const task = makeTask(level, random);
      expect(task.choices.every((choice) => Number.isInteger(choice) && numeric(choice) >= 0)).toBe(
        true,
      );
    }
  });

  it('offers answers below zero only once negative numbers are taught', () => {
    for (const level of levels) {
      const random = seeded(level + 200);
      const below = Array.from({ length: 500 }, () => makeTask(level, random)).some((task) =>
        task.choices.some((choice) => numeric(choice) < 0),
      );
      expect(below).toBe([10, 11, 12, 15].includes(level));
    }
  });

  const most: Readonly<Record<number, number>> = {
    1: 10,
    2: 20,
    3: 20,
    4: 100,
    5: 1000,
    6: 1000,
    7: 9900,
    8: 200,
  };

  it.each(basic)('keeps the answers at level %i within its numbers', (level) => {
    const random = seeded(level + 100);
    for (let i = 0; i < 2000; i++) {
      const { sum, answer } = makeTask(level, random);
      expect(answer).toBeLessThanOrEqual(most[level] ?? 0);
      expect(Math.max(...numbers(sum))).toBeLessThanOrEqual(most[level] ?? 0);
    }
  });

  it('crosses ten at level 3, and never at level 2 outside doubles and tens', () => {
    const random = seeded(3);
    for (let i = 0; i < 500; i++) {
      const { sum } = makeTask(3, random);
      const [a = 0, operator, b = 0] = sum;
      const crosses =
        operator === '+'
          ? (a as number) + (b as number) > 10
          : (a as number) > 10 && (a as number) - (b as number) < 10;
      expect(crosses).toBe(true);
    }
  });

  it('offers the typical mistakes: a neighbour in the table, and left to right', () => {
    const random = () => 0;
    const table = makeTask(6, random);
    expect(table.sum).toEqual([2, '×', 2]);
    expect([...table.choices].sort()).toEqual([2, 4, 6]);
    const order = makeTask(8, random);
    expect(order.sum).toEqual([2, '+', 2, '×', 2]);
    expect(order.choices).toContain(8);
  });

  it('takes the smaller digit from the larger as a mistake in subtraction', () => {
    let calls = 0;
    // Level 4's subtraction, 52 − 17, then the answers in the order made.
    const values = [0.5, 31 / 79, 15 / 41, 0, 0, 0];
    const random = () => values[calls++] ?? 0;
    const task = makeTask(4, random);
    expect(task.sum).toEqual([52, '−', 17]);
    expect(task.choices).toContain(45);
  });
});

describe('makeTask, over and over', () => {
  it.each(levels)('never repeats a sum shown lately at level %i', (level) => {
    const random = seeded(level + 300);
    let recent: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const task = makeTask(level, random, recent);
      const key = sumKey(task.sum);
      expect(recent.slice(-freshFor)).not.toContain(key);
      recent = [...recent, key].slice(-freshFor);
    }
  });

  it('gives up drawing anew with a random source that never changes, rather than hang', () => {
    const task = makeTask(1, () => 0);
    expect(makeTask(1, () => 0, [sumKey(task.sum)]).sum).toEqual(task.sum);
  });

  it('may repeat a sum shown a while ago, but never the last, where the lately ones run out', () => {
    const one = makeTask(1, () => 0);
    const other = makeTask(2, () => 0);
    let draws = 0;
    // Only two sums can be drawn, both shown lately: the one shown last is drawn first.
    const draw = () => (draws++ % 2 === 0 ? one : other);
    const recent = [sumKey(other.sum), sumKey(one.sum)];
    expect(freshTask(draw, recent)).toBe(other);
  });
});

describe('judge', () => {
  it('calls the right answer right, a near one close, and the rest far off', () => {
    expect(judge(12, 12, 2)).toBe('right');
    expect(judge(13, 12, 2)).toBe('close');
    expect(judge(10, 12, 2)).toBe('close');
    expect(judge(22, 12, 2)).toBe('far');
    expect(judge(90, 100, 10)).toBe('close');
    expect(judge(85, 100, 10)).toBe('far');
  });

  it('judges fractions by their value', () => {
    expect(judge({ n: 1, d: 2 }, { n: 1, d: 2 }, 0.1)).toBe('right');
    expect(judge(0.5, { n: 1, d: 2 }, 0.1)).toBe('right');
    expect(judge({ n: 2, d: 5 }, { n: 1, d: 2 }, 0.1)).toBe('close');
    expect(judge({ n: 1, d: 5 }, { n: 1, d: 2 }, 0.1)).toBe('far');
  });
});

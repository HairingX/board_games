import { describe, expect, it } from 'vitest';
import { beside, fraction, isFraction, numeric, same, tidy, valueKey } from './values';

describe('values', () => {
  it('keeps fractions in lowest terms, the sign on top, whole ones as numbers', () => {
    expect(fraction(2, 4)).toEqual({ n: 1, d: 2 });
    expect(fraction(3, -6)).toEqual({ n: -1, d: 2 });
    expect(fraction(6, 3)).toBe(2);
    expect(isFraction(fraction(1, 3))).toBe(true);
    expect(isFraction(4)).toBe(false);
  });

  it('compares answers by value, fractions and decimals alike', () => {
    expect(same(fraction(1, 2), 0.5)).toBe(true);
    expect(same(0.1 + 0.2, 0.3)).toBe(true);
    expect(same(fraction(1, 3), fraction(1, 2))).toBe(false);
    expect(numeric(fraction(3, 4))).toBe(0.75);
    expect(tidy(0.1 + 0.2)).toBe(0.3);
  });

  it('steps beside a value, and keys it', () => {
    expect(beside(2.5, 0.1)).toBe(2.6);
    expect(beside(fraction(1, 4), 1)).toEqual({ n: 1, d: 2 });
    expect(valueKey(fraction(3, 4))).toBe('3/4');
    expect(valueKey(0.1 + 0.2)).toBe('0.3');
  });
});

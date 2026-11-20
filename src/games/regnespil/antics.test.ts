import { describe, expect, it } from 'vitest';
import { evasionFor, evasions, teaseFor, teases } from './antics';

describe('the slime’s antics', () => {
  it('gets out of the way in every way, the same for the same fight and turn', () => {
    const seen = new Set(Array.from({ length: 60 }, (_, round) => evasionFor(9, round)));
    expect([...seen].sort()).toEqual([...evasions].sort());
    expect(evasionFor(9, 4)).toBe(evasionFor(9, 4));
  });

  it('teases now and then, in every way, never two turns running', () => {
    const drawn = Array.from({ length: 80 }, (_, round) => teaseFor(3, round));
    const teased = drawn.filter((tease) => tease !== undefined);
    expect(teased.length).toBeGreaterThan(10);
    expect(teased.length).toBeLessThan(50);
    expect(new Set(teased)).toEqual(new Set(teases));
    expect(drawn.slice(0, 2)).toEqual([undefined, undefined]);
    drawn.forEach((tease, round) => {
      if (tease !== undefined) expect(drawn[round + 1]).toBeUndefined();
    });
  });
});

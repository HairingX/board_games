import { describe, expect, it } from 'vitest';
import { evasionFor, strikeFor, teaseFor } from './antics';
import { slime } from './monsters';

describe('a monster’s antics', () => {
  it('strikes back and gets out of the way in every way it has, the same for the same turn', () => {
    const rounds = Array.from({ length: 60 }, (_, round) => round);
    const evaded = new Set(rounds.map((round) => evasionFor(9, round, slime.evasions)));
    expect([...evaded].sort()).toEqual([...slime.evasions].sort());
    const struck = new Set(rounds.map((round) => strikeFor(9, round, slime.strikes)));
    expect([...struck].sort()).toEqual([...slime.strikes].sort());
    expect(evasionFor(9, 4, slime.evasions)).toBe(evasionFor(9, 4, slime.evasions));
  });

  it('teases now and then, in every way, never two turns running nor in the first sums', () => {
    const drawn = Array.from({ length: 120 }, (_, round) => teaseFor(3, round, slime.teases));
    const teased = drawn.filter((tease) => tease !== undefined);
    expect(teased.length).toBeGreaterThan(15);
    expect(teased.length).toBeLessThan(70);
    expect(new Set(teased)).toEqual(new Set(slime.teases));
    expect(drawn.slice(0, 2)).toEqual([undefined, undefined]);
    drawn.forEach((tease, round) => {
      if (tease !== undefined) expect(drawn[round + 1]).toBeUndefined();
    });
  });
});

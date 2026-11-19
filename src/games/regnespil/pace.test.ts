import { describe, expect, it } from 'vitest';
import { approach, approachSeconds, withTime } from './pace';

describe('the monster’s walk', () => {
  it('takes at least a quarter of a minute, and longer for a player who thinks long', () => {
    expect(approachSeconds()).toBe(approach.least);
    expect(approachSeconds([2, 3, 4])).toBe(approach.least);
    expect(approachSeconds([30, 6, 8])).toBe(8 * approach.times);
  });

  it('keeps only a player’s latest times', () => {
    let times: readonly number[] = [];
    for (let seconds = 1; seconds <= approach.kept + 2; seconds++) times = withTime(times, seconds);
    expect(times).toEqual([3, 4, 5, 6, 7]);
    expect(withTime(undefined, 4)).toEqual([4]);
  });
});

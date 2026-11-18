import { describe, expect, it } from 'vitest';
import { timeAgo } from './time';

const minute = 60 * 1000;
const day = 24 * 60 * minute;
const now = Date.UTC(2026, 10, 18, 12);

describe('timeAgo', () => {
  it.each([
    [0, 'lige nu'],
    [-5000, 'lige nu'],
    [30 * 1000, 'lige nu'],
    [5 * minute, 'for 5 minutter siden'],
    [3 * 60 * minute, 'for 3 timer siden'],
    [day, 'i går'],
    [4 * day, 'for 4 dage siden'],
    [65 * day, 'for 2 måneder siden'],
    [800 * day, 'for 2 år siden'],
  ])('describes %d ms ago as %j', (ago, text) => {
    expect(timeAgo(now - ago, now)).toBe(text);
  });
});

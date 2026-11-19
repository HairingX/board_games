import { describe, expect, it } from 'vitest';
import { nextTurn } from './turns';

describe('nextTurn', () => {
  it('passes the turn round the table, and back to the first', () => {
    expect(nextTurn(0, 3)).toBe(1);
    expect(nextTurn(2, 3)).toBe(0);
    expect(nextTurn(0, 1)).toBe(0);
  });
});

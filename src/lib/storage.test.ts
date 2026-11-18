import { afterEach, describe, expect, it, vi } from 'vitest';
import { takeLegacy } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('takeLegacy', () => {
  it('takes the saved value out of localStorage', () => {
    localStorage.setItem('key', '{"a":1}');
    expect(takeLegacy('key')).toEqual({ a: 1 });
    expect(localStorage.getItem('key')).toBeNull();
  });

  it('takes nothing when nothing is saved', () => {
    expect(takeLegacy('missing')).toBeUndefined();
  });

  it('takes nothing when the saved text is not JSON', () => {
    localStorage.setItem('key', '{broken');
    expect(takeLegacy('key')).toBeUndefined();
  });

  it('takes nothing when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(takeLegacy('key')).toBeUndefined();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStored, writeStored } from './storage';

const isNumber = (value: unknown): value is number => typeof value === 'number';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('storage', () => {
  it('reads back what was written', () => {
    writeStored('key', 42);
    expect(readStored('key', isNumber)).toBe(42);
  });

  it('reads nothing when nothing is saved', () => {
    expect(readStored('missing', isNumber)).toBeUndefined();
  });

  it('reads nothing when the saved value fails the check', () => {
    writeStored('key', 'text');
    expect(readStored('key', isNumber)).toBeUndefined();
  });

  it('reads nothing when the saved text is not JSON', () => {
    localStorage.setItem('key', '{broken');
    expect(readStored('key', isNumber)).toBeUndefined();
  });

  it('carries on when storage refuses to save', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => {
      writeStored('key', 1);
    }).not.toThrow();
  });
});

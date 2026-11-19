import { describe, expect, it } from 'vitest';
import { reviveBeta } from '../beta';
import { reviveSoundSettings } from './settings';

describe('reviveSoundSettings', () => {
  it('keeps what was saved, and has music and effects on when nothing was', () => {
    expect(reviveSoundSettings({ music: false, effects: true })).toEqual({
      music: false,
      effects: true,
    });
    expect(reviveSoundSettings(undefined)).toEqual({ music: true, effects: true });
    expect(reviveSoundSettings({ music: 'no', effects: 0 })).toEqual({
      music: true,
      effects: true,
    });
  });
});

describe('reviveBeta', () => {
  it('is on only when it was turned on', () => {
    expect(reviveBeta(true)).toBe(true);
    expect(reviveBeta(undefined)).toBe(false);
    expect(reviveBeta('true')).toBe(false);
  });
});

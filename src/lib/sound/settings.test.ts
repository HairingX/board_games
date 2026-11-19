import { describe, expect, it } from 'vitest';
import { reviveBeta } from '../beta';
import { reviveSoundSettings } from './settings';

describe('reviveSoundSettings', () => {
  it('keeps the levels saved, and has music and effects as mixed when nothing was', () => {
    expect(reviveSoundSettings({ music: 0.25, effects: 0 })).toEqual({ music: 0.25, effects: 0 });
    expect(reviveSoundSettings(undefined)).toEqual({ music: 1, effects: 1 });
    expect(reviveSoundSettings({ music: 'no', effects: 2 })).toEqual({ music: 1, effects: 1 });
  });

  it('turns what an earlier version kept on or off into a level', () => {
    expect(reviveSoundSettings({ music: false, effects: true })).toEqual({ music: 0, effects: 1 });
  });
});

describe('reviveBeta', () => {
  it('is on only when it was turned on', () => {
    expect(reviveBeta(true)).toBe(true);
    expect(reviveBeta(undefined)).toBe(false);
    expect(reviveBeta('true')).toBe(false);
  });
});

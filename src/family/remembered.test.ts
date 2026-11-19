import { describe, expect, it } from 'vitest';
import { lockedGrace, nobody, reviveRemembered } from './remembered';

const now = 1_000_000_000;

describe('reviveRemembered', () => {
  it('opens on whoever was playing, where they were', () => {
    const saved = { player: 'mille', locked: false, place: '#/spil/regnespil', at: 0 };
    expect(reviveRemembered(saved, now)).toEqual(saved);
  });

  it('opens on a grown-up behind the lock only for a while after the app was used', () => {
    const saved = { player: 'far', locked: true, place: '#/indstillinger', at: now - lockedGrace };
    expect(reviveRemembered(saved, now)).toEqual(saved);
    expect(reviveRemembered({ ...saved, at: now - lockedGrace - 1 }, now)).toEqual(nobody);
  });

  it.each([
    undefined,
    'far',
    { player: 1, locked: false, place: '#/', at: 0 },
    { player: 'far', locked: 'no', place: '#/', at: 0 },
    { player: 'far', locked: false, place: 2, at: 0 },
    { player: 'far', locked: false, place: '#/', at: '0' },
  ])('opens on nobody from %j', (saved) => {
    expect(reviveRemembered(saved, now)).toEqual(nobody);
  });

  it('takes the time as now when none is given', () => {
    expect(reviveRemembered({ player: null, locked: false, place: '#/', at: 0 })).toEqual(nobody);
  });
});

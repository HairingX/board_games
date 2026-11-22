import { describe, expect, it } from 'vitest';
import { seeded } from '../../lib/random';
import { noGear, powerAfter } from './battle';
import {
  chestHolds,
  chestOffers,
  gearOf,
  isTreasure,
  treasurePictures,
  treasures,
} from './treasures';

describe('treasures', () => {
  it('each change the fights as they say, together', () => {
    expect(gearOf([])).toEqual(noGear);
    expect(gearOf(['heartJar'])).toEqual({ ...noGear, hearts: 2 });
    expect(gearOf(['powerRing', 'goldPouch', 'guardCharm'])).toEqual({
      hearts: 0,
      powerAfter: powerAfter - 1,
      coinWorth: 2,
      guards: 1,
    });
    for (const treasure of treasures) expect(treasurePictures[treasure]).toBeTruthy();
  });

  it('are offered three at a time, never one the heroes have, the same from the same seed', () => {
    const offered = chestOffers([], seeded(4));
    expect(offered).toHaveLength(chestHolds);
    expect(new Set(offered).size).toBe(chestHolds);
    expect(chestOffers([], seeded(4))).toEqual(offered);
    const after = chestOffers(['heartJar'], seeded(9));
    expect(after).not.toContain('heartJar');
    expect(after).toHaveLength(3);
    expect(chestOffers(['heartJar', 'powerRing'], seeded(9))).toEqual(['goldPouch', 'guardCharm']);
    expect(chestOffers([...treasures], seeded(9))).toEqual([]);
  });

  it('are told from what is not one', () => {
    expect(isTreasure('goldPouch')).toBe(true);
    expect(isTreasure('sword')).toBe(false);
  });
});

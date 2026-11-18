import { describe, expect, it } from 'vitest';
import { far, mille, mor } from '../../tests/family';
import {
  addProfile,
  mayPlay,
  newFamily,
  nextColor,
  removeProfile,
  reviveFamily,
  setPin,
  type Profile,
} from './family';

const pin = { salt: 's', hash: 'h' };

/** A profile as the first version saved it, without its own code. */
function firstVersion(profile: Profile): Partial<Profile> {
  const copy: Partial<Profile> = { ...profile };
  delete copy.pin;
  return copy;
}

describe('family', () => {
  it('starts with nobody', () => {
    expect(newFamily()).toEqual({ profiles: [] });
  });

  it('lets children play games for children and for everyone, and grown-ups play all', () => {
    expect(mayPlay('barn', 'børn')).toBe(true);
    expect(mayPlay('barn', 'alle')).toBe(true);
    expect(mayPlay('barn', 'voksne')).toBe(false);
    expect(mayPlay('voksen', 'voksne')).toBe(true);
    expect(mayPlay('voksen', 'børn')).toBe(true);
  });

  it('adds and removes profiles, but keeps the last grown-up while there are children', () => {
    let family = addProfile(addProfile(addProfile(newFamily(), far), mor), mille);
    family = removeProfile(family, 'mor');
    expect(family.profiles.map((p) => p.id)).toEqual(['far', 'mille']);
    expect(removeProfile(family, 'far')).toBe(family);
    family = removeProfile(family, 'mille');
    expect(removeProfile(family, 'far').profiles).toEqual([]);
  });

  it('sets and takes away one profile’s code', () => {
    const family = setPin({ profiles: [far, mor] }, 'far', pin);
    expect(family.profiles.map((p) => p.pin)).toEqual([pin, null]);
    expect(setPin(family, 'far', null).profiles[0]?.pin).toBeNull();
  });

  it('gives each new profile a colour no one has, then starts over', () => {
    let family = newFamily();
    expect(nextColor(family)).toBe('plum');
    family = addProfile(family, far);
    expect(nextColor(family)).toBe('teal');
    for (const color of ['teal', 'terracotta', 'olive', 'ochre', 'slate'] as const) {
      family = addProfile(family, { ...far, id: color, color });
    }
    expect(nextColor(family)).toBe('plum');
  });
});

describe('reviveFamily', () => {
  it('keeps a saved family', () => {
    const saved = { profiles: [{ ...far, pin }, mille] };
    expect(reviveFamily(saved)).toEqual(saved);
  });

  it('gives the grown-ups the family code the first version kept', () => {
    const oldFar = firstVersion(far);
    const oldMille = firstVersion(mille);
    expect(reviveFamily({ profiles: [oldFar, oldMille], locked: true, pin })).toEqual({
      profiles: [{ ...far, pin }, mille],
    });
    expect(reviveFamily({ profiles: [oldFar], locked: false, pin: null })).toEqual({
      profiles: [far],
    });
  });

  it.each([
    undefined,
    null,
    'text',
    {},
    { profiles: 'x' },
    { profiles: [null] },
    { profiles: [{ ...far, id: 1 }] },
    { profiles: [{ ...far, name: 1 }] },
    { profiles: [{ ...far, role: 'konge' }] },
    { profiles: [{ ...far, color: 'pink' }] },
    { profiles: [{ ...far, pin: 'abc' }] },
    { profiles: [{ ...far, pin: { salt: 1, hash: 'h' } }] },
    { profiles: [{ ...far, pin: { salt: 's', hash: 1 } }] },
    { profiles: [], pin: 'abc' },
  ])('starts a new family from %j when it is not one', (value) => {
    expect(reviveFamily(value)).toEqual(newFamily());
  });
});

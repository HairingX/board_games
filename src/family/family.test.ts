import { describe, expect, it } from 'vitest';
import {
  addProfile,
  mayPlay,
  newFamily,
  nextColor,
  removeProfile,
  reviveFamily,
  type Profile,
} from './family';

const far: Profile = { id: 'far', name: 'Far', role: 'voksen', color: 'plum' };
const mor: Profile = { id: 'mor', name: 'Mor', role: 'voksen', color: 'teal' };
const mille: Profile = { id: 'mille', name: 'Mille', role: 'barn', color: 'ochre' };

describe('family', () => {
  it('starts with nobody, unlocked and without a code', () => {
    expect(newFamily()).toEqual({ profiles: [], locked: false, pin: null });
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
    const saved = { profiles: [far, mille], locked: true, pin: { salt: 's', hash: 'h' } };
    expect(reviveFamily(saved)).toEqual(saved);
  });

  it.each([
    undefined,
    null,
    'text',
    {},
    { profiles: 'x', locked: false, pin: null },
    { profiles: [null], locked: false, pin: null },
    { profiles: [{ ...far, id: 1 }], locked: false, pin: null },
    { profiles: [{ ...far, name: 1 }], locked: false, pin: null },
    { profiles: [{ ...far, role: 'konge' }], locked: false, pin: null },
    { profiles: [{ ...far, color: 'pink' }], locked: false, pin: null },
    { profiles: [], locked: 'yes', pin: null },
    { profiles: [], locked: false, pin: 'abc' },
    { profiles: [], locked: false, pin: { salt: 1, hash: 'h' } },
    { profiles: [], locked: false, pin: { salt: 's', hash: 1 } },
  ])('starts a new family from %j when it is not one', (value) => {
    expect(reviveFamily(value)).toEqual(newFamily());
  });
});

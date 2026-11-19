import { describe, expect, it } from 'vitest';
import { far, mille, mor } from '../../tests/family';
import {
  addProfile,
  isLocked,
  mayPlay,
  newFamily,
  newProfile,
  nextColor,
  removeProfile,
  reviveFamily,
  setLock,
  updateProfile,
} from './family';
import { faces } from './faces';

const pin = { salt: 's', hash: 'h' };
const other = { salt: 't', hash: 'i' };

describe('family', () => {
  it('starts with nobody and no lock', () => {
    expect(newFamily()).toEqual({ profiles: [], lock: null });
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

  it('makes a new profile with an id of its own', () => {
    const values = { name: 'Oscar', role: 'barn', color: 'slate' } as const;
    const oscar = newProfile(values);
    expect(oscar).toMatchObject(values);
    expect(newProfile(values).id).not.toBe(oscar.id);
  });

  it('changes one profile', () => {
    const family = updateProfile({ profiles: [far, mor], lock: null }, { ...mor, name: 'Mama' });
    expect(family.profiles.map((p) => p.name)).toEqual(['Far', 'Mama']);
  });

  it('locks the grown-ups, not the children, while the lock is on', () => {
    const family = setLock({ profiles: [far, mille], lock: null }, pin);
    expect(family.lock).toBe(pin);
    expect(isLocked(family, far)).toBe(true);
    expect(isLocked(family, mille)).toBe(false);
    expect(isLocked(setLock(family, null), far)).toBe(false);
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
    const saved = { profiles: [far, mille], lock: pin };
    expect(reviveFamily(saved)).toEqual(saved);
  });

  it('makes the first version’s family code the grown-ups’ lock', () => {
    expect(reviveFamily({ profiles: [far, mille], locked: true, pin })).toEqual({
      profiles: [far, mille],
      lock: pin,
    });
    expect(reviveFamily({ profiles: [far], locked: false, pin: null })).toEqual({
      profiles: [far],
      lock: null,
    });
  });

  it('makes the first grown-up’s own code the lock, and leaves other codes and languages', () => {
    const saved = {
      profiles: [
        { ...mille, pin: other, language: 'en' },
        { ...far, pin: null, language: 'da' },
        { ...mor, pin },
      ],
    };
    expect(reviveFamily(saved)).toEqual({ profiles: [mille, far, mor], lock: pin });
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
    { profiles: [], pin: 'abc' },
    { profiles: [], lock: { salt: 1, hash: 'h' } },
    { profiles: [], lock: { salt: 's', hash: 1 } },
  ])('starts a new family from %j when it is not one', (value) => {
    expect(reviveFamily(value)).toEqual(newFamily());
  });

  it('keeps a picture the app can still show, and leaves out any other', () => {
    const [face = ''] = [...faces.keys()];
    const photo = { kind: 'photo', src: 'data:image/jpeg;base64,AAA' } as const;
    const saved = {
      profiles: [
        { ...far, picture: { kind: 'face', face } },
        { ...mor, picture: photo },
        { ...mille, picture: { kind: 'face', face: 'Gone' } },
      ],
      lock: null,
    };
    expect(reviveFamily(saved).profiles).toEqual([
      { ...far, picture: { kind: 'face', face } },
      { ...mor, picture: photo },
      mille,
    ]);
    for (const picture of [
      null,
      'face',
      { kind: 'face', face: 1 },
      { kind: 'photo', src: 'https://example.invalid/a.jpg' },
      { kind: 'photo', src: 2 },
      { kind: 'drawing' },
    ]) {
      expect(reviveFamily({ profiles: [{ ...far, picture }] }).profiles).toEqual([far]);
    }
  });
});

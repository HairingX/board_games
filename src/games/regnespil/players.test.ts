import { describe, expect, it } from 'vitest';
import { far, mille } from '../../../tests/family';
import { heroes, suggestHero } from './heroes';
import { reviveSettings, suggest } from './players';

const today = new Date(2026, 10, 19);

describe('suggest', () => {
  it('starts a grown-up at level 13 with the flame sword, and an empty purse', () => {
    expect(suggest(far, today)).toMatchObject({ level: 13, sword: 'flamme', coins: 0 });
  });

  it('starts a child without a birthday at level 1 with the wooden sword', () => {
    expect(suggest(mille, today)).toMatchObject({ level: 1, sword: 'træ' });
  });

  it('suggests the hero the profile’s face is, or one by the player', () => {
    const knight = { ...mille, picture: { kind: 'face', face: 'KnightGold' } } as const;
    expect(suggest(knight, today).hero).toBe('KnightGold');
    const cat = { ...mille, picture: { kind: 'face', face: 'Cat' } } as const;
    expect(suggest(cat, today).hero).toBe(suggestHero(mille));
    expect(heroes).toContain(suggestHero(mille));
    expect(suggestHero(far)).not.toBe(suggestHero(mille));
  });

  it.each([
    ['2021-03-01', 1, 'træ'],
    ['2020-03-01', 1, 'træ'],
    ['2018-04-23', 3, 'træ'],
    ['2017-04-23', 5, 'jern'],
    ['2013-04-23', 11, 'jern'],
    ['2010-01-01', 13, 'jern'],
  ] as const)('starts a child born %s at level %i with the %s sword', (born, level, sword) => {
    expect(suggest({ ...mille, born }, today)).toMatchObject({ level, sword });
  });
});

describe('reviveSettings', () => {
  it('keeps a level, a sword and a hero the game has', () => {
    const saved = { level: 7, sword: 'jern', hero: 'Samurai', coins: 12 };
    expect(reviveSettings(saved, mille)).toEqual(saved);
  });

  it('gives settings saved before heroes and purses the suggested hero and an empty purse', () => {
    expect(reviveSettings({ level: 7, sword: 'jern' }, mille)).toEqual({
      level: 7,
      sword: 'jern',
      hero: suggestHero(mille),
      coins: 0,
    });
    expect(reviveSettings({ level: 7, sword: 'jern', coins: -3 }, mille)?.coins).toBe(0);
    expect(reviveSettings({ level: 7, sword: 'jern', hero: 'Boy' }, mille)?.hero).toBe(
      suggestHero(mille),
    );
  });

  it.each([undefined, null, 'x', { level: 16, sword: 'jern' }, { level: 3, sword: 'guld' }])(
    'leaves out %j',
    (saved) => {
      expect(reviveSettings(saved, mille)).toBeUndefined();
    },
  );
});

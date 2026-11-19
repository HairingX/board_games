import { describe, expect, it } from 'vitest';
import { far, mille } from '../../../tests/family';
import { reviveSettings, suggest } from './players';

const today = new Date(2026, 10, 19);

describe('suggest', () => {
  it('starts a grown-up at level 13 with the flame sword', () => {
    expect(suggest(far, today)).toEqual({ level: 13, sword: 'flamme' });
  });

  it('starts a child without a birthday at level 1 with the wooden sword', () => {
    expect(suggest(mille, today)).toEqual({ level: 1, sword: 'træ' });
  });

  it.each([
    ['2021-03-01', 1, 'træ'],
    ['2020-03-01', 1, 'træ'],
    ['2018-04-23', 3, 'træ'],
    ['2017-04-23', 5, 'jern'],
    ['2013-04-23', 11, 'jern'],
    ['2010-01-01', 13, 'jern'],
  ] as const)('starts a child born %s at level %i with the %s sword', (born, level, sword) => {
    expect(suggest({ ...mille, born }, today)).toEqual({ level, sword });
  });
});

describe('reviveSettings', () => {
  it('keeps a level and a sword the game has', () => {
    expect(reviveSettings({ level: 7, sword: 'jern' })).toEqual({ level: 7, sword: 'jern' });
  });

  it.each([undefined, null, 'x', { level: 16, sword: 'jern' }, { level: 3, sword: 'guld' }])(
    'leaves out %j',
    (saved) => {
      expect(reviveSettings(saved)).toBeUndefined();
    },
  );
});

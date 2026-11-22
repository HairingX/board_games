import { describe, expect, it } from 'vitest';
import { far, mille, mor } from '../../../tests/family';
import { startFight } from './battle';
import { fightSaveKey, reviveFight, type SavedFight } from './fightSave';
import { makeTask } from './tasks';

const saved: SavedFight = {
  fight: { ...startFight(3), health: 7, lives: 2, last: 'struck' },
  lives: 3,
  activeId: 'mille',
  task: makeTask(1, () => 0),
  recent: ['[1,"+",1]'],
  seed: 7,
  foe: 'slime',
};

describe('fightSaveKey', () => {
  it('is the same for the same players in any order', () => {
    expect(fightSaveKey('regnespil', [mille, far])).toBe('regnespil/kamp/far+mille');
    expect(fightSaveKey('regnespil', [far, mille])).toBe('regnespil/kamp/far+mille');
    expect(fightSaveKey('regnespil', [mor])).toBe('regnespil/kamp/mor');
  });
});

describe('reviveFight', () => {
  it('upgrades a fight saved before turns to defend, rage and seeds, with none announced', () => {
    const { health, lives, outcome, last } = saved.fight;
    const older = { health, lives, outcome, last };
    const unseeded = { ...saved, fight: older, seed: undefined, foe: undefined };
    expect(reviveFight(unseeded)).toEqual({ ...saved, seed: 0 });
  });

  it('keeps a fight as it was saved', () => {
    expect(reviveFight(structuredClone(saved))).toEqual(saved);
    const threatened = { ...saved, fight: { ...saved.fight, round: 2, threat: true } };
    expect(reviveFight(structuredClone(threatened))).toEqual(threatened);
    expect(reviveFight({ ...saved, task: { ...saved.task, answer: { n: 1, d: 2 } } })).toBeTruthy();
  });

  it.each([
    ['nothing', undefined],
    ['no fight', { ...saved, fight: 'kamp' }],
    ['hearts beyond five', { ...saved, fight: { ...saved.fight, health: 11 } }],
    ['more lives than at the start', { ...saved, fight: { ...saved.fight, lives: 4 } }],
    ['no lives at the start', { ...saved, lives: 0 }],
    ['an unknown outcome', { ...saved, fight: { ...saved.fight, outcome: 'tie' } }],
    ['an unknown blow', { ...saved, fight: { ...saved.fight, last: 'kicked' } }],
    ['a broken count of turns', { ...saved, fight: { ...saved.fight, round: -1 } }],
    ['a threat that is no yes or no', { ...saved, fight: { ...saved.fight, threat: 'ja' } }],
    ['rage beyond its lives', { ...saved, fight: { ...saved.fight, rageAt: 4 } }],
    ['a rage that is no yes or no', { ...saved, fight: { ...saved.fight, enraged: 1 } }],
    ['a combo beyond a power stroke', { ...saved, fight: { ...saved.fight, combo: 4 } }],
    ['a seed that is no whole number', { ...saved, seed: 1.5 }],
    ['a monster the game has not', { ...saved, foe: 'dragon' }],
    ['a shield beyond its pieces', { ...saved, fight: { ...saved.fight, shield: 9 } }],
    ['a shield beyond its lives', { ...saved, fight: { ...saved.fight, shieldAt: 9 } }],
    ['a raised shield no yes or no', { ...saved, fight: { ...saved.fight, shieldRaised: 1 } }],
    ['no player', { ...saved, activeId: 3 }],
    ['no task', { ...saved, task: null }],
    ['a task without its sum', { ...saved, task: { ...saved.task, sum: 'x' } }],
    ['two answers', { ...saved, task: { ...saved.task, choices: [1, 2] } }],
    ['no nearness', { ...saved, task: { ...saved.task, near: '2' } }],
    ['no answer', { ...saved, task: { ...saved.task, answer: '2' } }],
    ['sums shown not as keys', { ...saved, recent: [1] }],
    ['no sums shown', { ...saved, recent: 'x' }],
  ])('begins afresh from %s', (_what, value) => {
    expect(reviveFight(value)).toBeNull();
  });
});

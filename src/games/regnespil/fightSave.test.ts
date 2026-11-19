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
};

describe('fightSaveKey', () => {
  it('is the same for the same players in any order', () => {
    expect(fightSaveKey('regnespil', [mille, far])).toBe('regnespil/kamp/far+mille');
    expect(fightSaveKey('regnespil', [far, mille])).toBe('regnespil/kamp/far+mille');
    expect(fightSaveKey('regnespil', [mor])).toBe('regnespil/kamp/mor');
  });
});

describe('reviveFight', () => {
  it('keeps a fight as it was saved', () => {
    expect(reviveFight(structuredClone(saved))).toEqual(saved);
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

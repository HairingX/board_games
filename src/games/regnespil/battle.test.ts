import { describe, expect, it } from 'vitest';
import { answerFight, fullHealth, startFight, strikeBackEvery, type Fight } from './battle';
import { monsterLives } from './swords';
import type { Verdict } from './tasks';

/** The fight after these answers, one after another, all with the sword. */
const after = (fight: Fight, verdicts: readonly Verdict[], sword = 'jern' as const) =>
  verdicts.reduce((now, verdict) => answerFight(now, verdict, sword), fight);

describe('a fight', () => {
  it('starts with five hearts, and the monster as tough as the hardest sword', () => {
    expect(startFight(monsterLives(['træ', 'jern']))).toEqual({
      health: fullHealth,
      lives: 3,
      outcome: 'fighting',
      last: undefined,
      round: 0,
      threat: false,
    });
    expect(monsterLives(['træ'])).toBe(2);
    expect(monsterLives(['flamme', 'træ'])).toBe(4);
  });

  it('strikes the monster on a right answer, and is won when it has no lives left', () => {
    const once = answerFight(startFight(2), 'right', 'jern');
    expect(once).toMatchObject({ lives: 1, last: 'struck', outcome: 'fighting', round: 1 });
    expect(answerFight(once, 'right', 'jern')).toMatchObject({ lives: 0, outcome: 'won' });
  });

  it('costs what the sword says: the wooden sword forgives a close answer', () => {
    const fight = startFight(3);
    expect(answerFight(fight, 'close', 'træ')).toMatchObject({ health: 10, last: 'parried' });
    expect(answerFight(fight, 'far', 'træ')).toMatchObject({ health: 9, last: 'bumped' });
    expect(answerFight(fight, 'close', 'jern')).toMatchObject({ health: 9, last: 'nicked' });
    expect(answerFight(fight, 'far', 'flamme')).toMatchObject({ health: 8, last: 'bumped' });
  });

  it('announces the monster strikes back every third turn, two to attack and one to defend', () => {
    const fight = startFight(9);
    expect(after(fight, ['right']).threat).toBe(false);
    expect(after(fight, ['right', 'close']).threat).toBe(true);
    expect(after(fight, ['right', 'close', 'right']).threat).toBe(false);
    expect(after(fight, Array<Verdict>(strikeBackEvery * 2 - 1).fill('right')).threat).toBe(true);
  });

  it('lets a right answer dodge the blow, and any other take what far off costs', () => {
    const threatened = after(startFight(9), ['right', 'right']);
    expect(answerFight(threatened, 'right', 'jern')).toMatchObject({
      health: 10,
      lives: 7,
      last: 'dodged',
    });
    expect(answerFight(threatened, 'close', 'jern')).toMatchObject({ health: 8, last: 'hit' });
    expect(answerFight(threatened, 'far', 'træ')).toMatchObject({ health: 9, last: 'hit' });
  });

  it('lets the hero rest when the hearts are gone, and stays over', () => {
    let fight = { ...startFight(3), health: 1 };
    fight = answerFight(fight, 'far', 'jern');
    expect(fight).toMatchObject({ health: 0, outcome: 'lost' });
    expect(answerFight(fight, 'right', 'jern')).toBe(fight);
  });
});

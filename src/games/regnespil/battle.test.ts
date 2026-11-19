import { describe, expect, it } from 'vitest';
import { answerFight, fullHealth, startFight } from './battle';
import { monsterLives } from './swords';

describe('a fight', () => {
  it('starts with five hearts, and the monster as tough as the hardest sword', () => {
    expect(startFight(monsterLives(['træ', 'jern']))).toEqual({
      health: fullHealth,
      lives: 3,
      outcome: 'fighting',
      last: undefined,
    });
    expect(monsterLives(['træ'])).toBe(2);
    expect(monsterLives(['flamme', 'træ'])).toBe(4);
  });

  it('strikes the monster on a right answer, and is won when it has no lives left', () => {
    const once = answerFight(startFight(2), 'right', 'jern');
    expect(once).toMatchObject({ lives: 1, last: 'struck', outcome: 'fighting' });
    expect(answerFight(once, 'right', 'jern')).toMatchObject({ lives: 0, outcome: 'won' });
  });

  it('costs what the sword says: the wooden sword forgives a close answer', () => {
    const fight = startFight(3);
    expect(answerFight(fight, 'close', 'træ')).toMatchObject({ health: 10, last: 'parried' });
    expect(answerFight(fight, 'far', 'træ')).toMatchObject({ health: 9, last: 'bumped' });
    expect(answerFight(fight, 'close', 'jern')).toMatchObject({ health: 9, last: 'nicked' });
    expect(answerFight(fight, 'far', 'flamme')).toMatchObject({ health: 8, last: 'bumped' });
  });

  it('lets the hero rest when the hearts are gone, and stays over', () => {
    let fight = { ...startFight(3), health: 1 };
    fight = answerFight(fight, 'far', 'jern');
    expect(fight).toMatchObject({ health: 0, outcome: 'lost' });
    expect(answerFight(fight, 'right', 'jern')).toBe(fight);
  });
});

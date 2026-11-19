import { describe, expect, it } from 'vitest';
import { answerFight, firstFight, startFight } from './battle';

describe('a fight', () => {
  it('starts with the hero’s hearts and the monster’s lives', () => {
    expect(startFight(firstFight)).toEqual({
      hearts: 3,
      lives: 3,
      outcome: 'fighting',
      last: undefined,
    });
  });

  it('strikes on a right answer, parries a close one, and bumps the hero on one far off', () => {
    let fight = startFight({ hearts: 2, lives: 2 });
    fight = answerFight(fight, 'right');
    expect(fight).toMatchObject({ lives: 1, hearts: 2, last: 'struck', outcome: 'fighting' });
    fight = answerFight(fight, 'close');
    expect(fight).toMatchObject({ lives: 1, hearts: 2, last: 'parried' });
    fight = answerFight(fight, 'far');
    expect(fight).toMatchObject({ lives: 1, hearts: 1, last: 'bumped', outcome: 'fighting' });
  });

  it('is won when the monster has no lives left, and lost when the hero has no hearts', () => {
    const won = answerFight(startFight({ hearts: 1, lives: 1 }), 'right');
    expect(won.outcome).toBe('won');
    expect(answerFight(won, 'far')).toBe(won);
    const lost = answerFight(startFight({ hearts: 1, lives: 1 }), 'far');
    expect(lost.outcome).toBe('lost');
  });
});

import { describe, expect, it } from 'vitest';
import {
  answerFight,
  reachedHero,
  fullHealth,
  powerAfter,
  powerStroke,
  startFight,
  strikeBackEvery,
  type Fight,
} from './battle';
import { monsterLives } from './swords';
import type { Verdict } from './tasks';

/** The fight after these answers, one after another, all with the sword. */
const after = (fight: Fight, verdicts: readonly Verdict[], sword = 'jern' as const) =>
  verdicts.reduce((now, verdict) => answerFight(now, verdict, sword), fight);

describe('a fight', () => {
  it('starts with five hearts, and the monster as tough as every sword together', () => {
    expect(startFight(monsterLives(['træ', 'jern']))).toEqual({
      health: fullHealth,
      lives: 5,
      outcome: 'fighting',
      last: undefined,
      round: 0,
      threat: false,
      rageAt: 2,
      enraged: false,
      combo: 0,
    });
    expect(monsterLives(['træ'])).toBe(2);
    expect(monsterLives(['flamme', 'træ'])).toBe(6);
  });

  it('strikes the monster on a right answer, and is won when it has no lives left', () => {
    const once = answerFight(startFight(3), 'right', 'jern');
    expect(once).toMatchObject({ lives: 2, last: 'struck', outcome: 'fighting', round: 1 });
    expect(answerFight(startFight(1), 'right', 'jern')).toMatchObject({
      lives: 0,
      outcome: 'won',
    });
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

  it('grows enraged at half its lives, strikes back at once and then every other turn', () => {
    const fight = startFight(4);
    const struck = after(fight, ['right']);
    expect(struck).toMatchObject({ lives: 3, enraged: false, threat: false });
    const raging = after(struck, ['right']);
    expect(raging).toMatchObject({ lives: 2, enraged: true, threat: true });
    expect(after(raging, ['right'])).toMatchObject({ enraged: true, threat: false });
    expect(after(raging, ['right', 'far'])).toMatchObject({ lives: 2, threat: true });
    expect(after(raging, ['right', 'right'])).toMatchObject({ outcome: 'won', enraged: false });
  });

  it('strikes a power stroke at the third right in a row, which only an answer far off breaks', () => {
    const fight = startFight(9);
    expect(after(fight, ['right', 'close'])).toMatchObject({ combo: 1, lives: 8 });
    expect(after(fight, ['right', 'far'])).toMatchObject({ combo: 0 });
    // Right, right, a dodge, and the next stroke is a power stroke.
    const charged = after(fight, ['right', 'right', 'right']);
    expect(charged).toMatchObject({ combo: powerAfter, lives: 7, last: 'dodged' });
    expect(answerFight(charged, 'right', 'jern')).toMatchObject({
      last: 'smashed',
      lives: 7 - powerStroke,
      combo: 0,
    });
    const third = after({ ...fight, combo: 2 }, ['right']);
    expect(third).toMatchObject({ last: 'smashed', lives: 9 - powerStroke });
    expect(after({ ...startFight(1), combo: 2 }, ['right'])).toMatchObject({
      lives: 0,
      outcome: 'won',
    });
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

  it('lets a monster that reaches the hero strike only with the flame sword', () => {
    const fight = { ...startFight(3), combo: 2 };
    expect(reachedHero(fight, 'jern')).toBe(fight);
    expect(reachedHero(fight, 'flamme')).toMatchObject({ health: 8, last: 'hit', combo: 2 });
    const over = { ...fight, outcome: 'lost' } as const;
    expect(reachedHero(over, 'flamme')).toBe(over);
  });

  it('lets the hero rest when the hearts are gone, and stays over', () => {
    let fight = { ...startFight(3), health: 1 };
    fight = answerFight(fight, 'far', 'jern');
    expect(fight).toMatchObject({ health: 0, outcome: 'lost' });
    expect(answerFight(fight, 'right', 'jern')).toBe(fight);
  });
});

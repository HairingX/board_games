import type { Verdict } from './tasks';

/**
 * A fight, as rules apart from how it is shown. A right answer is a stroke of the sword that
 * takes one of the monster's lives; a close answer is parried, so nothing happens either way, as
 * yellow means "nearly", not a punishment; an answer far off lets the monster bump the hero,
 * who loses a heart. Later the sword chosen, crystals and upgrades change these numbers.
 */
export interface FightRules {
  /** The hero's hearts at the start. */
  hearts: number;
  /** How many strokes the monster takes. */
  lives: number;
}

/** What happened at the last answer, for the screen to show. */
export type Blow = 'struck' | 'parried' | 'bumped';

export interface Fight {
  hearts: number;
  lives: number;
  /** Over once the monster or the hero has no more to give. */
  outcome: 'fighting' | 'won' | 'lost';
  last: Blow | undefined;
}

export const firstFight: FightRules = { hearts: 3, lives: 3 };

export function startFight(rules: FightRules): Fight {
  return { hearts: rules.hearts, lives: rules.lives, outcome: 'fighting', last: undefined };
}

/** The fight after an answer; a fight that is over stays as it is. */
export function answerFight(fight: Fight, verdict: Verdict): Fight {
  if (fight.outcome !== 'fighting') return fight;
  if (verdict === 'right') {
    const lives = fight.lives - 1;
    return { ...fight, lives, last: 'struck', outcome: lives === 0 ? 'won' : 'fighting' };
  }
  if (verdict === 'close') return { ...fight, last: 'parried' };
  const hearts = fight.hearts - 1;
  return { ...fight, hearts, last: 'bumped', outcome: hearts === 0 ? 'lost' : 'fighting' };
}

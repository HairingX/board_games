import type { Sword } from './swords';
import { swordRules } from './swords';
import type { Verdict } from './tasks';

/**
 * A fight, as rules apart from how it is shown. A right answer is a stroke of the sword that
 * takes one of the monster's lives; a close answer is parried, and may cost the hero half a
 * heart; an answer far off lets the monster bump the hero, which costs more. What each costs is
 * the sword's (`swordRules`), so guessing never pays. No death: out of hearts, the hero rests.
 */

/** The hero's health in half hearts: five hearts. */
export const fullHealth = 10;

/** What happened at the last answer, for the screen to show: nicked is parried, with a cost. */
export type Blow = 'struck' | 'parried' | 'nicked' | 'bumped';

export interface Fight {
  /** The hero's health left, in half hearts. */
  health: number;
  lives: number;
  /** Over once the monster or the hero has no more to give. */
  outcome: 'fighting' | 'won' | 'lost';
  last: Blow | undefined;
}

export function startFight(lives: number): Fight {
  return { health: fullHealth, lives, outcome: 'fighting', last: undefined };
}

/** The fight after an answer by a player with the sword; a fight that is over stays as it is. */
export function answerFight(fight: Fight, verdict: Verdict, sword: Sword): Fight {
  if (fight.outcome !== 'fighting') return fight;
  if (verdict === 'right') {
    const lives = fight.lives - 1;
    return { ...fight, lives, last: 'struck', outcome: lives === 0 ? 'won' : 'fighting' };
  }
  const cost = swordRules[sword][verdict];
  const health = Math.max(0, fight.health - cost);
  const last = verdict === 'far' ? 'bumped' : cost === 0 ? 'parried' : 'nicked';
  return { ...fight, health, last, outcome: health === 0 ? 'lost' : 'fighting' };
}

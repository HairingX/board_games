import type { Sword } from './swords';
import { swordRules } from './swords';
import type { Verdict } from './tasks';

/**
 * A fight, as rules apart from how it is shown. Turns of two kinds, in a rhythm a child can
 * learn: two to attack, then one to defend, as the monster announces it strikes back. Halfway,
 * struck down to half its lives, the monster grows enraged: it strikes back at once, and from
 * then on every other turn, so a fight changes as it goes.
 *
 * - Attacking, a right answer is a stroke of the sword that takes one of the monster's lives;
 *   a close answer is parried, and may cost the hero half a heart; an answer far off lets the
 *   monster bump the hero, which costs more.
 * - Defending, a right answer dodges the monster's blow, and costs nothing; any other lets it
 *   land, which costs what an answer far off does.
 *
 * What each costs is the sword's (`swordRules`), so guessing never pays. No death: out of
 * hearts, the hero rests.
 */

/** The hero's health in half hearts: five hearts. */
export const fullHealth = 10;

/** Every how many turns the monster strikes back, its turn announced the one before. */
export const strikeBackEvery = 3;

/** The lives a monster has left when it grows enraged: half of those it began with. */
export const rageAt = (lives: number) => Math.floor(lives / 2);

/**
 * What happened at the last answer, for the screen to show: nicked is parried, with a cost;
 * dodged and hit are a monster's blow dodged or landing.
 */
export type Blow = 'struck' | 'parried' | 'nicked' | 'bumped' | 'dodged' | 'hit';

export interface Fight {
  /** The hero's health left, in half hearts. */
  health: number;
  lives: number;
  /** Over once the monster or the hero has no more to give. */
  outcome: 'fighting' | 'won' | 'lost';
  last: Blow | undefined;
  /** How many answers have been given. */
  round: number;
  /** Whether the monster has announced it strikes at the next answer, to be dodged. */
  threat: boolean;
  /** At how many lives left the monster grows enraged, and whether it has. */
  rageAt: number;
  enraged: boolean;
}

export function startFight(lives: number): Fight {
  return {
    health: fullHealth,
    lives,
    outcome: 'fighting',
    last: undefined,
    round: 0,
    threat: false,
    rageAt: rageAt(lives),
    enraged: false,
  };
}

/** The fight after an answer by a player with the sword; a fight that is over stays as it is. */
export function answerFight(fight: Fight, verdict: Verdict, sword: Sword): Fight {
  if (fight.outcome !== 'fighting') return fight;
  const after = { ...answered(fight, verdict, sword), round: fight.round + 1 };
  const enraged = after.outcome === 'fighting' && after.lives <= fight.rageAt;
  // Enraged, the monster strikes back every other turn, beginning at once.
  const threat = enraged ? !fight.threat : after.round % strikeBackEvery === strikeBackEvery - 1;
  return { ...after, enraged, threat };
}

/** What the answer does to the hero or the monster, before the turns move on. */
function answered(fight: Fight, verdict: Verdict, sword: Sword): Fight {
  const costs = swordRules[sword];
  if (fight.threat) {
    if (verdict === 'right') return { ...fight, last: 'dodged' };
    return hurt(fight, costs.far, 'hit');
  }
  if (verdict === 'right') {
    const lives = fight.lives - 1;
    return { ...fight, lives, last: 'struck', outcome: lives === 0 ? 'won' : 'fighting' };
  }
  const cost = costs[verdict];
  return hurt(fight, cost, verdict === 'far' ? 'bumped' : cost === 0 ? 'parried' : 'nicked');
}

function hurt(fight: Fight, cost: number, last: Blow): Fight {
  const health = Math.max(0, fight.health - cost);
  return { ...fight, health, last, outcome: health === 0 ? 'lost' : 'fighting' };
}

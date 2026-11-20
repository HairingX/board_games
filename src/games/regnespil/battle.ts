import type { Random } from '../../lib/random';
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
 *
 * A berry bush stands on the stage, as the owner described: a wounded monster may go and eat,
 * the more likely the more it is hurt and never twice in a row. It shows it the turn before,
 * turning to the bush. A right answer strikes it before it eats; any other lets it eat, giving
 * it a life back, but costs the heroes nothing, as it is busy eating. The bush grows its
 * berries back.
 *
 * Right answers in a row build a combo: the third is a power stroke that takes two lives (or,
 * should the third be a dodge, the next stroke is). A close answer keeps the combo; only one far off breaks it, so a child who
 * nearly had it is not punished.
 */

/** The hero's health in half hearts: five hearts. */
export const fullHealth = 10;

/** Every how many turns the monster strikes back, its turn announced the one before. */
export const strikeBackEvery = 3;

/** How many coins each player gets for a victory, to pick up and keep in their purse. */
export const coinsEach = 3;

/** How many right answers in a row make a power stroke: the last of them, if it is a stroke. */
export const powerAfter = 3;

/** How many lives a power stroke takes. */
export const powerStroke = 2;

/** How many berries the bush holds, and every how many turns it grows one back. */
export const bush = { berries: 2, regrowEvery: 4 } as const;

/**
 * How a monster weighs eating against fighting on (utility scoring): fighting scores
 * `attack`; eating scores `hunger` times the share of its lives lost, squared, so it is never
 * hungry unhurt and grows hungrier fast as it is hurt; a little of `whim` is added to eating,
 * at random, so it is not quite predictable.
 */
export const appetite = { attack: 1, hunger: 4, whim: 0.5 } as const;

/** The lives a monster has left when it grows enraged: half of those it began with. */
export const rageAt = (lives: number) => Math.floor(lives / 2);

/**
 * What happened at the last answer, for the screen to show: smashed is a power stroke; nicked
 * is parried, with a cost; dodged and hit are a monster's blow dodged or landing; fed is the
 * monster eating while the answer was wrong.
 */
export type Blow =
  'struck' | 'smashed' | 'parried' | 'nicked' | 'bumped' | 'dodged' | 'hit' | 'fed';

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
  /** Right answers in a row, up to `powerAfter`. */
  combo: number;
  /** The lives the monster began with, which eating never goes beyond. */
  full: number;
  /** The berries left on the bush. */
  berries: number;
  /** Whether the monster has shown it goes to eat at the next answer. */
  hungry: boolean;
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
    combo: 0,
    full: lives,
    berries: bush.berries,
    hungry: false,
  };
}

/**
 * The fight after an answer by a player with the sword; a fight that is over stays as it is.
 * `random` adds the monster's whim to what it chooses to do next.
 */
export function answerFight(
  fight: Fight,
  verdict: Verdict,
  sword: Sword,
  random: Random = Math.random,
): Fight {
  if (fight.outcome !== 'fighting') return fight;
  const done = answered(fight, verdict, sword);
  const round = fight.round + 1;
  const regrown = round % bush.regrowEvery === 0 && done.berries < bush.berries ? 1 : 0;
  const after = {
    ...done,
    round,
    combo: comboAfter(fight, verdict, done.last),
    berries: done.berries + regrown,
  };
  // Once enraged, it stays so, though it eats a life back.
  const enraged = after.outcome === 'fighting' && (fight.enraged || after.lives <= fight.rageAt);
  // Enraged, the monster strikes back every other turn, beginning at once.
  const threat = enraged ? !fight.threat : round % strikeBackEvery === strikeBackEvery - 1;
  const hungry = !threat && after.outcome === 'fighting' && wantsToEat(after, random);
  return { ...after, enraged, threat, hungry };
}

/** Whether the monster chooses to eat rather than fight at the next answer. */
function wantsToEat(fight: Fight, random: Random): boolean {
  if (fight.berries === 0 || fight.last === 'fed') return false;
  const lost = (fight.full - fight.lives) / fight.full;
  return appetite.hunger * lost ** 2 + appetite.whim * random() > appetite.attack;
}

/**
 * The fight when the monster reaches the hero before the sum is answered: with a sword whose
 * monsters strike in time, the blow lands, costing what an answer far off does; the turn and
 * its sum stay. With any other, nothing happens: the monster only roars and steps back.
 */
export function reachedHero(fight: Fight, sword: Sword): Fight {
  if (fight.outcome !== 'fighting' || !swordRules[sword].strikesInTime) return fight;
  return hurt(fight, swordRules[sword].far, 'hit');
}

/** What the answer does to the hero or the monster, before the turns move on. */
function answered(fight: Fight, verdict: Verdict, sword: Sword): Fight {
  const costs = swordRules[sword];
  if (fight.threat) {
    if (verdict === 'right') return { ...fight, last: 'dodged' };
    return hurt(fight, costs.far, 'hit');
  }
  if (fight.hungry && verdict !== 'right') {
    const lives = Math.min(fight.full, fight.lives + 1);
    return { ...fight, lives, berries: fight.berries - 1, last: 'fed' };
  }
  if (verdict === 'right') {
    const power = fight.combo + 1 >= powerAfter;
    const lives = Math.max(0, fight.lives - (power ? powerStroke : 1));
    return {
      ...fight,
      lives,
      last: power ? 'smashed' : 'struck',
      outcome: lives === 0 ? 'won' : 'fighting',
    };
  }
  const cost = costs[verdict];
  return hurt(fight, cost, verdict === 'far' ? 'bumped' : cost === 0 ? 'parried' : 'nicked');
}

/** The combo after the answer: one more for a right one, gone after one far off or a power stroke. */
function comboAfter(fight: Fight, verdict: Verdict, last: Blow | undefined): number {
  if (verdict === 'far' || last === 'smashed') return 0;
  return verdict === 'right' ? Math.min(powerAfter, fight.combo + 1) : fight.combo;
}

function hurt(fight: Fight, cost: number, last: Blow): Fight {
  const health = Math.max(0, fight.health - cost);
  return { ...fight, health, last, outcome: health === 0 ? 'lost' : 'fighting' };
}

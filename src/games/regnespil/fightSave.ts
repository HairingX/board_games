import type { Profile } from '../../family/family';
import { bush, fullHealth, powerAfter, rageAt, shieldPieces, type Fight } from './battle';
import { isFoe, type Foe } from './monsters';
import type { Task } from './tasks';

/*
 * A fight is saved after every answer, so a closed or crashed app goes on where it was: the
 * hearts, the monster's life, whose turn it is and the sum waiting for them.
 */

/** A fight as saved: how it stands, and what comes next. */
export interface SavedFight {
  fight: Fight;
  /** How many strokes the monster took at the start, for its life bar. */
  lives: number;
  /** Whose turn comes next, by their profile's id, and the sum waiting for them. */
  activeId: string;
  task: Task;
  /** The sums shown lately, the latest last, so the next is none of them. */
  recent: readonly string[];
  /** What the monster was made from, such as its name, so it is the same when reopened. */
  seed: number;
  /** Which monster the heroes fight, by its kind. */
  foe: Foe;
}

/** The largest seed: any whole number that fits in 32 bits. */
export const seeds = 2 ** 32;

/** Where the fight of these players is saved: the same whatever order they were chosen in. */
export function fightSaveKey(saveKey: string, players: readonly Profile[]): string {
  return `${saveKey}/kamp/${players
    .map((player) => player.id)
    .sort()
    .join('+')}`;
}

/** What a fight came to hold after it was first saved. */
type Added =
  | 'round'
  | 'threat'
  | 'rageAt'
  | 'enraged'
  | 'combo'
  | 'full'
  | 'berries'
  | 'hungry'
  | 'shieldAt'
  | 'shield'
  | 'shieldRaised';

const outcomes: readonly string[] = ['fighting', 'won', 'lost'];
const blows: readonly (string | undefined)[] = [
  'struck',
  'smashed',
  'parried',
  'nicked',
  'bumped',
  'dodged',
  'hit',
  'fed',
  undefined,
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isCount = (value: unknown, most: number): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= most;

/**
 * The fight as saved, or null when none is, or what is saved is not a fight this game knows. A
 * fight saved before turns to defend came is upgraded: its turns counted from none, and no
 * blow announced; one saved before monsters grew enraged is not yet enraged, and grows so at
 * half its lives; one saved before combos has none; one saved before monsters had seeds gets
 * the first; one saved before the berry bush finds it full, and the monster not hungry.
 */
export function reviveFight(saved: unknown): SavedFight | null {
  if (!isRecord(saved)) return null;
  const { fight, lives, activeId, task, recent, seed, foe } = saved;
  const known =
    isCount(lives, Number.MAX_SAFE_INTEGER) &&
    lives > 0 &&
    isRecord(fight) &&
    isCount(fight.health, fullHealth) &&
    isCount(fight.lives, lives) &&
    outcomes.includes(fight.outcome as string) &&
    blows.includes(fight.last as string | undefined) &&
    (fight.round === undefined || isCount(fight.round, Number.MAX_SAFE_INTEGER)) &&
    (fight.threat === undefined || typeof fight.threat === 'boolean') &&
    (fight.rageAt === undefined || isCount(fight.rageAt, lives)) &&
    (fight.enraged === undefined || typeof fight.enraged === 'boolean') &&
    (fight.combo === undefined || isCount(fight.combo, powerAfter)) &&
    (fight.full === undefined || fight.full === lives) &&
    (fight.berries === undefined || isCount(fight.berries, bush.berries)) &&
    (fight.hungry === undefined || typeof fight.hungry === 'boolean') &&
    (fight.shieldAt === undefined || isCount(fight.shieldAt, lives)) &&
    (fight.shield === undefined || isCount(fight.shield, shieldPieces)) &&
    (fight.shieldRaised === undefined || typeof fight.shieldRaised === 'boolean') &&
    (foe === undefined || isFoe(foe)) &&
    typeof activeId === 'string' &&
    isRecord(task) &&
    Array.isArray(task.sum) &&
    Array.isArray(task.choices) &&
    task.choices.length === 3 &&
    typeof task.near === 'number' &&
    (typeof task.answer === 'number' || isRecord(task.answer)) &&
    Array.isArray(recent) &&
    recent.every((key) => typeof key === 'string') &&
    (seed === undefined || isCount(seed, seeds - 1));
  if (!known) return null;
  const kept = saved as unknown as Omit<SavedFight, 'fight' | 'seed' | 'foe'> & {
    fight: Omit<Fight, Added> & Partial<Pick<Fight, Added>>;
    seed?: number;
    foe?: Foe;
  };
  return {
    ...kept,
    seed: kept.seed ?? 0,
    foe: kept.foe ?? 'slime',
    fight: {
      ...kept.fight,
      round: kept.fight.round ?? 0,
      threat: kept.fight.threat ?? false,
      rageAt: kept.fight.rageAt ?? rageAt(kept.lives),
      enraged: kept.fight.enraged ?? false,
      combo: kept.fight.combo ?? 0,
      full: kept.lives,
      berries: kept.fight.berries ?? bush.berries,
      hungry: kept.fight.hungry ?? false,
      shieldAt: kept.fight.shieldAt ?? 0,
      shield: kept.fight.shield ?? 0,
      shieldRaised: kept.fight.shieldRaised ?? false,
    },
  };
}

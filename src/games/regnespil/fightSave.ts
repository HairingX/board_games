import type { Profile } from '../../family/family';
import { fullHealth, type Fight } from './battle';
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
}

/** Where the fight of these players is saved: the same whatever order they were chosen in. */
export function fightSaveKey(saveKey: string, players: readonly Profile[]): string {
  return `${saveKey}/kamp/${players
    .map((player) => player.id)
    .sort()
    .join('+')}`;
}

const outcomes: readonly string[] = ['fighting', 'won', 'lost'];
const blows: readonly (string | undefined)[] = [
  'struck',
  'parried',
  'nicked',
  'bumped',
  'dodged',
  'hit',
  undefined,
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isCount = (value: unknown, most: number): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= most;

/**
 * The fight as saved, or null when none is, or what is saved is not a fight this game knows. A
 * fight saved before turns to defend came is upgraded: its turns counted from none, and no
 * blow announced.
 */
export function reviveFight(saved: unknown): SavedFight | null {
  if (!isRecord(saved)) return null;
  const { fight, lives, activeId, task, recent } = saved;
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
    typeof activeId === 'string' &&
    isRecord(task) &&
    Array.isArray(task.sum) &&
    Array.isArray(task.choices) &&
    task.choices.length === 3 &&
    typeof task.near === 'number' &&
    (typeof task.answer === 'number' || isRecord(task.answer)) &&
    Array.isArray(recent) &&
    recent.every((key) => typeof key === 'string');
  if (!known) return null;
  const kept = saved as unknown as Omit<SavedFight, 'fight'> & {
    fight: Omit<Fight, 'round' | 'threat'> & Partial<Pick<Fight, 'round' | 'threat'>>;
  };
  return {
    ...kept,
    fight: { ...kept.fight, round: kept.fight.round ?? 0, threat: kept.fight.threat ?? false },
  };
}

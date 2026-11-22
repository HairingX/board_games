import { seeded } from '../../lib/random';
import { seeds } from './fightSave';
import type { Foe } from './monsters';
import { chestOffers, isTreasure, type Treasure } from './treasures';

/*
 * The adventure's journey through a chapter, as rules apart from how it is shown: a map of
 * steps the heroes walk, each a fight, a chest or the chapter's boss, joined by roads that
 * fork, so the players choose their way; a detour that loops back to the main road, shown by a
 * sign with what lies that way, tempts them with a chest. The journey is saved after every
 * step, so it goes on where it was.
 *
 * The first chapter follows the story (`docs/regnespil-story.md`): the copper dog met on the
 * road, won over, with a chest of its own; then through the forest to the hollow tree, where a
 * giant slime blocks the way down.
 */

/** One step on a chapter's map: where it is, in the map stage's pixels, and where roads lead on. */
export type Step = { x: number; y: number; next: readonly string[] } & (
  | { kind: 'chest' }
  | {
      kind: 'fight' | 'boss';
      /** The monster, and how many times its usual lives it has here. */
      foe: Foe;
      toughness: number;
      /** Whether a chest opens once the fight is won, as the copper dog's does. */
      chest?: boolean;
    }
);

/** What a step on the map holds. */
export type StepKind = Step['kind'];

/** A chapter: its steps, the first, and a sign at a fork telling what lies down a road. */
export interface Chapter {
  steps: Readonly<Record<string, Step>>;
  first: string;
  signs: readonly { x: number; y: number; to: string; shows: StepKind }[];
}

/**
 * The first chapter, "Kobberhunden": the copper dog on the road, then up through the forest to
 * the hollow tree, with a fork where the main road goes straight on and a detour, past a
 * tougher slime, leads to a chest and back to the main road.
 */
export const copperChapter: Chapter = {
  first: 'hund',
  steps: {
    hund: {
      kind: 'boss',
      foe: 'copperDog',
      toughness: 1,
      chest: true,
      x: 72,
      y: 212,
      next: ['sti'],
    },
    sti: { kind: 'fight', foe: 'slime', toughness: 1, x: 72, y: 176, next: ['eng', 'krat'] },
    eng: { kind: 'fight', foe: 'slime', toughness: 1.5, x: 30, y: 132, next: ['lysning'] },
    krat: { kind: 'fight', foe: 'slime', toughness: 2, x: 118, y: 148, next: ['kiste'] },
    kiste: { kind: 'chest', x: 118, y: 108, next: ['lysning'] },
    lysning: { kind: 'fight', foe: 'slime', toughness: 2, x: 72, y: 96, next: ['træet'] },
    træet: { kind: 'boss', foe: 'giantSlime', toughness: 1, x: 72, y: 58, next: [] },
  },
  signs: [{ x: 96, y: 160, to: 'krat', shows: 'chest' }],
};

/** What the journey shows: the film, the fight at its step, a chest, the map, or the end. */
export type Scene = 'film' | 'fight' | 'chest' | 'map' | 'end';
const scenes: readonly Scene[] = ['film', 'fight', 'chest', 'map', 'end'];

export interface Journey {
  /** What the run's fights and chests are drawn from, so it is the same when opened again. */
  seed: number;
  /** The step where the heroes are, and the steps done, in the order they were. */
  at: string;
  done: readonly string[];
  /** The treasures found, in the order they were. */
  treasures: readonly Treasure[];
  scene: Scene;
}

/** A new journey: its film first, then the first step's fight. */
export function startJourney(seed: number, chapter: Chapter = copperChapter): Journey {
  return { seed, at: chapter.first, done: [], treasures: [], scene: 'film' };
}

/** The step the heroes are at. */
export const stepOf = (journey: Journey, chapter: Chapter = copperChapter): Step =>
  chapter.steps[journey.at] as Step;

/** After the film, the first step's fight. */
export function filmSeen(journey: Journey): Journey {
  return { ...journey, scene: 'fight' };
}

/** Where the journey goes once the step the heroes are at is done: its chest, the map or the end. */
function onward(journey: Journey, chapter: Chapter): Scene {
  return stepOf(journey, chapter).next.length === 0 ? 'end' : 'map';
}

/** The fight at the step won: its chest opens, if it has one, or the journey goes on. */
export function fightWon(journey: Journey, chapter: Chapter = copperChapter): Journey {
  const done = [...journey.done, journey.at];
  const step = stepOf(journey, chapter);
  const chest = step.kind !== 'chest' && step.chest === true;
  return { ...journey, done, scene: chest ? 'chest' : onward(journey, chapter) };
}

/** A treasure chosen from the chest at the step, which is done with it. */
export function treasureChosen(
  journey: Journey,
  treasure: Treasure,
  chapter: Chapter = copperChapter,
): Journey {
  const done = journey.done.includes(journey.at) ? journey.done : [...journey.done, journey.at];
  return {
    ...journey,
    done,
    treasures: [...journey.treasures, treasure],
    scene: onward(journey, chapter),
  };
}

/** The steps the heroes can walk to now: those the roads from their step lead to. */
export function ahead(journey: Journey, chapter: Chapter = copperChapter): readonly string[] {
  return journey.scene === 'map' ? stepOf(journey, chapter).next : [];
}

/** The heroes walking on to a step ahead: its fight, or its chest. */
export function walkTo(journey: Journey, to: string, chapter: Chapter = copperChapter): Journey {
  if (!ahead(journey, chapter).includes(to)) return journey;
  const step = chapter.steps[to] as Step;
  return { ...journey, at: to, scene: step.kind === 'chest' ? 'chest' : 'fight' };
}

/** What the chest at the heroes' step offers, the same each time it is opened. */
export function chestAt(journey: Journey): readonly Treasure[] {
  const salt = [...journey.at].reduce((sum, letter) => sum * 31 + letter.charCodeAt(0), 7);
  return chestOffers(journey.treasures, seeded((journey.seed + salt) % seeds));
}

/** The fewest steps left from the heroes' step to the chapter's last, counting it. */
export function stepsLeft(journey: Journey, chapter: Chapter = copperChapter): number {
  const from = (id: string): number => {
    const next = (chapter.steps[id] as Step).next;
    return next.length === 0 ? 0 : 1 + Math.min(...next.map(from));
  };
  return from(journey.at);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** The journey as saved, or null when none is, or what is saved is not one this game knows. */
export function reviveJourney(saved: unknown, chapter: Chapter = copperChapter): Journey | null {
  if (!isRecord(saved)) return null;
  const { seed, at, done, treasures, scene } = saved;
  const isStep = (id: unknown): id is string => typeof id === 'string' && id in chapter.steps;
  const known =
    Number.isInteger(seed) &&
    (seed as number) >= 0 &&
    (seed as number) < seeds &&
    isStep(at) &&
    Array.isArray(done) &&
    done.every(isStep) &&
    Array.isArray(treasures) &&
    treasures.every(isTreasure) &&
    scenes.includes(scene as Scene);
  return known ? (saved as unknown as Journey) : null;
}

/** What the journey shows now, with what it needs. */
export type Screen =
  | { kind: 'film' | 'map' | 'end' }
  | { kind: 'fight'; foe: Foe; toughness: number }
  | { kind: 'chest'; offers: readonly Treasure[] };

/**
 * What the journey shows now: its film, the map or its end; the fight at the heroes' step; or
 * a chest, at a step that is one or after a fight that has one.
 */
export function screenOf(journey: Journey, chapter: Chapter = copperChapter): Screen {
  const step = stepOf(journey, chapter);
  const chest = { kind: 'chest', offers: chestAt(journey) } as const;
  switch (journey.scene) {
    case 'chest':
      return chest;
    case 'fight':
      return step.kind === 'chest'
        ? chest
        : { kind: 'fight', foe: step.foe, toughness: step.toughness };
    default:
      return { kind: journey.scene };
  }
}

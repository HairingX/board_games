import chest from '../../../assets/ninja-adventure/Items/Treasure/BigTreasureChest.png';
import type { Cut, Effect, Figure, Scene, Thing } from '../../lib/scene/scene';
import { clearingSheets } from './clearing';
import type { Hero } from './heroes';
import { ahead, copperChapter, type Chapter, type Journey, type Step } from './journey';
import { dogFrames, type Foe } from './monsters';

/*
 * The journey's map: the forest seen from above, ten tiles by fifteen, from the road at the
 * bottom to the hollow tree at the top, drawn on the puppet theatre's stage, its roads dotted
 * on the ground between the steps, under all that stands there. A monster waits
 * at each step not yet done, a chest at each chest, a flag waves where a monster was beaten
 * and a chest stands open where one was opened; the heroes, with their friend the dog, stand
 * at their step and walk the road to the next.
 */

/** The pictures the map is drawn from. */
export const mapSheets = { ...clearingSheets, chest } as const;

const cut = (x: number, y: number, width: number, height: number): Cut => ({ x, y, width, height });

/** Grass with a leaf or two, as in the clearing, in the floor tiles. */
const grass = [
  [0, 12],
  [1, 12],
  [2, 12],
  [3, 12],
  [2, 11],
] as const;

/** The map's grass, row by row: plain mostly, a leaf here and there, the same every time. */
const ground = Array.from({ length: 15 }, (_, row) =>
  Array.from({ length: 10 }, (_, column) => {
    const leaf = (row * 7 + column * 3) % 11;
    return grass[leaf < grass.length ? leaf : 0] as readonly [number, number];
  }),
);

/** Trees at the map's edges, and bushes, leaving the roads free. */
const trees: readonly Thing[] = [
  { sheet: 'nature', cut: cut(64, 32, 64, 48), x: -44, y: -10 },
  { sheet: 'nature', cut: cut(0, 32, 64, 48), x: 124, y: -14 },
  { sheet: 'nature', cut: cut(0, 32, 64, 48), x: -50, y: 62 },
  { sheet: 'nature', cut: cut(256, 32, 64, 48), x: 138, y: 58 },
  { sheet: 'nature', cut: cut(64, 32, 64, 48), x: -48, y: 170 },
  { sheet: 'nature', cut: cut(0, 32, 64, 48), x: 136, y: 186 },
  { sheet: 'nature', cut: cut(0, 160, 16, 16), x: 50, y: 136 },
  { sheet: 'nature', cut: cut(16, 160, 16, 16), x: 98, y: 120 },
  { sheet: 'nature', cut: cut(0, 176, 16, 16), x: 20, y: 200 },
  { sheet: 'nature', cut: cut(16, 160, 16, 16), x: 110, y: 216 },
];

/** The hollow tree at the top, with the dark hole at its foot. */
const hollowTree: readonly Thing[] = [
  { sheet: 'nature', cut: cut(48, 288, 48, 48), x: 56, y: 0 },
  { sheet: 'nature', cut: cut(112, 208, 16, 16), x: 72, y: 36 },
];

/**
 * The roads' dots, from the floor tiles: white and larger on the roads the heroes can take now,
 * so they stand out; light sand where they walked; earth on the others.
 */
const dots = {
  open: cut(20, 236, 4, 4),
  walked: cut(20, 20, 3, 3),
  ahead: cut(84, 124, 3, 3),
} as const;

/** What a road is to the heroes now: one they can take, one they walked, or one further on. */
export type RoadState = keyof typeof dots;

/**
 * How far apart a road's dots are, in pixels, and how far from the middle of a step they stop,
 * so no road runs over a monster, a chest or the heroes.
 */
const dotting = { apart: 6, clear: 12 } as const;

/** The dots of a road from one step to another, on the ground. */
function roadDots(from: Step, to: Step, state: RoadState): Thing[] {
  const start = { x: from.x + 8, y: from.y + 8 };
  const end = { x: to.x + 8, y: to.y + 8 };
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const room = length - 2 * dotting.clear;
  const count = Math.max(0, Math.floor(room / dotting.apart) + 1);
  // The dots centred between the two ends.
  const first = dotting.clear + (room - (count - 1) * dotting.apart) / 2;
  return Array.from({ length: count }, (_, index) => {
    const share = (first + index * dotting.apart) / length;
    const dot = dots[state];
    return {
      sheet: 'floor',
      cut: dot,
      x: Math.round(start.x + (end.x - start.x) * share - dot.width / 2),
      y: Math.round(start.y + (end.y - start.y) * share - dot.height / 2),
    };
  });
}

/** A chest, shut and open, from its two frames. */
const chests = { shut: cut(0, 0, 16, 14), open: cut(16, 0, 16, 14) } as const;

type Token = Pick<Figure, 'sheet' | 'big' | 'size'> & Partial<Pick<Figure, 'doing'>>;

/**
 * How each monster waits on the map, small enough for it, a boss twice its size; and a tougher
 * one, cross, so the players see what a detour costs.
 */
const tokens: Readonly<Record<Foe, { calm: Token; tough: Token }>> = {
  slime: { calm: { sheet: 'slime' }, tough: { sheet: 'slimeRage', size: 2 } },
  giantSlime: { calm: { sheet: 'slime', size: 3 }, tough: { sheet: 'slimeRage', size: 3 } },
  copperDog: {
    calm: { sheet: 'dog', big: dogFrames, doing: 'standing' },
    tough: { sheet: 'dog', big: dogFrames, doing: 'standing' },
  },
};

/** Whether a step's fight is a tougher one than most: twice the lives or more. */
export const isTough = (step: Step): boolean => step.kind === 'fight' && step.toughness >= 2;

/**
 * Where the heroes stand at a step, beside where its monster was, and their friend the dog at
 * their feet. They are drawn their own size; a pin with the leader's face over them shows
 * where they are (`JourneyMap.tsx`), as drawn twice their size they were too big, the owner
 * found.
 */
export const heroesAt = (step: { x: number; y: number }) => ({ x: step.x - 10, y: step.y + 6 });
const friendAt = (step: { x: number; y: number }) => ({ x: step.x + 4, y: step.y + 12 });

/** Where each hero after the first walks, behind and beside the one in front, in pixels. */
const behind = (index: number) => ({
  x: (index % 2 === 0 ? 1 : -1) * 7 * Math.ceil(index / 2),
  y: 5 * index,
});

/** How fast the heroes walk the road, in pixels a second, and the shortest walk, in seconds. */
export const walking = { speed: 45, least: 0.6 } as const;

/** How long the walk from one step to another takes, in seconds. */
export function walkSeconds(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return Math.max(walking.least, Math.hypot(to.x - from.x, to.y - from.y) / walking.speed);
}

/** The heroes walking from their step to another, from the moment `at`, as long as it takes. */
export interface Walk {
  to: string;
  at: number;
  lasts: number;
}

/** How often a monster the heroes can go to next hops, to say "here", in seconds. */
const beckoning = 1.1;

/**
 * Where the marker over a step the heroes can go to points down at: the top of what stands
 * there, in the middle, as large as it is drawn.
 */
export function markOver(step: Step): { x: number; y: number } {
  if (step.kind === 'chest') return { x: step.x + 8, y: step.y };
  const size = tokens[step.foe][isTough(step) ? 'tough' : 'calm'].size ?? 1;
  return { x: step.x + 8, y: step.y + 16 - 16 * size };
}

/**
 * What stands at a step: its monster, hopping if the heroes can go there next, its chest, or,
 * once done, a flag or an open chest.
 */
function atStep(
  step: Step,
  done: boolean,
  next: boolean,
): { things: Thing[]; figures: Figure[]; effects: Effect[] } {
  const place = { x: step.x, y: step.y };
  if (step.kind === 'chest') {
    return {
      things: [{ sheet: 'chest', cut: done ? chests.open : chests.shut, x: step.x, y: step.y + 2 }],
      figures: [],
      effects: [],
    };
  }
  if (done) {
    // A chest it guarded stands open; a beaten monster leaves a flag waving.
    return step.chest
      ? {
          things: [{ sheet: 'chest', cut: chests.open, x: step.x + 6, y: step.y - 4 }],
          figures: [],
          effects: [],
        }
      : {
          things: [],
          figures: [],
          effects: [
            {
              sheet: 'flag',
              width: 16,
              height: 16,
              frames: 4,
              x: step.x + 6,
              y: step.y - 6,
              at: 0,
              lasts: Number.POSITIVE_INFINITY,
            },
          ],
        };
  }
  const token = tokens[step.foe][isTough(step) ? 'tough' : 'calm'];
  return {
    things: [],
    figures: [
      {
        ...place,
        facing: 'down',
        doing: 'bouncing',
        ...token,
        ...(next ? { acts: [{ kind: 'cheer', at: 0, repeat: beckoning }] } : {}),
      },
    ],
    effects: [],
  };
}

/**
 * The map as it stands on the journey: each step as it is, and the heroes at their
 * step, the first player's hero leading and the others behind, with their friend the dog;
 * walking to another step, if they are.
 */
export function mapScene(
  journey: Journey,
  heroes: readonly Hero[],
  walk?: Walk,
  chapter: Chapter = copperChapter,
): Scene {
  const next = ahead(journey, chapter);
  const parts = Object.entries(chapter.steps).map(([id, step]) =>
    atStep(step, journey.done.includes(id), walk === undefined && next.includes(id)),
  );
  const here = chapter.steps[journey.at] as Step;
  const there = walk ? (chapter.steps[walk.to] as Step) : here;
  // Walking, they set out from where they stood, and step by step come to the next.
  const from = (place: (step: Step) => { x: number; y: number }) =>
    walk
      ? [
          {
            kind: 'step' as const,
            at: walk.at,
            from: { x: place(here).x - place(there).x, y: place(here).y - place(there).y },
            lasts: walk.lasts,
          },
        ]
      : [];
  return {
    columns: 10,
    rows: 15,
    groundSheet: 'floor',
    ground,
    things: [
      ...trees,
      ...hollowTree,
      ...roads(journey, chapter, walk).flatMap((road) => roadDots(road.from, road.to, road.state)),
      ...parts.flatMap((part) => part.things),
    ],
    figures: [
      ...parts.flatMap((part) => part.figures),
      {
        sheet: 'dog',
        ...friendAt(there),
        facing: 'right',
        doing: 'standing',
        big: dogFrames,
        acts: from(friendAt),
      },
      ...heroes.map((hero, index): Figure => {
        const place = (step: Step) => {
          const lead = heroesAt(step);
          return { x: lead.x + behind(index).x, y: lead.y + behind(index).y };
        };
        return {
          sheet: hero,
          ...place(there),
          facing: 'up',
          doing: 'standing',
          acts: from(place),
        };
      }),
    ],
    effects: parts.flatMap((part) => part.effects),
  };
}

/**
 * The roads between the steps, each as it is to the heroes now: those from their step to the
 * steps they can go to next open, unless they are already on their way; those they walked;
 * the others further on.
 */
export function roads(
  journey: Journey,
  chapter: Chapter = copperChapter,
  walk?: Walk,
): readonly { from: Step; to: Step; state: RoadState }[] {
  const walked = new Set(
    journey.done.slice(1).map((id, index) => `${journey.done[index] as string}>${id}`),
  );
  const open = walk === undefined ? ahead(journey, chapter) : [];
  return Object.entries(chapter.steps).flatMap(([id, step]) =>
    step.next.map((to) => ({
      from: step,
      to: chapter.steps[to] as Step,
      state: walked.has(`${id}>${to}`)
        ? 'walked'
        : id === journey.at && open.includes(to)
          ? 'open'
          : 'ahead',
    })),
  );
}

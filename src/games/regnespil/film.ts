import crone from '../../../assets/ninja-adventure/Actor/Character/NinjaMageOrange/SpriteSheet.png';
import croneFace from '../../../assets/ninja-adventure/Actor/Character/NinjaMageOrange/Faceset.png';
import leaf from '../../../assets/ninja-adventure/FX/Particle/Leaf.png';
import rays from '../../../assets/ninja-adventure/FX/Environment/Raylight.png';
import fire from '../../../assets/ninja-adventure/FX/Particle/Fire.png';
import whiteDog from '../../../assets/ninja-adventure/Actor/Animal/DogBlack/SpriteSheetWhite.png';
import goldDog from '../../../assets/ninja-adventure/Actor/Animal/DogYellow/SpriteSheet.png';
import type { Act, Camera, Cut, Effect, Figure, Light, Scene, View } from '../../lib/scene/scene';
import { benchAt, clearingSheets, foeAt, heroAt, slimeAt, type Sign } from './clearing';
import { forest, forestSheets, holeAt, sceneries } from './forest';
import type { Hero } from './heroes';
import { copperDog, copperDogSize, dogFrames } from './monsters';
import type { sounds } from './sounds';

/*
 * The story's films, told in pictures and sound without a word, as the owner decided: short
 * shots on the puppet theatre's stage, the characters acting, babbling in their own voices and
 * showing what they mean in pictures, in a bubble or, as the old woman tells it, in a dialog
 * box with her portrait. The camera cuts to close-ups and pans between who acts, the evening
 * light lies over the forest, and leaves drift through it, as the owner asked for more to be
 * made of the pack's art. The film before the first chapter draws the players in: the heroes
 * meet an old woman, who shows them, in pictures, a hollow tree with a tinderbox's spark down
 * in it, and three dogs; then the first dog, the copper dog, bursts onto the road, and
 * the first fight begins. The film at the chapter's end leads the heroes down into the hollow
 * tree, where eyes glint in the dark. Each shot lasts seconds, and the film can be skipped.
 */

/** The pictures the films are drawn from, beside the clearing's. */
export const filmSheets = { ...clearingSheets, crone, leaf, rays } as const;

/**
 * A picture in a bubble: a cut of an image, by its address, and the whole image's size; or an
 * arrow, drawn plainly, pointing on from one picture to the next, or down.
 */
export type Picture =
  { url: string; cut: Cut; image: { width: number; height: number } } | { arrow: 'down' | 'on' };

/**
 * Pictures shown from `at` seconds into the shot for `lasts`, in a dialog box at the foot of the
 * screen with the portrait of who `speaks`, as games tell what is said.
 */
export interface Bubble {
  at: number;
  lasts: number;
  pictures: readonly Picture[];
  speaks: string;
}

/** A sound or a voice, `after` seconds into the shot. */
export type FilmCue =
  | { sound: keyof typeof sounds; after: number }
  | { voice: 'hero' | 'crone' | 'dog'; syllables: number; after: number };

/** What each shot shows, told in words to those who cannot see it (`film` in `text.ts`). */
export type Telling = 'road' | 'quest' | 'dogs' | 'bark' | 'dog' | 'tree' | 'down';

/** One shot of a film. */
export interface Shot {
  /** How long it lasts, in seconds. */
  seconds: number;
  /** Its stage from the moment `at` it begins, on the page's clock, with the players' heroes. */
  scene: (at: number, heroes: readonly Hero[]) => Scene;
  bubbles: readonly Bubble[];
  cues: readonly FilmCue[];
  tells: Telling;
}

const cut = (x: number, y: number, width: number, height: number): Cut => ({ x, y, width, height });
const size = (width: number, height: number) => ({ width, height });

/** The pictures in the bubbles. */
const pictures = {
  hollow: { url: forestSheets.nature, cut: cut(112, 208, 16, 16), image: size(384, 336) },
  down: { arrow: 'down' },
  flame: { url: fire, cut: cut(24, 0, 8, 12), image: size(96, 12) },
  copper: { url: clearingSheets.dog, cut: cut(0, 0, 18, 16), image: size(36, 16) },
  silver: { url: whiteDog, cut: cut(0, 0, 18, 17), image: size(36, 17) },
  gold: { url: goldDog, cut: cut(0, 0, 21, 17), image: size(42, 17) },
} satisfies Record<string, Picture>;

/** Where the old woman stands, facing the heroes. */
const croneAt = slimeAt;

/** A figure of the film standing at its place, facing `facing`, doing what it is given. */
const figure = (
  sheet: string,
  at: { x: number; y: number },
  facing: Figure['facing'],
  doing: Partial<Figure> = {},
): Figure => ({ sheet, ...at, facing, doing: 'standing', ...doing });

/** A sign shown over a figure at `at`. */
const sign = (sheet: Sign, at: number) => ({ sign: { sheet, at } });

/**
 * The heroes in a row, the first in front and the others behind, as in a fight, facing right,
 * each doing what `acts` gives them (the `index`th hero), with a sign if `signs` gives one.
 */
function heroes(
  party: readonly Hero[],
  acts: (index: number) => readonly Act[],
  signs: (index: number) => Partial<Figure>,
  place: { x: number; y: number } = heroAt,
): Figure[] {
  const behind = benchAt(party.length - 1).map(({ x, y }) => ({
    x: x - heroAt.x + place.x,
    y: y - heroAt.y + place.y,
  }));
  return party.map((hero, index) =>
    figure(hero, index === 0 ? place : (behind[index - 1] as { x: number; y: number }), 'right', {
      acts: acts(index),
      ...signs(index),
    }),
  );
}

/** The copper dog as it stands in its fight, facing the heroes. */
const dogAt = foeAt(copperDog);
const dog = (doing: Partial<Figure>): Figure =>
  figure('dog', dogAt, 'left', {
    big: dogFrames,
    size: copperDogSize,
    doing: 'standing',
    ...doing,
  });

/**
 * Leaves drifting through the forest from the right, tumbling as they go, over and over, each
 * on its own path and time, so the forest is never quite still.
 */
const leaves: readonly Effect[] = [
  { y: 6, seconds: 7, start: 0 },
  { y: 40, seconds: 9, start: 3 },
  { y: 70, seconds: 8, start: 5.5 },
  { y: 24, seconds: 10, start: 7 },
].map(({ y, seconds, start }) => ({
  sheet: 'leaf',
  width: 12,
  height: 7,
  frames: 6,
  x: 168,
  y,
  at: -start,
  cycle: seconds,
  arc: { dx: -190, dy: 60, height: 0, seconds },
  float: { height: 6, every: 1.6 },
}));

/** How much of the sun's rays shows: a faint light, letting all behind it through. */
const rayLight = 0.18;

/** Rays of the low evening sun falling through the trees. */
const sunRays: readonly Effect[] = [
  { x: 8, y: -10 },
  { x: 84, y: -4 },
].map((place) => ({
  sheet: 'rays',
  width: 72,
  height: 102,
  frames: 1,
  ...place,
  at: 0,
  lasts: Number.POSITIVE_INFINITY,
  opacity: rayLight,
}));

/** The whole stage, and close-ups: on the old woman, the heroes, the two together, the dog. */
const views = {
  whole: { x: 80, y: 72, zoom: 1 },
  crone: { x: 108, y: 92, zoom: 3 },
  hero: { x: 52, y: 86, zoom: 3 },
  both: { x: 78, y: 88, zoom: 2 },
  dog: { x: 116, y: 84, zoom: 2 },
} satisfies Record<string, View>;

/** A camera starting on one view, and moving to others: when, where, and how long it takes. */
const shoot = (
  start: View,
  moves: readonly { at: number; to: View; seconds: number }[] = [],
): Camera => ({ start, moves });

/** The clearing at evening with the film's figures and effects, as the camera shows it. */
const stage = (
  figures: readonly Figure[],
  effects: readonly Effect[] = [],
  camera: Camera = shoot(views.whole),
  light: Light = 'evening',
): Scene => ({
  ...forest,
  figures,
  effects: [...sunRays, ...effects, ...leaves],
  camera,
  light,
});

/** How far the heroes walk in from, and how long they take. */
const walkIn = { from: -80, seconds: 3 } as const;

/**
 * The film before the first chapter: under half a minute. "One, two! One, two!" the heroes
 * march along the road, as the tale begins; an old woman in a pointed hat shows them a hollow
 * tree with a spark down in it and three dogs, each bigger; then a bark, she hurries
 * off, and the copper dog bursts onto the road, grumpy, and the heroes stand ready.
 */
export const prologue: readonly Shot[] = [
  {
    seconds: 5.5,
    tells: 'road',
    scene: (at, party) =>
      stage(
        [
          ...heroes(
            party,
            () => [{ kind: 'step', at, from: { x: walkIn.from, y: 0 }, lasts: walkIn.seconds }],
            (index) => (index === 0 ? sign('question', at + 3.3) : {}),
          ),
          figure('crone', croneAt, 'left', {
            acts: [{ kind: 'cheer', at: at + 3.8 }],
            ...sign('heart', at + 4),
          }),
        ],
        [],
        shoot(views.whole, [{ at: at + 3.2, to: views.both, seconds: 1.2 }]),
      ),
    bubbles: [],
    cues: [
      { voice: 'hero', syllables: 2, after: 0.4 },
      { voice: 'hero', syllables: 2, after: 1.4 },
      { voice: 'hero', syllables: 2, after: 2.4 },
      { voice: 'crone', syllables: 4, after: 3.8 },
    ],
  },
  {
    seconds: 5,
    tells: 'quest',
    scene: (at, party) =>
      stage(
        [
          ...heroes(
            party,
            (index) => [
              { kind: 'cheer', at: at + 3.4 + index * 0.15 },
              { kind: 'cheer', at: at + 4 + index * 0.15 },
            ],
            (index) => (index === 0 ? sign('star', at + 3.1) : {}),
          ),
          figure('crone', croneAt, 'left'),
        ],
        [],
        shoot(views.crone, [{ at: at + 3, to: views.hero, seconds: 0.4 }]),
      ),
    bubbles: [
      {
        at: 0.3,
        lasts: 2.7,
        speaks: croneFace,
        pictures: [pictures.hollow, pictures.down, pictures.flame],
      },
    ],
    cues: [
      { voice: 'crone', syllables: 6, after: 0.2 },
      { voice: 'hero', syllables: 4, after: 3.4 },
    ],
  },
  {
    seconds: 7,
    tells: 'dogs',
    scene: (at, party) =>
      stage(
        [
          ...heroes(
            party,
            () => [{ kind: 'charge', at: at + 2.2, reach: -6 }],
            () => sign('worried', at + 2),
          ),
          figure('crone', croneAt, 'left', {
            acts: [{ kind: 'cheer', at: at + 4.4 }],
            ...sign('heart', at + 5),
          }),
        ],
        [],
        shoot(views.crone, [
          { at: at + 1.9, to: views.hero, seconds: 0.3 },
          { at: at + 4, to: views.both, seconds: 0.6 },
        ]),
      ),
    bubbles: [
      {
        at: 0.4,
        lasts: 3.6,
        speaks: croneFace,
        pictures: [pictures.copper, pictures.silver, pictures.gold],
      },
    ],
    cues: [
      { voice: 'crone', syllables: 6, after: 0.2 },
      { voice: 'hero', syllables: 4, after: 2.2 },
      { voice: 'crone', syllables: 3, after: 4.4 },
    ],
  },
  {
    seconds: 1.6,
    tells: 'bark',
    scene: (at, party) =>
      stage([
        ...heroes(
          party,
          () => [],
          (index) => (index === 0 ? sign('alert', at + 0.2) : {}),
        ),
        figure('crone', croneAt, 'left', {
          acts: [{ kind: 'approach', at: at + 0.4, reach: -80, lasts: 1 }],
          ...sign('alert', at + 0.1),
        }),
      ]),
    bubbles: [],
    cues: [
      { sound: 'bark', after: 0.1 },
      { voice: 'crone', syllables: 3, after: 0.3 },
    ],
  },
  {
    seconds: 6.5,
    tells: 'dog',
    scene: (at, party) =>
      stage(
        [
          ...heroes(
            party,
            (index) => (index === 0 ? [{ kind: 'attack', at: at + 3.2 }] : []),
            (index) => sign('determined', at + 3 + index * 0.2),
          ),
          dog({
            acts: [
              { kind: 'step', at, from: { x: 70, y: 0 }, lasts: 0.8 },
              { kind: 'swell', at: at + 1.3 },
              { kind: 'leap', at: at + 4.4 },
            ],
            ...sign('angry', at + 1),
          }),
        ],
        [],
        shoot(views.whole, [
          { at: at + 0.9, to: views.dog, seconds: 0.4 },
          { at: at + 2.8, to: views.whole, seconds: 0.6 },
        ]),
      ),
    bubbles: [],
    cues: [
      { sound: 'bark', after: 0.6 },
      { voice: 'dog', syllables: 4, after: 0.9 },
      { voice: 'hero', syllables: 2, after: 3.2 },
      { voice: 'dog', syllables: 6, after: 4.2 },
    ],
  },
];

/** The clearing with the hollow tree in it, at nightfall, as the camera shows it. */
const atTree = (figures: readonly Figure[], effects: readonly Effect[], camera: Camera): Scene => ({
  ...stage(figures, effects, camera, 'night'),
  things: sceneries.tree,
});

/** Close on the hole at the hollow tree's foot. */
const onHole: View = { x: holeAt.x + 8, y: holeAt.y + 10, zoom: 3 };

/** The dog as the heroes' friend, its own size, by the hole. */
const friend = (doing: Partial<Figure>): Figure =>
  figure('dog', { x: holeAt.x - 2, y: holeAt.y + 20 }, 'up', {
    big: dogFrames,
    doing: 'standing',
    ...doing,
  });

/** Eyes glinting in the dark of the hole: a spark each, over and over. */
const eyes = (at: number): readonly Effect[] =>
  [holeAt.x + 2, holeAt.x + 7].map((x) => ({
    sheet: 'spark',
    width: 10,
    height: 8,
    frames: 7,
    x,
    y: holeAt.y + 4,
    at,
    lasts: 3,
  }));

/** The heroes' place before the hole, as they make ready to jump. */
const byHole = { x: holeAt.x - 18, y: holeAt.y + 4 };

/**
 * The film at the chapter's end: the heroes and their friend the dog come to the hollow tree;
 * the dog sniffs at the hole and barks, and eyes glint down in the dark; the heroes steel
 * themselves and jump down, one after another, and the dog after them: to be continued.
 */
export const epilogue: readonly Shot[] = [
  {
    seconds: 6.5,
    tells: 'tree',
    scene: (at, party) =>
      atTree(
        [
          ...heroes(
            party,
            () => [{ kind: 'step', at, from: { x: walkIn.from, y: 0 }, lasts: walkIn.seconds }],
            (index) => (index === 0 ? sign('alert', at + 4.8) : {}),
            byHole,
          ),
          friend({
            acts: [
              { kind: 'step', at, from: { x: -100, y: 0 }, lasts: 2.6 },
              { kind: 'cheer', at: at + 3.2 },
              { kind: 'cheer', at: at + 3.7 },
            ],
            ...sign('worried', at + 5),
          }),
        ],
        eyes(at + 4.5),
        shoot(views.whole, [{ at: at + 4.2, to: onHole, seconds: 0.5 }]),
      ),
    bubbles: [],
    cues: [
      { voice: 'dog', syllables: 3, after: 3.2 },
      { sound: 'bark', after: 4 },
      { voice: 'hero', syllables: 3, after: 4.8 },
    ],
  },
  {
    seconds: 5.5,
    tells: 'down',
    scene: (at, party) =>
      atTree(
        [
          ...heroes(
            party,
            (index) => [
              { kind: 'leap', at: at + 2 + index * 0.4 },
              { kind: 'vanish', at: at + 2.3 + index * 0.4 },
            ],
            (index) => sign('determined', at + 0.3 + index * 0.2),
            byHole,
          ),
          friend({
            acts: [
              { kind: 'leap', at: at + 3.4 },
              { kind: 'vanish', at: at + 3.7 },
            ],
            ...sign('heart', at + 1),
          }),
        ],
        eyes(at),
        shoot({ ...onHole, zoom: 2 }),
      ),
    bubbles: [],
    cues: [
      { voice: 'hero', syllables: 2, after: 0.4 },
      { sound: 'whoosh', after: 2 },
      { sound: 'whoosh', after: 3.4 },
    ],
  },
];

/** How long a film lasts, in seconds. */
export const filmLength = (shots: readonly Shot[]) =>
  shots.reduce((sum, shot) => sum + shot.seconds, 0);

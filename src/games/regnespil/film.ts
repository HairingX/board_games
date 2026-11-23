import crone from '../../../assets/ninja-adventure/Actor/Character/NinjaMageOrange/SpriteSheet.png';
import croneFace from '../../../assets/ninja-adventure/Actor/Character/NinjaMageOrange/Faceset.png';
import leaf from '../../../assets/ninja-adventure/FX/Particle/Leaf.png';
import rays from '../../../assets/ninja-adventure/FX/Environment/Raylight.png';
import fire from '../../../assets/ninja-adventure/FX/Particle/Fire.png';
import whiteDog from '../../../assets/ninja-adventure/Actor/Animal/DogBlack/SpriteSheetWhite.png';
import goldDog from '../../../assets/ninja-adventure/Actor/Animal/DogYellow/SpriteSheet.png';
import type { Act, Camera, Cut, Effect, Figure, Light, Scene, View } from '../../lib/scene/scene';
import { benchAt, clearingSheets, foeAt, heroAt, puff, slimeAt, type Sign } from './clearing';
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

/** A part of a picture: a cut of an image, by its address, the whole image's size, and where. */
export interface Part {
  url: string;
  cut: Cut;
  image: { width: number; height: number };
  x: number;
  y: number;
}

/**
 * A picture in a bubble: parts of images laid over one another in a box of its own size (as a
 * tree with a hole at its foot), drawn `zoom` times larger if it says, and as a dark shape if
 * it is `dark`, as what is still to come; or an arrow, drawn plainly, pointing on or down.
 */
export type Picture =
  | {
      parts: readonly Part[];
      width: number;
      height: number;
      zoom?: number;
      dark?: boolean;
    }
  | { arrow: 'down' | 'on' };

/**
 * Pictures shown from `at` seconds into the shot for `lasts`, in a dialog box at the foot of the
 * screen with the portrait of who `speaks`, as games tell what is said; one after another,
 * `reveal` seconds apart, if it says, so a child reads them in turn.
 */
export interface Bubble {
  at: number;
  lasts: number;
  pictures: readonly Picture[];
  speaks: string;
  reveal?: number;
}

/** A sound or a voice, `after` seconds into the shot. */
export type FilmCue =
  | { sound: keyof typeof sounds; after: number }
  | { voice: 'hero' | 'crone' | 'dog'; syllables: number; after: number };

/** What each shot shows, told in words to those who cannot see it (`film` in `text.ts`). */
export type Telling = 'road' | 'quest' | 'dogs' | 'treats' | 'bark' | 'dog' | 'tree' | 'down';

/** One shot of a film. */
export interface Shot {
  /** How long it lasts, in seconds. */
  seconds: number;
  /** Its stage from the moment `at` it begins, on the page's clock, with the players' heroes. */
  scene: (at: number, heroes: readonly Hero[]) => Scene;
  bubbles: readonly Bubble[];
  cues: readonly FilmCue[];
  /** When the stage shakes a little, as at a sudden bark, in seconds into the shot. */
  shake?: number;
  tells: Telling;
}

const cut = (x: number, y: number, width: number, height: number): Cut => ({ x, y, width, height });
const size = (width: number, height: number) => ({ width, height });

/** A picture of one cut of an image, its own size or `zoom` times it, dark if `dark`. */
const single = (
  url: string,
  part: Cut,
  image: { width: number; height: number },
  look: { zoom?: number; dark?: boolean } = {},
): Picture => ({
  parts: [{ url, cut: part, image, x: 0, y: 0 }],
  width: part.width,
  height: part.height,
  ...look,
});

const nature = size(384, 336);
const dogs = {
  copper: [clearingSheets.dog, cut(0, 0, 18, 16), size(36, 16)],
  silver: [whiteDog, cut(0, 0, 18, 17), size(36, 17)],
  gold: [goldDog, cut(0, 0, 21, 17), size(42, 17)],
} as const;

/**
 * The pictures in the bubbles: the hollow tree, as it stands in the forest with the hole at its
 * foot; the tinderbox's flame; the three dogs, each bigger than the last, the two still to
 * come as dark shapes, as the chapter's end shows them; and a treat that wins a dog's heart.
 */
const pictures = {
  hollow: {
    parts: [
      { url: forestSheets.nature, cut: cut(48, 288, 48, 48), image: nature, x: 0, y: 0 },
      { url: forestSheets.nature, cut: cut(112, 208, 16, 16), image: nature, x: 16, y: 40 },
    ],
    width: 48,
    height: 56,
  },
  down: { arrow: 'down' },
  on: { arrow: 'on' },
  flame: single(fire, cut(24, 0, 8, 12), size(96, 12), { zoom: 3 }),
  copper: single(...dogs.copper),
  copperBig: single(...dogs.copper, { zoom: 2 }),
  silver: single(...dogs.silver, { zoom: 3, dark: true }),
  gold: single(...dogs.gold, { zoom: 4, dark: true }),
  bone: single(clearingSheets.bone, cut(0, 0, 7, 12), size(7, 12)),
  heart: single(clearingSheets.heart, cut(0, 0, 14, 13), size(14, 13)),
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
 * each doing what `acts` gives them (the `index`th hero, standing at `spot`), with a sign if
 * `signs` gives one.
 */
function heroes(
  party: readonly Hero[],
  acts: (index: number, spot: { x: number; y: number }) => readonly Act[],
  signs: (index: number) => Partial<Figure>,
  place: { x: number; y: number } = heroAt,
): Figure[] {
  const behind = benchAt(party.length - 1).map(({ x, y }) => ({
    x: x - heroAt.x + place.x,
    y: y - heroAt.y + place.y,
  }));
  return party.map((hero, index) => {
    const spot = index === 0 ? place : (behind[index - 1] as { x: number; y: number });
    return figure(hero, spot, 'right', { acts: acts(index, spot), ...signs(index) });
  });
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

/**
 * The whole stage, and close-ups: each figure on its own third, looking across the cut, so
 * there is room the way they look and screen direction holds, the heroes on the left facing
 * right, the old woman and the dog on the right facing left; the two together; the dog.
 */
const views = {
  whole: { x: 80, y: 72, zoom: 1 },
  crone: { x: 99, y: 94, zoom: 3 },
  hero: { x: 61, y: 80, zoom: 3 },
  both: { x: 78, y: 86, zoom: 2 },
  dog: { x: 112, y: 76, zoom: 2 },
} satisfies Record<string, View>;

/**
 * A camera starting on one view, and moving or cutting to others: when, where, and how long
 * it takes; a cut takes no time. Close-ups are cut to, not panned between, which smears the
 * pixels; the camera moves only where something leads it, as pushing in on who meet.
 */
const shoot = (
  start: View,
  moves: readonly { at: number; to: View; seconds?: number }[] = [],
): Camera => ({ start, moves: moves.map(({ at, to, seconds = 0 }) => ({ at, to, seconds })) });

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

/** How far the heroes walk in from, and how long they take: in sight from the first moment. */
const walkIn = { from: -56, seconds: 2.4 } as const;

/** The treat the hero holds up over their head, from `at` to the shot's end. */
const boneHeld = (at: number): Effect => ({
  sheet: 'bone',
  width: 7,
  height: 12,
  frames: 1,
  x: heroAt.x + 16,
  y: heroAt.y - 6,
  at,
  lasts: Number.POSITIVE_INFINITY,
  float: { height: 1, every: 0.8 },
});

/** The old woman's puff of smoke as she vanishes, where she stands. */
const croneGone = (at: number): Effect => ({ ...puff(at), x: croneAt.x - 8, y: croneAt.y - 12 });

/** A tap as each picture of a bubble pops up in turn. */
const pops = (bubble: Bubble): FilmCue[] =>
  bubble.pictures.flatMap((picture, index) =>
    'arrow' in picture
      ? []
      : [{ sound: 'choose' as const, after: bubble.at + index * (bubble.reveal ?? 0) }],
  );

/** What the old woman shows: the hollow tree, down into its hole, the tinderbox's flame. */
const questBubble: Bubble = {
  at: 0.3,
  lasts: 3.9,
  speaks: croneFace,
  reveal: 0.8,
  pictures: [pictures.hollow, pictures.down, pictures.flame],
};

/** The three dogs, one after another, each bigger than the last. */
const dogBubbles: readonly Bubble[] = [pictures.copperBig, pictures.silver, pictures.gold].map(
  (picture, index) => ({
    at: 0.3 + index * 1.1,
    lasts: index === 2 ? 1.2 : 1.1,
    speaks: croneFace,
    pictures: [picture],
  }),
);

/** How to win a dog over: a dog, a treat, and then a heart. */
const treatBubble: Bubble = {
  at: 0.3,
  lasts: 3.4,
  speaks: croneFace,
  reveal: 0.7,
  pictures: [pictures.copper, pictures.bone, pictures.on, pictures.heart],
};

/**
 * The film before the first chapter: about half a minute. "One, two! One, two!" the heroes
 * march along the road, as the tale begins, and meet an old woman in a pointed hat. In
 * pictures she shows them a hollow tree with the tinderbox's flame down in it, and the three
 * dogs that keep it, each bigger than the last; the hero is worried, and she shows how a dog
 * is won over: with a treat, it loves you. The hero holds a treat up, glad; she waves and
 * vanishes in a puff. A moment's quiet, a bark, and the copper dog bursts onto the road,
 * grumpy; the hero offers it the treat, it wonders, and growls: the fight to win it over begins.
 */
export const prologue: readonly Shot[] = [
  {
    seconds: 5.4,
    tells: 'road',
    scene: (at, party) =>
      stage(
        [
          ...heroes(
            party,
            () => [{ kind: 'step', at, from: { x: walkIn.from, y: 0 }, lasts: walkIn.seconds }],
            (index) => (index === 0 ? sign('question', at + 2.6) : {}),
          ),
          figure('crone', croneAt, 'left', {
            acts: [{ kind: 'cheer', at: at + 4.2 }],
            ...sign('heart', at + 4.3),
          }),
        ],
        [],
        shoot(views.whole, [{ at: at + 3, to: views.both, seconds: 1 }]),
      ),
    bubbles: [],
    cues: [
      { voice: 'hero', syllables: 2, after: 0.2 },
      { voice: 'hero', syllables: 2, after: 1 },
      { voice: 'hero', syllables: 2, after: 1.8 },
      { voice: 'crone', syllables: 4, after: 4.2 },
    ],
  },
  {
    seconds: 6,
    tells: 'quest',
    scene: (at, party) =>
      stage(
        [
          ...heroes(
            party,
            (index) => [
              { kind: 'cheer', at: at + 4.6 + index * 0.15 },
              { kind: 'cheer', at: at + 5.2 + index * 0.15 },
            ],
            (index) => (index === 0 ? sign('star', at + 4.4) : {}),
          ),
          figure('crone', croneAt, 'left'),
        ],
        [],
        shoot(views.crone, [{ at: at + 4.3, to: views.hero }]),
      ),
    bubbles: [questBubble],
    cues: [
      { voice: 'crone', syllables: 4, after: 0.2 },
      { voice: 'crone', syllables: 3, after: 1.9 },
      ...pops(questBubble),
      { voice: 'hero', syllables: 4, after: 4.6 },
    ],
  },
  {
    seconds: 5,
    tells: 'dogs',
    scene: (at, party) =>
      stage(
        [
          ...heroes(
            party,
            () => [{ kind: 'charge', at: at + 3.9, reach: -6 }],
            () => sign('worried', at + 3.75),
          ),
          figure('crone', croneAt, 'left'),
        ],
        [],
        shoot(views.crone, [{ at: at + 3.7, to: views.hero }]),
      ),
    bubbles: dogBubbles,
    cues: [
      ...dogBubbles.flatMap((bubble) => [
        { voice: 'crone' as const, syllables: 2, after: bubble.at },
        ...pops(bubble),
      ]),
      { voice: 'hero', syllables: 3, after: 3.9 },
    ],
  },
  {
    seconds: 6.4,
    tells: 'treats',
    scene: (at, party) =>
      stage(
        [
          ...heroes(
            party,
            (index) => [{ kind: 'cheer', at: at + 4 + index * 0.15 }],
            (index) => (index === 0 ? sign('star', at + 3.9) : {}),
          ),
          figure('crone', croneAt, 'left', {
            acts: [
              { kind: 'cheer', at: at + 5 },
              { kind: 'vanish', at: at + 5.6 },
            ],
            ...sign('heart', at + 5),
          }),
        ],
        [boneHeld(at + 3.9), croneGone(at + 5.5)],
        shoot(views.crone, [
          { at: at + 3.8, to: views.hero },
          { at: at + 4.9, to: views.both },
        ]),
      ),
    bubbles: [treatBubble],
    cues: [
      { voice: 'crone', syllables: 5, after: 0.2 },
      ...pops(treatBubble).slice(0, -1),
      { sound: 'treat', after: 2.4 },
      { voice: 'hero', syllables: 3, after: 4 },
      { voice: 'crone', syllables: 3, after: 5 },
      { sound: 'gather', after: 5.5 },
    ],
  },
  {
    seconds: 1.8,
    tells: 'bark',
    scene: (at, party) =>
      stage(
        heroes(
          party,
          () => [],
          (index) => sign('gasp', at + 0.75 + index * 0.05),
        ),
        [boneHeld(at)],
        shoot(views.hero),
      ),
    bubbles: [],
    // A moment's quiet, and then the bark.
    cues: [{ sound: 'bark', after: 0.6 }],
    shake: 0.6,
  },
  {
    seconds: 4.8,
    tells: 'dog',
    scene: (at, party) =>
      stage(
        [
          ...heroes(
            party,
            (index) => [{ kind: 'cheer', at: at + 2.6 + index * 0.15 }],
            (index) => sign('heart', at + 2.5 + index * 0.1),
          ),
          dog({
            acts: [
              { kind: 'step', at, from: { x: 70, y: 0 }, lasts: 0.8 },
              { kind: 'swell', at: at + 1.1 },
              { kind: 'charge', at: at + 3.9, reach: 10 },
            ],
            sign: { sheet: 'grumpy', at: at + 1 },
          }),
        ],
        [boneHeld(at)],
        shoot(views.whole, [
          { at: at + 0.9, to: views.dog },
          { at: at + 2.4, to: views.hero },
          { at: at + 3.3, to: views.whole },
        ]),
      ),
    bubbles: [],
    cues: [
      { sound: 'bark', after: 0.4 },
      { voice: 'dog', syllables: 4, after: 1.1 },
      { voice: 'hero', syllables: 2, after: 2.5 },
      { voice: 'dog', syllables: 6, after: 3.9 },
    ],
    shake: 0.4,
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
const friendAt = { x: holeAt.x - 2, y: holeAt.y + 20 };
const friend = (doing: Partial<Figure>): Figure =>
  figure('dog', friendAt, 'up', {
    big: dogFrames,
    doing: 'standing',
    ...doing,
  });

/** Eyes glinting in the dark of the hole: a spark each, over and over. */
const eyes = (at: number, lasts = 3): readonly Effect[] =>
  [holeAt.x + 2, holeAt.x + 7].map((x) => ({
    sheet: 'spark',
    width: 10,
    height: 8,
    frames: 7,
    x,
    y: holeAt.y + 4,
    at,
    lasts,
  }));

/** The heroes' place before the hole, as they make ready to jump, and the view on them. */
const byHole = { x: holeAt.x - 18, y: holeAt.y + 4 };
const onParty: View = { x: holeAt.x - 4, y: holeAt.y + 14, zoom: 2 };

/** How long after one another the heroes jump, and when the first does. */
const diveApart = 0.25;
const firstDive = 1.4;

/**
 * The film at the chapter's end: the heroes and their friend the dog come to the hollow tree;
 * the dog barks at the hole, the camera goes close, and eyes glint down in the dark; the
 * heroes start, then steel themselves and jump down, one after another, and the dog after
 * them; the hole is left, the eyes glinting: to be continued.
 */
export const epilogue: readonly Shot[] = [
  {
    seconds: 6.4,
    tells: 'tree',
    scene: (at, party) =>
      atTree(
        [
          ...heroes(
            party,
            () => [{ kind: 'step', at, from: { x: walkIn.from, y: 0 }, lasts: walkIn.seconds }],
            (index) => sign('gasp', at + 5.3 + index * 0.05),
            byHole,
          ),
          friend({
            acts: [
              { kind: 'step', at, from: { x: -100, y: 0 }, lasts: 2.6 },
              { kind: 'cheer', at: at + 3.2 },
              { kind: 'cheer', at: at + 3.7 },
            ],
            ...sign('worried', at + 5.35),
          }),
        ],
        eyes(at + 4.7),
        shoot(views.whole, [
          { at: at + 4, to: onHole, seconds: 0.5 },
          { at: at + 5.2, to: onParty },
        ]),
      ),
    bubbles: [],
    cues: [
      { voice: 'dog', syllables: 3, after: 3.2 },
      { sound: 'bark', after: 3.9 },
      { voice: 'hero', syllables: 3, after: 5.3 },
    ],
  },
  {
    seconds: 5.4,
    tells: 'down',
    scene: (at, party) =>
      atTree(
        [
          ...heroes(
            party,
            (index, spot) => [
              {
                kind: 'dive',
                at: at + firstDive + index * diveApart,
                to: { x: holeAt.x - spot.x, y: holeAt.y - spot.y },
              },
            ],
            (index) => sign('determined', at + 0.3 + index * 0.2),
            byHole,
          ),
          friend({
            acts: [
              {
                kind: 'dive',
                at: at + firstDive + party.length * diveApart,
                to: { x: holeAt.x - friendAt.x, y: holeAt.y - friendAt.y },
              },
            ],
            ...sign('heart', at + 0.6),
          }),
        ],
        eyes(at, 6),
        shoot(onParty),
      ),
    bubbles: [],
    cues: [
      { voice: 'hero', syllables: 2, after: 0.4 },
      { sound: 'whoosh', after: firstDive },
      { sound: 'whoosh', after: 3 },
    ],
  },
];

/** How long a film lasts, in seconds. */
export const filmLength = (shots: readonly Shot[]) =>
  shots.reduce((sum, shot) => sum + shot.seconds, 0);

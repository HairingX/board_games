import slime from '../../../assets/ninja-adventure/Actor/Monster/Slime/Slime.png';
import slimeRage from '../../../assets/ninja-adventure/Actor/Monster/Slime3/Slime3.png';
import angry from '../../../assets/ninja-adventure/Ui/Emote/emote4.png';
import smoke from '../../../assets/ninja-adventure/FX/Smoke/Smoke/SpriteSheet.png';
import slash from '../../../assets/ninja-adventure/FX/Slash/SpriteSheetSlash01.png';
import dizzy from '../../../assets/ninja-adventure/Ui/Emote/emote3.png';
import alert from '../../../assets/ninja-adventure/Ui/Emote/emote22.png';
import sleepy from '../../../assets/ninja-adventure/Ui/Emote/emote28.png';
import heart from '../../../assets/ninja-adventure/Ui/Emote/emote27.png';
import star from '../../../assets/ninja-adventure/Ui/Emote/emote29.png';
import coin from '../../../assets/ninja-adventure/Items/Treasure/Coin2.png';
import shield from '../../../assets/ninja-adventure/FX/Magic/Shield/SpriteSheetBlue.png';
import cross from '../../../assets/ninja-adventure/FX/Attack/CutX/SpriteSheet.png';
import slimeball from '../../../assets/ninja-adventure/FX/Projectile/EnergyBall.png';
import splash from '../../../assets/ninja-adventure/FX/Elemental/Water/SpriteSheet.png';
import pebble from '../../../assets/ninja-adventure/FX/Projectile/SpriteSheetRock.png';
import grass from '../../../assets/ninja-adventure/FX/Particle/Grass.png';
import lance from '../../../assets/ninja-adventure/Items/Weapons/Lance/Sprite.png';
import cup from '../../../assets/ninja-adventure/Items/Treasure/GoldCup.png';
import ring from '../../../assets/ninja-adventure/FX/Magic/Circle/SpriteSheetSpark.png';
import sparkle from '../../../assets/ninja-adventure/FX/Magic/Spark/SpriteSheet.png';
import type { Act, Cut, Effect, Facing, Scene } from '../../lib/scene/scene';
import { motionTokens } from '../../ui/motion';
import { forest, forestSheets } from './forest';
import { heroSheets, type Hero } from './heroes';

/**
 * The pictures of a fight in the clearing: the forest's, the slime's, calm and enraged (the
 * same blue slime with a cross face), effects and signs.
 */
export const clearingSheets = {
  ...forestSheets,
  ...heroSheets,
  slime,
  slimeRage,
  angry,
  slash,
  smoke,
  alert,
  dizzy,
  sleepy,
  star,
  heart,
  coin,
  shield,
  cross,
  slimeball,
  splash,
  pebble,
  grass,
  lance,
  cup,
  ring,
  sparkle,
} as const;

export type Sign = 'alert' | 'dizzy' | 'sleepy' | 'star' | 'heart' | 'angry';

/**
 * Where the hero whose turn it is and the slime stand, facing each other, in the forest's
 * clearing.
 */
export const heroAt = { x: 44, y: 76 };
export const slimeAt = { x: 100, y: 76 };

/**
 * Where the other heroes wait behind the one whose turn it is, one, two or three of them, in
 * the order of the players.
 */
export function benchAt(count: number): readonly { x: number; y: number }[] {
  const behind = heroAt.x - 24;
  if (count === 1) return [{ x: behind, y: heroAt.y - 6 }];
  if (count === 2) {
    return [
      { x: behind + 2, y: heroAt.y - 16 },
      { x: behind - 2, y: heroAt.y + 12 },
    ];
  }
  return [
    { x: behind + 4, y: heroAt.y - 22 },
    { x: behind - 10, y: heroAt.y - 4 },
    { x: behind + 4, y: heroAt.y + 16 },
  ];
}

/**
 * How far each runs to reach the other, in pixels: the slime to just in front of the hero,
 * the hero to where their stroke reaches the slime.
 */
export const reach = {
  slime: slimeAt.x - heroAt.x - 12,
  hero: slimeAt.x - heroAt.x - 16,
  /** How far the slime steps back from a stroke. */
  sidestep: 14,
};

/** Where the berry bush stands, just behind the slime, so it can turn and eat. */
export const bushAt = { x: 116, y: 62 };

/** The berry bush with two berries, one, and none, in the nature tiles. */
const bushes = [96, 80, 64].map((x) => ({ x, y: 224, width: 16, height: 16 }));

/** Where a coin springs from: the middle of where the slime was. */
const coinFrom = { x: slimeAt.x + 3, y: slimeAt.y + 6 };

/**
 * Where the coins of a victory land, in the order they fall: on a grid around where the slime
 * was, nearest first, far enough apart for a child's finger to pick each one up, and clear of
 * the hero. Twenty, enough for six players' coins.
 */
export const coinSpots: readonly { x: number; y: number }[] = Array.from(
  { length: 20 },
  (_, index) => ({ x: 64 + (index % 5) * 18, y: 70 + Math.floor(index / 5) * 18 }),
).sort(
  (a, b) =>
    Math.hypot(a.x - coinFrom.x, a.y - coinFrom.y) - Math.hypot(b.x - coinFrom.x, b.y - coinFrom.y),
);

/** A sword's sweep over the slime, and the puff it vanishes in; frames side by side. */
export const sweep = (at: number): Effect => ({
  sheet: 'slash',
  width: 26,
  height: 32,
  frames: 5,
  x: slimeAt.x - 5,
  y: slimeAt.y - 10,
  at,
});
/**
 * A ball of slime the slime spits at the hero: flying `dx` pixels in an arc over `seconds`,
 * wobbling as it goes, then gone; frames side by side.
 */
export const slimeShot = (at: number, dx: number, seconds: number, height: number): Effect => ({
  sheet: 'slimeball',
  width: 16,
  height: 16,
  frames: 4,
  x: shotFrom,
  y: slimeAt.y + 6,
  at,
  lasts: seconds,
  arc: { dx, height, seconds },
});

/** Where a ball of slime leaves the slime, and how far it has to fly to reach the hero. */
const shotFrom = slimeAt.x - 6;
export const shotReach = heroAt.x - shotFrom;

/** A pebble the slime throws in teasing, landing just short of the hero; frames side by side. */
export const pebbleThrow = (at: number): Effect => ({
  sheet: 'pebble',
  width: 16,
  height: 16,
  frames: 4,
  x: shotFrom,
  y: slimeAt.y + 2,
  at,
  lasts: motionTokens.effect.flight,
  arc: { dx: shotReach + 10, height: 16 },
});

/** Grass the monster kicks up at the hero in teasing, landing short of them; frames side by side. */
export const grassKick = (at: number): Effect => ({
  sheet: 'grass',
  width: 12,
  height: 13,
  frames: 6,
  x: shotFrom + 4,
  y: slimeAt.y + 4,
  at,
  lasts: motionTokens.effect.flight,
  arc: { dx: shotReach + 14, height: 10 },
});

/** A spear the monster holds up over its head for a moment, to frighten the heroes. */
export const spearHeld = (at: number): Effect => ({
  sheet: 'lance',
  width: 6,
  height: 23,
  frames: 1,
  x: slimeAt.x + 5,
  y: slimeAt.y - 18,
  at,
  lasts: motionTokens.act.leap.seconds,
});

/** A gold cup over the heroes' heads after a victory, floating gently up and down, for good. */
export const trophy = (at: number): Effect => ({
  sheet: 'cup',
  width: 9,
  height: 11,
  frames: 1,
  x: heroAt.x + 3,
  y: heroAt.y - 18,
  at,
  lasts: Number.POSITIVE_INFINITY,
  float: { height: 2, every: 1.2 },
});

/**
 * Where fireworks burst over the trees, in the stage's pixels, clear of the hearts and the
 * purses in the corners, and which: a ring of sparks or a sparkle of stars.
 */
const bursts = [
  { sheet: 'ring', width: 32, height: 32, frames: 6, x: 28, y: 20 },
  { sheet: 'sparkle', width: 30, height: 35, frames: 9, x: 70, y: 6 },
  { sheet: 'ring', width: 32, height: 32, frames: 6, x: 102, y: 22 },
] as const;

/**
 * Fireworks over the trees from `at`, for `lasts` seconds: each burst over and over, every
 * `every` seconds, one after another.
 */
export const fireworks = (at: number, lasts: number, every: number): readonly Effect[] =>
  bursts.map((burst, index) => ({
    ...burst,
    at: at + (index * every) / bursts.length,
    lasts,
    repeat: every,
  }));

/** The ball of slime splashing over the hero; frames side by side. */
export const slimeSplash = (at: number): Effect => ({
  sheet: 'splash',
  width: 44,
  height: 33,
  frames: 10,
  x: heroAt.x - 14,
  y: heroAt.y - 14,
  at,
});

/** A power stroke: two cuts crossing over the slime; frames side by side. */
export const smash = (at: number): Effect => ({
  sheet: 'cross',
  width: 32,
  height: 32,
  frames: 4,
  x: slimeAt.x - 8,
  y: slimeAt.y - 10,
  at,
});
export const puff = (at: number): Effect => ({
  sheet: 'smoke',
  width: 32,
  height: 32,
  frames: 6,
  x: slimeAt.x - 8,
  y: slimeAt.y - 12,
  at,
});

/** A blue shield flashing up around the hero as they dodge a blow; frames side by side. */
export const shieldUp = (at: number): Effect => ({
  sheet: 'shield',
  width: 24,
  height: 26,
  frames: 6,
  x: heroAt.x - 4,
  y: heroAt.y - 6,
  at,
});

/**
 * A coin springing out of where the slime was, in an arc to where it lands, spinning; there it
 * becomes a coin to pick up, over the scene.
 */
export const coinDrop = (at: number, to: { x: number; y: number }): Effect => ({
  sheet: 'coin',
  width: 10,
  height: 10,
  frames: 4,
  ...coinFrom,
  at,
  lasts: motionTokens.effect.flight,
  arc: { dx: to.x - coinFrom.x, dy: to.y - coinFrom.y, height: 18 },
});

/** What one figure does: its acts, a sign over its head, and which way it turns. */
export interface Doing {
  acts?: readonly Act[];
  sign?: { sheet: Sign; at: number };
  facing?: Facing;
}

/**
 * What happens on the stage now: the hero whose turn it is, the monster, the other heroes by
 * their player's id, and effects.
 */
export interface Staging {
  hero?: Doing;
  monster?: Doing;
  bench?: Readonly<Record<string, Doing>>;
  effects?: readonly Effect[];
}

/** The heroes in the fight: whose turn it is in front, and the others, by their player's id. */
export interface Party {
  front: Hero;
  bench: readonly { id: string; hero: Hero }[];
}

/**
 * The clearing with the heroes and a monster facing each other, as staged: the hero whose turn
 * it is in front, the others behind; the monster as it looks now (a sheet's name); and the
 * berry bush with the berries it has.
 */
export function clearing(staging: Staging, party: Party, look: string, berries = 2): Scene {
  const places = benchAt(party.bench.length);
  // The bush holds from none to two berries, each with a cut.
  const berryBush = { sheet: 'nature', cut: bushes[berries] as Cut, ...bushAt };
  return {
    ...forest,
    things: [...forest.things, berryBush],
    figures: [
      ...party.bench.map((one, index) => ({
        sheet: one.hero,
        ...(places[index] as { x: number; y: number }),
        facing: 'right' as const,
        doing: 'standing' as const,
        ...staging.bench?.[one.id],
      })),
      { sheet: party.front, ...heroAt, facing: 'right', doing: 'standing', ...staging.hero },
      { sheet: look, ...slimeAt, facing: 'left', doing: 'bouncing', ...staging.monster },
    ],
    effects: staging.effects ?? [],
  };
}

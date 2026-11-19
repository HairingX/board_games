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
import type { Act, Cut, Effect, Facing, Scene } from '../../lib/scene/scene';
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
export const reach = { slime: slimeAt.x - heroAt.x - 12, hero: slimeAt.x - heroAt.x - 16 };

/** Where the berry bush stands, just behind the slime, so it can turn and eat. */
export const bushAt = { x: 116, y: 62 };

/** The berry bush with two berries, one, and none, in the nature tiles. */
const bushes = [96, 80, 64].map((x) => ({ x, y: 224, width: 16, height: 16 }));

/** How long the coins of a victory lie on the ground, in seconds, before they are gone. */
export const coinsLie = 4;

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
 * A coin springing out of where the slime was, in an arc to the side, and lying there
 * spinning a while.
 */
export const coinDrop = (at: number, aside: number): Effect => ({
  sheet: 'coin',
  width: 10,
  height: 10,
  frames: 4,
  x: slimeAt.x + 3,
  y: slimeAt.y + 6,
  at,
  lasts: coinsLie,
  arc: { dx: aside, height: 18 },
});

/** What one figure does: its acts, a sign over its head, and which way it turns. */
export interface Doing {
  acts?: readonly Act[];
  sign?: { sheet: Sign; at: number };
  facing?: Facing;
}

/**
 * What happens on the stage now: the hero whose turn it is, the slime, the other heroes by
 * their player's id, and effects.
 */
export interface Staging {
  hero?: Doing;
  slime?: Doing;
  bench?: Readonly<Record<string, Doing>>;
  effects?: readonly Effect[];
}

/** The heroes in the fight: whose turn it is in front, and the others, by their player's id. */
export interface Party {
  front: Hero;
  bench: readonly { id: string; hero: Hero }[];
}

/**
 * The clearing with the heroes and a slime facing each other, as staged: the hero whose turn
 * it is in front, the others behind; the slime enraged or not; and the berry bush with the
 * berries it has.
 */
export function clearing(staging: Staging, party: Party, enraged = false, berries = 2): Scene {
  const slimeSheet = enraged ? 'slimeRage' : 'slime';
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
      { sheet: slimeSheet, ...slimeAt, facing: 'left', doing: 'bouncing', ...staging.slime },
    ],
    effects: staging.effects ?? [],
  };
}

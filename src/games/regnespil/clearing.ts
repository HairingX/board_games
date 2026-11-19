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
import type { Act, Effect, Scene } from '../../lib/scene/scene';
import { forest, forestSheets } from './forest';

/**
 * The pictures of a fight in the clearing: the forest's, the slime's, calm and enraged (the
 * same blue slime with a cross face), effects and signs.
 */
export const clearingSheets = {
  ...forestSheets,
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
} as const;

export type Sign = 'alert' | 'dizzy' | 'sleepy' | 'star' | 'heart' | 'angry';

/** Where the hero and the slime stand, facing each other, in the forest's clearing. */
export const heroAt = { x: 44, y: 76 };
export const slimeAt = { x: 100, y: 76 };

/**
 * How far each runs to reach the other, in pixels: the slime to just in front of the hero,
 * the hero to where their stroke reaches the slime.
 */
export const reach = { slime: slimeAt.x - heroAt.x - 12, hero: slimeAt.x - heroAt.x - 16 };

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

/** What happens on the stage now: each one's act and sign, and effects. */
export interface Staging {
  hero?: { acts?: readonly Act[]; sign?: { sheet: Sign; at: number } };
  slime?: { acts?: readonly Act[]; sign?: { sheet: Sign; at: number } };
  effects?: readonly Effect[];
}

/** The clearing with the hero and a slime facing each other, as staged; the slime enraged. */
export function clearing(staging: Staging, enraged = false): Scene {
  const slimeSheet = enraged ? 'slimeRage' : 'slime';
  return {
    ...forest,
    figures: [
      { sheet: 'hero', ...heroAt, facing: 'right', doing: 'standing', ...staging.hero },
      { sheet: slimeSheet, ...slimeAt, facing: 'left', doing: 'bouncing', ...staging.slime },
    ],
    effects: staging.effects ?? [],
  };
}

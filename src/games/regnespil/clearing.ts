import slime from '../../../assets/ninja-adventure/Actor/Monster/Slime/Slime.png';
import smoke from '../../../assets/ninja-adventure/FX/Smoke/Smoke/SpriteSheet.png';
import slash from '../../../assets/ninja-adventure/FX/Slash/SpriteSheetSlash01.png';
import dizzy from '../../../assets/ninja-adventure/Ui/Emote/emote3.png';
import alert from '../../../assets/ninja-adventure/Ui/Emote/emote22.png';
import sleepy from '../../../assets/ninja-adventure/Ui/Emote/emote28.png';
import heart from '../../../assets/ninja-adventure/Ui/Emote/emote27.png';
import star from '../../../assets/ninja-adventure/Ui/Emote/emote29.png';
import coin from '../../../assets/ninja-adventure/Items/Treasure/Coin2.png';
import type { Act, Effect, Scene } from '../../lib/scene/scene';
import { forest, forestSheets } from './forest';

/** The pictures of a fight in the clearing: the forest's, the slime's, effects and signs. */
export const clearingSheets = {
  ...forestSheets,
  slime,
  slash,
  smoke,
  alert,
  dizzy,
  sleepy,
  star,
  heart,
  coin,
} as const;

export type Sign = 'alert' | 'dizzy' | 'sleepy' | 'star' | 'heart';

/** Where the hero and the slime stand, facing each other, in the forest's clearing. */
export const heroAt = { x: 44, y: 76 };
export const slimeAt = { x: 100, y: 76 };

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

/** A coin spinning where the slime was, a little to the side, as the slime leaves it. */
export const coinDrop = (at: number, aside: number): Effect => ({
  sheet: 'coin',
  width: 10,
  height: 10,
  frames: 4,
  x: slimeAt.x + 3 + aside,
  y: slimeAt.y + 6,
  at,
});

/** What happens on the stage now: each one's act and sign, and effects. */
export interface Staging {
  hero?: { acts?: readonly Act[]; sign?: { sheet: Sign; at: number } };
  slime?: { acts?: readonly Act[]; sign?: { sheet: Sign; at: number } };
  effects?: readonly Effect[];
}

/** The clearing with the hero and a slime facing each other, as staged. */
export function clearing(staging: Staging): Scene {
  return {
    ...forest,
    figures: [
      { sheet: 'hero', ...heroAt, facing: 'right', doing: 'standing', ...staging.hero },
      { sheet: 'slime', ...slimeAt, facing: 'left', doing: 'bouncing', ...staging.slime },
    ],
    effects: staging.effects ?? [],
  };
}

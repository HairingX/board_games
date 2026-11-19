import wood from '../../../assets/ninja-adventure/Items/Weapons/Club/Sprite.png';
import flame from '../../../assets/ninja-adventure/Items/Weapons/Sword/Sprite.png';
import iron from '../../../assets/ninja-adventure/Items/Weapons/Sword2/Sprite.png';
import heart from '../../../assets/ninja-adventure/Ui/Receptacle/Heart.png';
import heartIcon from '../../../assets/ninja-adventure/Ui/Receptacle/IconHeart.png';
import lifeLeft from '../../../assets/ninja-adventure/Ui/Receptacle/LifeBarMiniProgress.png';
import lifeBar from '../../../assets/ninja-adventure/Ui/Receptacle/LifeBarMiniUnder.png';
import type { Sword } from './swords';

/** The game's interface art from the Ninja Adventure pack, drawn pixelated. */

/** Each sword's picture: a wooden club, an iron sword, and a red flame sword. */
export const swordPictures: Readonly<Record<Sword, string>> = {
  træ: wood,
  jern: iron,
  flamme: flame,
};

/** A heart in five frames, empty to full; a small heart; a monster's small life bar. */
export const hud = { heart, heartIcon, lifeBar, lifeLeft } as const;

/** The small life bar's size in the stage's pixels. */
export const lifeBarSize = { width: 18, height: 4 } as const;

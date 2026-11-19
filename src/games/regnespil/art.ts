import wood from '../../../assets/ninja-adventure/Items/Weapons/Club/Sprite.png';
import flame from '../../../assets/ninja-adventure/Items/Weapons/Sword/Sprite.png';
import iron from '../../../assets/ninja-adventure/Items/Weapons/Sword2/Sprite.png';
import heart from '../../../assets/ninja-adventure/Ui/Receptacle/Heart.png';
import heartIcon from '../../../assets/ninja-adventure/Ui/Receptacle/IconHeart.png';
import guard from '../../../assets/ninja-adventure/Ui/Skill Icon/Spell/DefenseUpgrade.png';
import slimeFace from '../../../assets/ninja-adventure/Actor/Monster/Slime/Faceset.png';
import slimeRageFace from '../../../assets/ninja-adventure/Actor/Monster/Slime3/Faceset.png';
import woodFrame from '../../../assets/ninja-adventure/Ui/Theme/Wip/ThemeWood2/nine_path_panel.png';
import type { Sword } from './swords';

/** The game's interface art from the Ninja Adventure pack, drawn pixelated. */

/** Each sword's picture: a wooden club, an iron sword, and a red flame sword. */
export const swordPictures: Readonly<Record<Sword, string>> = {
  træ: wood,
  jern: iron,
  flamme: flame,
};

/** A heart in five frames, empty to full; a small heart; a shield, for defending. */
export const hud = { heart, heartIcon, guard } as const;

/** The monsters' portraits, shown at the top of a fight, calm and enraged. */
export const faces = { slime: slimeFace, slimeRage: slimeRageFace } as const;

/**
 * The frame of a fight's top bar, in the look of where the fight is: wood in the forest. A
 * 16-pixel square of the pack's, cut into nine for a border image, its edge 5 pixels wide.
 */
export const topFrames = { forest: woodFrame } as const;

import type { Profile } from '../../family/family';

/*
 * The heroes a player can be in the math game's adventure: figures from the Ninja Adventure
 * pack (CC0) that the story will not use (`docs/regnespil-story.md` names those). Each has a
 * sprite sheet of 16-pixel frames and a portrait. A hero's id, its folder's name, is saved on
 * the player's profile, so it never changes.
 */

export const heroes = [
  'Knight',
  'KnightGold',
  'Samurai',
  'NinjaBlue2',
  'NinjaRed',
  'NinjaGreen',
  'NinjaYellow',
  'NinjaEskimo',
  'SorcererOrange',
  'Spirit',
  'Cavegirl2',
  'Eskimo',
  'LionBoy',
  'MaskFrog',
  'Monkey',
  'Villager4',
] as const;
export type Hero = (typeof heroes)[number];

const sheets = import.meta.glob<string>(
  '../../../assets/ninja-adventure/Actor/Character/{Knight,KnightGold,Samurai,NinjaBlue2,NinjaRed,NinjaGreen,NinjaYellow,NinjaEskimo,SorcererOrange,Spirit,Cavegirl2,Eskimo,LionBoy,MaskFrog,Monkey,Villager4}/SpriteSheet.png',
  { eager: true, import: 'default', query: '?url' },
);
const portraits = import.meta.glob<string>(
  '../../../assets/ninja-adventure/Actor/Character/{Knight,KnightGold,Samurai,NinjaBlue2,NinjaRed,NinjaGreen,NinjaYellow,NinjaEskimo,SorcererOrange,Spirit,Cavegirl2,Eskimo,LionBoy,MaskFrog,Monkey,Villager4}/Faceset.png',
  { eager: true, import: 'default', query: '?url' },
);

/** The picture in a folder of the pack's characters, by the folder's name. */
function byHero(found: Record<string, string>): Readonly<Record<Hero, string>> {
  return Object.fromEntries(
    Object.entries(found).map(([path, url]) => [path.split('/').slice(-2, -1).join(''), url]),
  ) as Record<Hero, string>;
}

/** Each hero's sprite sheet: four columns, one for each way they face, and rows of frames. */
export const heroSheets = byHero(sheets);

/** Each hero's portrait. */
export const heroFaces = byHero(portraits);

export function isHero(value: unknown): value is Hero {
  return heroes.includes(value as Hero);
}

/**
 * The hero suggested for a player the first time: the face on their profile, if it is one of
 * the heroes; otherwise one picked by their id, so each player usually gets their own.
 */
export function suggestHero(player: Profile): Hero {
  const face = player.picture?.kind === 'face' ? player.picture.face : undefined;
  if (isHero(face)) return face;
  let sum = 0;
  for (let index = 0; index < player.id.length; index++) sum += player.id.charCodeAt(index);
  return heroes[sum % heroes.length] as Hero;
}

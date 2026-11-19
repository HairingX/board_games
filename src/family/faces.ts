/*
 * Faces a profile can have instead of its initial: 38-pixel portraits from the Ninja Adventure
 * pack (CC0), drawn pixelated. A face's id, its folder's name, is saved on the profile, so it
 * never changes; a face taken out of this list leaves its profiles with their initial.
 */
const characters = import.meta.glob<string>(
  '../../assets/ninja-adventure/Actor/Character/{Boy,Cavegirl,Cavegirl2,Child,EggBoy,EggGirl,Eskimo,KnightGold,LionBoy,MaskFrog,MaskRacoon,Monkey,NinjaBlue2,NinjaEskimo,NinjaYellow,Princess,Samurai,SorcererOrange,Spirit,Villager4,Woman}/Faceset.png',
  { eager: true, import: 'default', query: '?url' },
);
const animals = import.meta.glob<string>(
  '../../assets/ninja-adventure/Actor/Animal/{Cat,CatOrange,CatWhite,Cow,DogOrange,Frog,Hamster,LionCub,Racoon}/Faceset.png',
  { eager: true, import: 'default', query: '?url' },
);

/** Each face's picture by its id, in the order they are offered: people, then animals. */
export const faces: ReadonlyMap<string, string> = new Map(
  [...Object.entries(characters), ...Object.entries(animals)].map(([path, url]) => [
    path.split('/').slice(-2, -1).join(''),
    url,
  ]),
);

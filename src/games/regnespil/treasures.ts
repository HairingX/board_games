import heal from '../../../assets/ninja-adventure/Ui/Skill Icon/Spell/Heal.png';
import ring from '../../../assets/ninja-adventure/Ui/Skill Icon/Items & Weapon/Ring.png';
import money from '../../../assets/ninja-adventure/Ui/Skill Icon/Items & Weapon/Money.png';
import defence from '../../../assets/ninja-adventure/Ui/Skill Icon/Spell/DefenseUpgrade.png';
import { shuffle, type Random } from '../../lib/random';
import { noGear, powerAfter, type Gear } from './battle';

/*
 * The treasures the heroes find in chests on their way, one chosen of three, kept for the rest
 * of the journey: each changes the fights in a way a child can see, as the owner's design asks
 * (chests with three unique treasures, one chosen).
 */

/** The treasures there are, in the order a chest offers them. */
export const treasures = ['heartJar', 'powerRing', 'goldPouch', 'guardCharm'] as const;
export type Treasure = (typeof treasures)[number];

export function isTreasure(value: unknown): value is Treasure {
  return treasures.includes(value as Treasure);
}

/** Each treasure's picture, the pack's skill icons. */
export const treasurePictures: Readonly<Record<Treasure, string>> = {
  heartJar: heal,
  powerRing: ring,
  goldPouch: money,
  guardCharm: defence,
};

/**
 * What each treasure does to a fight: a heart jar gives a heart more; a power ring makes a
 * power stroke of two right answers in a row; a gold pouch makes every coin of a victory worth
 * two; a guard charm turns aside the first blow that would cost hearts in each fight.
 */
const helps: Readonly<Record<Treasure, Partial<Gear>>> = {
  heartJar: { hearts: 2 },
  powerRing: { powerAfter: powerAfter - 1 },
  goldPouch: { coinWorth: 2 },
  guardCharm: { guards: 1 },
};

/** What the heroes carry, from the treasures they have. */
export function gearOf(carried: readonly Treasure[]): Gear {
  return carried.reduce<Gear>((gear, treasure) => ({ ...gear, ...helps[treasure] }), noGear);
}

/** How many treasures a chest offers to choose from. */
export const chestHolds = 3;

/**
 * The treasures a chest offers: up to three the heroes do not have yet, picked by `random`, in
 * the order of `treasures`, so each is new.
 */
export function chestOffers(carried: readonly Treasure[], random: Random): readonly Treasure[] {
  const left = treasures.filter((treasure) => !carried.includes(treasure));
  const picked = shuffle(left, random).slice(0, chestHolds);
  return left.filter((treasure) => picked.includes(treasure));
}

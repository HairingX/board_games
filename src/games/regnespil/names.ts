import { seeded } from '../../lib/random';
import { pick } from './sums';

/*
 * A monster's name, put together from two pools, as the owner asked ("Slimy Bob"): a first
 * part that describes and a second that names, silly and kind, never frightening. Each language
 * has its own pools (in `text.ts`), and a name is made in each from the same seed, so the same
 * monster has a fitting name in every language rather than a translation.
 */

/** The two pools a family's names are made from, in one language. */
export interface NamePools {
  describe: readonly string[];
  name: readonly string[];
}

/** How often the second part begins with the first's letter, when one can, as children like. */
export const alliterate = 0.7;

/** The name the seed makes from these pools. */
export function monsterName(pools: NamePools, seed: number): string {
  const random = seeded(seed);
  const first = pick(random, pools.describe);
  const initial = first.charAt(0);
  const rhyming = pools.name.filter((one) => one.charAt(0) === initial);
  const second = pick(random, rhyming.length > 0 && random() < alliterate ? rhyming : pools.name);
  return `${first} ${second}`;
}

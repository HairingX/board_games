import type { Voice } from '../../lib/sound/babble';
import { voices } from '../../lib/sound/voices';
import { faces } from './art';
import type { Evasion, StrikeName, Tease } from './beats';

/*
 * The monsters as data, as the design has it (section 5.6 of `docs/regnespil-design.md`): a
 * monster is what it looks and sounds like and which of the fight's beats (`beats.ts`) it
 * uses, so a new monster, or a new trick for one, is an entry here, not a change to the fight.
 * Its lives come from the players' swords; how it weighs its moves is in `battle.ts`.
 */

export interface Monster {
  /** Its kind, whose name pools (in `text.ts`) its names are made from. */
  kind: 'slime';
  /** Its sprite sheets in the scene, by name, calm and enraged, and its portraits. */
  look: { calm: string; enraged: string };
  face: { calm: string; enraged: string };
  voice: Voice;
  /** How it strikes back, gets out of the way of a stroke, and teases the heroes. */
  strikes: readonly StrikeName[];
  evasions: readonly Evasion[];
  teases: readonly Tease[];
}

/** The slime of the forest clearing: the first monster. */
export const slime: Monster = {
  kind: 'slime',
  look: { calm: 'slime', enraged: 'slimeRage' },
  face: { calm: faces.slime, enraged: faces.slimeRage },
  voice: voices.slime,
  strikes: ['charge', 'spit'],
  evasions: ['leap', 'sink', 'sidestep'],
  teases: ['taunt', 'pebbles', 'sand', 'spear'],
};

import giantFace from '../../../assets/ninja-adventure/Actor/Boss/GiantSlime/Faceset.png';
import dogFace from '../../../assets/ninja-adventure/Actor/Animal/DogOrange/Faceset.png';
import type { Voice } from '../../lib/sound/babble';
import { voices } from '../../lib/sound/voices';
import { faces } from './art';
import { slimePlan, type Plan } from './battle';
import type { Evasion, StrikeName, Tease } from './beats';
import type { Big } from './clearing';

/*
 * The monsters as data, as the design has it (section 5.6 of `docs/regnespil-design.md`): a
 * monster is what it looks and sounds like, how tough it is, how its fight goes (its plan),
 * and which of the fight's beats (`beats.ts`) it uses, so a new monster, or a new trick for
 * one, is an entry here, not a change to the fight.
 */

/** The monsters there are, by kind; a fight is saved with the kind it is against. */
export const foes = ['slime', 'giantSlime', 'copperDog'] as const;
export type Foe = (typeof foes)[number];

export function isFoe(value: unknown): value is Foe {
  return foes.includes(value as Foe);
}

export interface Monster {
  /** Its kind, whose name pools (in `text.ts`) its names are made from. */
  kind: Foe;
  /** Its sprite sheets in the scene, by name, calm and enraged, and its portraits. */
  look: { calm: string; enraged: string };
  face: { calm: string; enraged: string };
  /**
   * A big monster's frames, side by side in one row, if it is not drawn as the pack's small
   * figures are; it stands with its feet where a small one's would be.
   */
  big?: Big;
  /** How many times its size it is drawn, a whole number, if larger. */
  size?: number;
  voice: Voice;
  /** How many times the players' swords' lives it has. */
  toughness: number;
  /**
   * Whether it is won over rather than beaten, as the story's dogs are: a right answer throws
   * it a treat, and once it has had enough it becomes the heroes' friend.
   */
  befriends?: boolean;
  /** When it grows enraged, when a shield rises, and whether a berry bush stands by it. */
  plan: Plan;
  /** How it strikes back, and once enraged; how it gets out of the way; how it teases. */
  strikes: readonly StrikeName[];
  enragedStrikes: readonly StrikeName[];
  evasions: readonly Evasion[];
  teases: readonly Tease[];
}

/** The slime of the forest clearing: the first monster. */
export const slime: Monster = {
  kind: 'slime',
  look: { calm: 'slime', enraged: 'slimeRage' },
  face: { calm: faces.slime, enraged: faces.slimeRage },
  voice: voices.slime,
  toughness: 1,
  plan: slimePlan,
  strikes: ['charge', 'spit'],
  enragedStrikes: ['charge', 'spit'],
  evasions: ['leap', 'sink', 'sidestep'],
  teases: ['taunt', 'pebbles', 'sand', 'spear'],
};

/**
 * The giant slime, a boss to try the fight's phases on, as the owner asked: three times as
 * tough; at two thirds of its lives enraged, striking back more often and with a body slam,
 * warned and dodged like any blow; at a third a shield rises, which every right answer breaks
 * a piece off and a power stroke shatters at once. It has no berry bush.
 */
export const giantSlime: Monster = {
  kind: 'giantSlime',
  look: { calm: 'giantSlime', enraged: 'giantSlime' },
  face: { calm: giantFace, enraged: giantFace },
  big: { width: 62, height: 52, frames: 5, front: 11 },
  voice: voices.giant,
  toughness: 3,
  plan: { rage: 2 / 3, shield: 1 / 3, bush: false },
  strikes: ['charge', 'spit'],
  enragedStrikes: ['slam', 'spit', 'slam'],
  evasions: ['leap', 'sidestep'],
  teases: ['taunt', 'pebbles'],
};

/**
 * The copper dog, the story's first dog, with eyes as big as teacups, as the story has it
 * (`docs/regnespil-story.md`): the first boss, grumpy, not wicked, won over with treats rather
 * than beaten. Drawn twice its size from the pack's running dog, it charges and hops crossly
 * and kicks grass, grows grumpier halfway, and becomes the heroes' friend.
 */
/** The pack's running dog: two frames side by side, facing right, its nose at the front. */
export const dogFrames: Big = { width: 18, height: 16, frames: 2, faces: 'right', front: 1 };

/** How many times its size the copper dog is drawn: as big as eyes like teacups need. */
export const copperDogSize = 2;

export const copperDog: Monster = {
  kind: 'copperDog',
  look: { calm: 'dog', enraged: 'dog' },
  face: { calm: dogFace, enraged: dogFace },
  big: dogFrames,
  size: copperDogSize,
  voice: voices.dog,
  toughness: 1.5,
  befriends: true,
  plan: { rage: 1 / 2, shield: 0, bush: false },
  strikes: ['charge'],
  enragedStrikes: ['charge'],
  evasions: ['leap', 'sidestep'],
  teases: ['taunt', 'sand'],
};

/** Each monster by its kind. */
export const monsters: Readonly<Record<Foe, Monster>> = { slime, giantSlime, copperDog };

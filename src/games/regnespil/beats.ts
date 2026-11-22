import type { Act, Effect } from '../../lib/scene/scene';
import type { Fight } from './battle';
import { motionTokens } from '../../ui/motion';
import {
  coinDrop,
  coinSpots,
  dust,
  fireworks,
  grassKick,
  pebbleThrow,
  puff,
  reach,
  shieldUp,
  shotReach,
  slimeShot,
  slimeSplash,
  smash,
  spearHeld,
  sweep,
  energy,
  energyFrom,
  flagFall,
  flagLands,
  flagPlanted,
  shieldFlash,
  charmGlow,
  treatThrown,
  type Doing,
  type Staging,
} from './clearing';
import type { sounds } from './sounds';

/*
 * The fight's beats: what is seen and heard for each thing that can happen in a fight, as
 * data, so the fight's screen only plays what the rules decided, and a new move, reaction or
 * bit of teasing is one more entry here, not a change to the screen. Each beat is a pure
 * function from the moment it begins to the staging (who acts, signs, effects) and the cues
 * (sounds and voices, each a moment after it begins), so it can be tested on its own.
 */

/** When the answer shows after it is chosen, in seconds: as the hero or the monster arrives. */
export const reveal = motionTokens.act.charge.out;

/**
 * When things happen around the answer showing, in seconds from it: the monster squeals at a
 * stroke; it hops into a hero whose answer was far off just before it shows; the hero jumps
 * clear of a blow dodged just before it lands; it evades a stroke just before it lands; the
 * hero says "ouch"; an enraged monster roars a moment after; a power stroke's second hit.
 */
export const moments = {
  squeal: 0.15,
  hop: 0.1,
  dodge: 0.1,
  evade: 0.15,
  ouch: 0.15,
  rage: 0.5,
  second: 0.12,
} as const;

/** How high a ball of slime that hits is lobbed, and how much further one jumped over flies. */
export const spitting = { lob: 12, onward: 1.8 } as const;

/**
 * When the victory's moments come after the last stroke shows, in seconds: the monster
 * vanishing, its puff, the first coin springing out and the next after it, and the cheers.
 */
export const victory = {
  vanish: 0.12,
  puff: 0.3,
  coins: { first: 0.45, apart: 0.07 },
  cheers: [0.8, 1.5],
} as const;

/**
 * How a victory is celebrated, so it is plain the fight was won, as the owner chose: a
 * victory dance, the heroes hopping and cheering again and again, each a little after the
 * other, while a flag falls from the sky (`flag` seconds after the last stroke shows) and is
 * planted where the monster stood, waving for good, and fireworks burst over the trees, each
 * every so often, for a while; when the fight is opened again, they burst a little again.
 */
export const celebration = {
  dance: 2.2,
  flag: 0.9,
  every: 2.4,
  apart: 0.4,
  fireworks: 12,
  again: 6,
} as const;

/**
 * The flag and fireworks of a victory, from `at`: the flag falling where the monster stood
 * (its `middle`), and the fireworks for `lasts` seconds.
 */
const celebrate = (at: number, lasts: number, middle: number): readonly Effect[] => [
  flagPlanted(at, middle),
  flagLands(at + flagFall.seconds, middle),
  ...fireworks(at, lasts, celebration.every),
];

/** A hero's victory dance from `at`: a cheering hop again and again, the `index`th a little after. */
const dance = (at: number, index: number): Act => ({
  kind: 'cheer',
  at: at + index * celebration.apart,
  repeat: celebration.every,
});

/**
 * How a monster won over comes to the heroes: a moment after the last treat shows, in seconds,
 * it runs this many pixels towards them, taking this long, and stays by them, hopping.
 */
export const befriending = { comes: 1.4, reach: 30, run: 1 } as const;

/** The monster won over, by the heroes, as it runs there and stays. */
const byHeroes = (at: number): Act => ({
  kind: 'approach',
  at,
  reach: befriending.reach,
  lasts: befriending.run,
});

/** When a victory's coin springs out, after the last stroke shows, in seconds. */
export const coinAt = (index: number) => victory.coins.first + index * victory.coins.apart;

/** How long the monster's teasing between two sums lasts, in seconds, and its moments. */
export const teasing = { seconds: 1.6, apart: 0.3, ducks: 0.35, away: 20 } as const;

/** A sound to play: one of the game's sounds, or a stroke's hit (one of several, at random). */
export type Sound = keyof typeof sounds | 'hit';

/** What is heard in a beat, `after` seconds from its start: a sound, or someone's voice. */
export type Cue =
  { sound: Sound; after: number } | { voice: 'monster' | 'hero'; syllables: number; after: number };

/** What a beat shows and plays. */
export interface Beat {
  staging: Staging;
  cues: readonly Cue[];
}

/** Where a beat happens: when it begins, and what it needs to know of the fight. */
export interface Moment {
  /** When it begins, on the page's clock, in seconds. */
  at: number;
  /** How far the monster had walked towards the hero, which it hurries back from. */
  walked: number;
  /** The heroes waiting behind, by their players' ids, who cheer at a victory. */
  others: readonly string[];
  /** Whether the heroes are out of hearts after it, so the one knocked over rests. */
  lost: boolean;
  /** Where the middle of the monster is on the stage, where a victory's flag falls. */
  middle: number;
}

const sound = (name: Sound, after = 0): Cue => ({ sound: name, after });
const voice = (who: 'monster' | 'hero', syllables: number, after = 0): Cue => ({
  voice: who,
  syllables,
  after,
});

/** The hero's shout as they run at the monster. */
const shout = voice('hero', 2);

/** The monster hurrying home first, if it had walked towards the hero. */
const hurry = (moment: Moment): readonly Act[] =>
  moment.walked > 0 ? [{ kind: 'return', at: moment.at, reach: moment.walked }] : [];

/**
 * The hero knocked over at `at`, where a run took them (`from` pixels out, after the acts
 * `before`): their acts, and the sign as they lie.
 */
function knockedOver(moment: Moment, at: number, from = 0, before: readonly Act[] = []): Doing {
  const { fall, down, push } = motionTokens.act.knocked;
  return {
    acts: [
      ...before,
      { kind: 'knocked', at, reach: from },
      // Out of hearts, the hero stays down to rest where they fell.
      ...(moment.lost ? [{ kind: 'lie', at: at + fall, reach: from - push } as const] : []),
    ],
    sign: { sheet: moment.lost ? 'sleepy' : 'dizzy', at: at + fall + down },
  };
}

/** The hero running at the monster, striking as they reach it, and walking home. */
function strike(moment: Moment): readonly Act[] {
  const shown = moment.at + reveal;
  return [
    { kind: 'charge', at: moment.at, reach: reach.hero },
    { kind: 'attack', at: shown, reach: reach.hero },
    { kind: 'return', at: shown + motionTokens.act.attack.seconds, reach: reach.hero },
  ];
}

/** The sounds of a stroke landing, twice for a power stroke, and the monster's squeal. */
function landing(power: boolean): readonly Cue[] {
  return [
    shout,
    sound('slash', reveal),
    sound('hit', reveal),
    ...(power ? [sound('hit', reveal + moments.second)] : []),
    voice('monster', 3, reveal + moments.squeal),
  ];
}

/** The cuts over the monster: a sweep, and two crossing for a power stroke. */
const cuts = (shown: number, power: boolean): readonly Effect[] =>
  power ? [sweep(shown), smash(shown)] : [sweep(shown)];

/** The treats thrown at a right answer, a second a moment after for a power stroke. */
const treats = (moment: Moment, power: boolean): readonly Effect[] => [
  treatThrown(moment.at, moment.middle, reveal),
  ...(power ? [treatThrown(moment.at + moments.second, moment.middle, reveal)] : []),
];

/** How the monster gets out of the way of a stroke that does not land. */
export const evasions = {
  leap: (at: number): Act => ({ kind: 'leap', at }),
  sink: (at: number): Act => ({ kind: 'sink', at }),
  sidestep: (at: number): Act => ({ kind: 'charge', at, reach: -reach.sidestep }),
} as const;
export type Evasion = keyof typeof evasions;

/** What can happen when the hero attacks, by what the answer did. */
export const attacks = {
  /** A right answer: the stroke lands. */
  stroke: (moment: Moment, power: boolean): Beat => {
    const shown = moment.at + reveal;
    return {
      staging: {
        hero: { acts: strike(moment) },
        monster: { acts: [...hurry(moment), { kind: 'hurt', at: shown + victory.vanish }] },
        effects: cuts(shown, power),
      },
      cues: landing(power),
    };
  },
  /**
   * A right answer while the monster holds a shield: the stroke lands on it with a clang and
   * breaks a piece off, or, `broken`, the last of it, in a puff, and the monster yelps.
   */
  shielded: (moment: Moment, broken: boolean): Beat => {
    const shown = moment.at + reveal;
    return {
      staging: {
        hero: { acts: strike(moment) },
        monster: { acts: hurry(moment) },
        effects: [sweep(shown), ...(broken ? [puff(shown + victory.vanish)] : [])],
      },
      cues: [
        shout,
        sound('clang', reveal),
        ...(broken ? [sound('hit', reveal + moments.second)] : []),
        voice('monster', broken ? 5 : 2, reveal + moments.squeal),
      ],
    };
  },
  /**
   * A right answer against a monster won over with treats: the hero throws it a treat, two
   * for a power stroke, and it catches each with a hop and a happy sound, a heart over it.
   */
  treat: (moment: Moment, power: boolean): Beat => {
    const shown = moment.at + reveal;
    return {
      staging: {
        hero: { acts: [{ kind: 'attack', at: moment.at }] },
        monster: {
          acts: [...hurry(moment), { kind: 'cheer', at: shown }],
          sign: { sheet: 'heart', at: shown },
        },
        effects: treats(moment, power),
      },
      cues: [
        shout,
        sound('treat', reveal),
        ...(power ? [sound('treat', reveal + moments.second)] : []),
        voice('monster', 3, reveal + moments.squeal),
      ],
    };
  },
  /**
   * An answer close against a monster won over with treats: the treat flies past as it gets
   * out of the way, and it giggles; `nicked` if it costs the hero, who then smarts.
   */
  missed: (moment: Moment, evasion: Evasion, nicked: boolean): Beat => {
    const shown = moment.at + reveal;
    return {
      staging: {
        hero: {
          acts: [
            { kind: 'attack', at: moment.at },
            ...(nicked ? [{ kind: 'hurt', at: shown + moments.squeal } as const] : []),
          ],
        },
        monster: { acts: [...hurry(moment), evasions[evasion](shown - moments.evade)] },
        effects: [treatThrown(moment.at, moment.middle, reveal, true)],
      },
      cues: [shout, voice('monster', 2, reveal + moments.squeal)],
    };
  },
  /**
   * The last treat: the monster is won over. It catches the treat, spins round for joy and
   * runs to the heroes, hopping by them; coins spring out, the heroes cheer and dance, and
   * fireworks burst; no flag, as nothing was beaten.
   */
  befriended: (moment: Moment, power: boolean, coins: number): Beat => {
    const shown = moment.at + reveal;
    const cheers = victory.cheers.map((cheer) => ({ kind: 'cheer', at: shown + cheer }) as const);
    return {
      staging: {
        bench: Object.fromEntries(
          moment.others.map((id, index) => [
            id,
            { acts: [...cheers, dance(shown + celebration.dance, index + 1)] },
          ]),
        ),
        hero: {
          acts: [{ kind: 'attack', at: moment.at }, ...cheers, dance(shown + celebration.dance, 0)],
          sign: { sheet: 'heart', at: shown + victory.cheers[0] },
        },
        monster: {
          acts: [
            ...hurry(moment),
            { kind: 'cheer', at: shown },
            { kind: 'spin', at: shown + motionTokens.act.cheer.seconds },
            byHeroes(shown + befriending.comes),
          ],
          sign: { sheet: 'heart', at: shown },
        },
        effects: [
          ...treats(moment, power),
          ...coinSpots.slice(0, coins).map((spot, index) => coinDrop(shown + coinAt(index), spot)),
          ...fireworks(shown + celebration.flag, celebration.fireworks, celebration.every),
        ],
      },
      cues: [
        shout,
        sound('treat', reveal),
        sound('victory', reveal),
        sound('bark', reveal + moments.squeal),
        voice('monster', 5, reveal + befriending.comes),
        voice('hero', 6, reveal + victory.cheers[0]),
      ],
    };
  },
  /** The last stroke: the monster vanishes in a puff, coins spring out, the heroes cheer. */
  victory: (moment: Moment, power: boolean, coins: number): Beat => {
    const shown = moment.at + reveal;
    const cheers = victory.cheers.map((cheer) => ({ kind: 'cheer', at: shown + cheer }) as const);
    return {
      staging: {
        bench: Object.fromEntries(
          moment.others.map((id, index) => [
            id,
            { acts: [...cheers, dance(shown + celebration.dance, index + 1)] },
          ]),
        ),
        hero: {
          acts: [...strike(moment), ...cheers, dance(shown + celebration.dance, 0)],
          sign: { sheet: 'heart', at: shown + victory.cheers[0] },
        },
        monster: { acts: [...hurry(moment), { kind: 'vanish', at: shown + victory.vanish }] },
        effects: [
          ...cuts(shown, power),
          puff(shown + victory.puff),
          ...coinSpots.slice(0, coins).map((spot, index) => coinDrop(shown + coinAt(index), spot)),
          ...celebrate(shown + celebration.flag, celebration.fireworks, moment.middle),
        ],
      },
      cues: [
        ...landing(power),
        sound('victory', reveal),
        voice('hero', 6, reveal + victory.cheers[0]),
      ],
    };
  },
  /**
   * A close answer: the monster gets out of the way, the stroke swishes through the air, and
   * it giggles; `nicked` if it costs the hero, who then smarts.
   */
  evaded: (moment: Moment, evasion: Evasion, nicked: boolean): Beat => {
    const shown = moment.at + reveal;
    const home = shown + motionTokens.act.attack.seconds + motionTokens.act.return.seconds;
    return {
      staging: {
        hero: {
          acts: [...strike(moment), ...(nicked ? [{ kind: 'hurt', at: home } as const] : [])],
        },
        monster: { acts: [...hurry(moment), evasions[evasion](shown - moments.evade)] },
      },
      cues: [shout, sound('slash', reveal), voice('monster', 2, reveal + moments.squeal)],
    };
  },
  /** An answer far off: the monster hops into the hero and bounces them over. */
  bumped: (moment: Moment): Beat => {
    const shown = moment.at + reveal;
    return {
      staging: {
        hero: knockedOver(moment, shown, reach.hero, [
          { kind: 'charge', at: moment.at, reach: reach.hero },
        ]),
        monster: { acts: [...hurry(moment), { kind: 'cheer', at: shown - moments.hop }] },
      },
      cues: [
        shout,
        voice('monster', 3, reveal - moments.hop),
        sound('bump', reveal),
        voice('hero', 2, reveal + moments.ouch),
      ],
    };
  },
  /** A wrong answer while the monster eats: the stroke misses, and it eats a life back. */
  fed: (moment: Moment): Beat => {
    const shown = moment.at + reveal;
    return {
      staging: {
        hero: { acts: strike(moment) },
        monster: { facing: 'right', acts: hurry(moment), sign: { sheet: 'heart', at: shown } },
      },
      cues: [shout, sound('slash', reveal), voice('monster', 5, reveal + moments.squeal)],
    };
  },
} as const;

/** One way a monster strikes back: what is seen when the hero dodges it, and when it lands. */
interface Strike {
  dodged: (moment: Moment) => Beat;
  hit: (moment: Moment) => Beat;
  /** Whether the monster leaves its place, so its life bar waits there unseen meanwhile. */
  leaves: boolean;
}

/** The ways a monster strikes back. */
export const strikes = {
  /** It charges at the hero, who jumps clear in a flash of shield, or is knocked over. */
  charge: {
    leaves: true,
    dodged: (moment) => ({
      staging: {
        monster: { acts: [{ kind: 'charge', at: moment.at, reach: reach.slime }] },
        hero: { acts: [{ kind: 'cheer', at: moment.at + reveal - moments.dodge }] },
        effects: [shieldUp(moment.at + reveal - moments.dodge)],
      },
      cues: [voice('monster', 4), sound('slash', reveal - moments.dodge)],
    }),
    hit: (moment) => ({
      staging: {
        monster: { acts: [{ kind: 'charge', at: moment.at, reach: reach.slime }] },
        hero: knockedOver(moment, moment.at + reveal),
      },
      cues: [voice('monster', 4), sound('bump', reveal), voice('hero', 2, reveal + moments.ouch)],
    }),
  },
  /** It spits a ball of slime: skimming the ground for the hero to jump, or lobbed to splash. */
  spit: {
    leaves: false,
    dodged: (moment) => ({
      staging: {
        monster: { acts: [{ kind: 'cheer', at: moment.at }] },
        hero: { acts: [{ kind: 'cheer', at: moment.at + reveal - moments.dodge }] },
        effects: [slimeShot(moment.at, shotReach * spitting.onward, reveal * spitting.onward, 0)],
      },
      cues: [voice('monster', 3), sound('spit'), sound('slash', reveal - moments.dodge)],
    }),
    hit: (moment) => ({
      staging: {
        monster: { acts: [{ kind: 'cheer', at: moment.at }] },
        hero: knockedOver(moment, moment.at + reveal),
        effects: [
          slimeShot(moment.at, shotReach, reveal, spitting.lob),
          slimeSplash(moment.at + reveal),
        ],
      },
      cues: [
        voice('monster', 3),
        sound('spit'),
        sound('splash', reveal),
        voice('hero', 2, reveal + moments.ouch),
      ],
    }),
  },
  /**
   * A body slam, a big monster's, once enraged: it jumps high at the hero and lands with a
   * thud, the hero running back out of the way, or squashed flat and knocked over.
   */
  slam: {
    leaves: true,
    dodged: (moment) => ({
      staging: {
        monster: { acts: [{ kind: 'pounce', at: moment.at, reach: reach.slime }] },
        hero: { acts: [{ kind: 'charge', at: moment.at + moments.evade, reach: -reach.sidestep }] },
        effects: [dust(moment.at + reveal)],
      },
      cues: [voice('monster', 6), sound('bump', reveal), voice('hero', 2, reveal + moments.ouch)],
    }),
    hit: (moment) => ({
      staging: {
        monster: { acts: [{ kind: 'pounce', at: moment.at, reach: reach.slime }] },
        hero: knockedOver(moment, moment.at + reveal),
        effects: [dust(moment.at + reveal)],
      },
      cues: [voice('monster', 6), sound('bump', reveal), voice('hero', 2, reveal + moments.ouch)],
    }),
  },
} as const satisfies Record<string, Strike>;
export type StrikeName = keyof typeof strikes;

/** Three moments a tease's steps come at, from its start. */
const steps = (at: number) => [0, 1, 2].map((index) => at + index * teasing.apart);

/**
 * The ways a monster teases the heroes between two sums, and how the hero answers it. None
 * costs anything; they are there for the fun of it, as the owner asked.
 */
export const teases = {
  /** It hops about crossly, with an angry sign; the hero shakes a fist back. */
  taunt: (at: number): Beat => ({
    staging: {
      monster: {
        acts: [0, 2].map((index) => ({ kind: 'leap', at: at + index * teasing.apart }) as const),
        sign: { sheet: 'angry', at },
      },
      hero: { acts: [{ kind: 'attack', at: at + teasing.ducks * 2 }] },
    },
    cues: [voice('monster', 8), voice('hero', 2, teasing.ducks * 2)],
  }),
  /** It throws pebbles, which the hero hops over. */
  pebbles: (at: number): Beat => ({
    staging: {
      monster: { acts: steps(at).map((time) => ({ kind: 'cheer', at: time }) as const) },
      hero: {
        acts: steps(at).map((time) => ({ kind: 'cheer', at: time + teasing.ducks }) as const),
      },
      effects: steps(at).map((time) => pebbleThrow(time)),
    },
    cues: [voice('monster', 5)],
  }),
  /** It turns its back and kicks grass at the hero, who splutters. */
  sand: (at: number): Beat => ({
    staging: {
      monster: {
        facing: 'right',
        acts: steps(at).map((time) => ({ kind: 'cheer', at: time }) as const),
      },
      hero: { acts: [{ kind: 'hurt', at: at + teasing.ducks }] },
      effects: steps(at).map((time) => grassKick(time)),
    },
    cues: [voice('monster', 4), voice('hero', 3, teasing.ducks * 2)],
  }),
  /**
   * A dog's: it chases its own tail round and round, and barks; the hero looks on, puzzled.
   * It never turns its back on the heroes for long, as kicking grass at them would.
   */
  tail: (at: number): Beat => {
    const round = motionTokens.act.spin.seconds;
    return {
      staging: {
        monster: {
          acts: [
            { kind: 'spin', at },
            { kind: 'spin', at: at + round },
          ],
          sign: { sheet: 'star', at: at + round },
        },
        hero: { sign: { sheet: 'question', at: at + teasing.ducks } },
      },
      cues: [voice('monster', 4), sound('bark', round)],
    };
  },
  /**
   * It runs off behind the bushes and comes back waving a spear, angry; the hero stands ready.
   * Only for show: a spear that makes it hit harder belongs to a monster's phases.
   */
  spear: (at: number): Beat => {
    const back = at + motionTokens.act.charge.out + motionTokens.act.charge.hold;
    const shown = back + motionTokens.act.charge.back;
    return {
      staging: {
        monster: {
          acts: [
            { kind: 'charge', at, reach: -teasing.away },
            { kind: 'leap', at: shown },
          ],
          sign: { sheet: 'angry', at: shown },
        },
        hero: { sign: { sheet: 'alert', at: shown } },
        effects: [spearHeld(shown)],
      },
      cues: [voice('monster', 3), voice('monster', 6, shown - at)],
    };
  },
} as const;
export type Tease = keyof typeof teases;

/** How the monster acts at a turn, as drawn from the fight's seed (`antics.ts`). */
export interface Ways {
  strike: StrikeName;
  evasion: Evasion;
}

/**
 * The beat an answer plays, from what the rules made of it: the monster's blow dodged or
 * landing on a turn to defend; on a turn to attack, a stroke (the last one a victory, with
 * this many coins), the monster getting out of the way, bouncing the hero over, or eating;
 * against a monster that `befriends`, treats thrown instead of strokes.
 */
export function answerBeat(
  next: Fight,
  before: Fight,
  moment: Moment,
  ways: Ways,
  coins: number,
  befriends = false,
): Beat {
  if (before.threat) {
    const strike = strikes[ways.strike];
    if (next.last === 'guarded') return guarded(strike.dodged(moment), moment.at, reveal);
    return next.last === 'dodged' ? strike.dodged(moment) : strike.hit(moment);
  }
  if (next.last === 'fed') return attacks.fed(moment);
  if (next.last === 'shielded' || next.last === 'shattered') {
    return attacks.shielded(moment, next.last === 'shattered');
  }
  if (next.last === 'bumped') return attacks.bumped(moment);
  const power = next.last === 'smashed';
  if (next.last === 'guarded') {
    // A charm turned the blow aside: as a dodge, the charm glowing about the hero.
    return guarded(
      befriends
        ? attacks.missed(moment, ways.evasion, false)
        : attacks.evaded(moment, ways.evasion, false),
      moment.at,
      reveal,
    );
  }
  const nicked = next.last === 'nicked';
  if (befriends) {
    if (next.last !== 'struck' && !power) return attacks.missed(moment, ways.evasion, nicked);
    return next.outcome === 'won'
      ? attacks.befriended(moment, power, coins)
      : attacks.treat(moment, power);
  }
  if (next.last === 'struck' || power) {
    return next.outcome === 'won'
      ? attacks.victory(moment, power, coins)
      : attacks.stroke(moment, power);
  }
  return attacks.evaded(moment, ways.evasion, nicked);
}

/**
 * A beat begun at `at` with a charm turning a blow aside `after` seconds in: a golden shield
 * glowing about the hero, and a clang, so it is seen what the treasure did.
 */
export function guarded(beat: Beat, at: number, after: number): Beat {
  return {
    staging: { ...beat.staging, effects: [...(beat.staging.effects ?? []), charmGlow(at + after)] },
    cues: [...beat.cues, sound('clang', after)],
  };
}

/** How long the monster glares at the hero it has walked up to, before it turns back. */
export const glare = 0.6;

/**
 * The monster reaching the hero it walked up to while a sum was thought over (`walking` is its
 * walk): it roars and steps back, or, with a sword whose monsters strike in time, it pounces,
 * knocking the hero over.
 */
export const reached = {
  roar: (at: number, walking: Act): Beat => ({
    staging: {
      monster: {
        acts: [walking, { kind: 'return', at: at + glare, reach: reach.slime }],
        sign: { sheet: 'angry', at },
      },
    },
    cues: [voice('monster', 8)],
  }),
  pounce: (moment: Moment, walking: Act): Beat => ({
    staging: {
      monster: { acts: [walking, { kind: 'return', at: moment.at + glare, reach: reach.slime }] },
      hero: knockedOver(moment, moment.at),
    },
    cues: [voice('monster', 4), sound('bump'), voice('hero', 2, moments.ouch)],
  }),
} as const;

/**
 * How the stage stands when a fight is opened again at `at`, rather than played to where it
 * is: a hero out of hearts lies resting; a monster won over (`befriends`) stays by the
 * heroes; a beaten monster is gone, as it vanished at the victory, and the heroes (`others` the
 * ones waiting behind, by their players' ids) dance by the flag where the monster stood (its
 * `middle`) while fireworks burst a little again.
 */
export function aftermath(
  fight: Fight,
  at: number,
  others: readonly string[],
  middle: number,
  befriends = false,
): Staging {
  if (fight.outcome === 'lost') {
    // The hero rests where they lay down, out of hearts, sleepy.
    return {
      hero: {
        acts: [{ kind: 'lie', at: Number.NEGATIVE_INFINITY }],
        sign: { sheet: 'sleepy', at },
      },
    };
  }
  return fight.outcome === 'won'
    ? {
        hero: { acts: [dance(at, 0)] },
        bench: Object.fromEntries(
          others.map((id, index) => [id, { acts: [dance(at, index + 1)] }]),
        ),
        // A monster won over stays by the heroes; one beaten is gone, the flag where it stood.
        monster: {
          acts: [
            befriends
              ? byHeroes(Number.NEGATIVE_INFINITY)
              : { kind: 'vanish', at: Number.NEGATIVE_INFINITY },
          ],
        },
        effects: [
          ...(befriends ? [] : [flagPlanted(at - flagFall.seconds, middle)]),
          ...fireworks(at, celebration.again, celebration.every),
        ],
      }
    : {};
}

/** How a phase begins: the energy gathering for a shield, one spark after another, and after. */
export const phasing = { gather: 0.9, apart: 0.08, after: 0.9 } as const;

/**
 * How a monster enters a new phase, as the owner asked, so it is felt that the fight grows
 * harder rather than a change just popping up: these play between two sums, at `at`, the
 * monster's `middle` where it stands, before the next sum comes.
 */
export const phases = {
  /** Enraged: it spins round like a top, swells up trembling with a roar and a stamp, and back. */
  rage: (at: number): Beat => {
    const swelling = at + motionTokens.act.spin.seconds;
    return {
      staging: {
        monster: {
          acts: [
            { kind: 'spin', at },
            { kind: 'swell', at: swelling },
          ],
          sign: { sheet: 'angry', at: swelling },
        },
        hero: { sign: { sheet: 'alert', at: swelling } },
      },
      cues: [
        voice('monster', 4),
        voice('monster', 10, swelling - at),
        sound('bump', swelling - at + motionTokens.act.swell.up),
      ],
    };
  },
  /**
   * A shield: sparks of energy fly in from all round the stage and gather in the monster, it
   * swells as they meet, and the shield forms in a flash of light, with a clang and a roar.
   */
  shield: (at: number, middle: number): Beat => {
    const formed = at + phasing.gather + phasing.apart * (energyFrom.length - 1);
    return {
      staging: {
        monster: {
          acts: [{ kind: 'swell', at: formed - motionTokens.act.swell.up }],
          sign: { sheet: 'alert', at },
        },
        hero: { sign: { sheet: 'alert', at: formed } },
        effects: [
          ...energyFrom.map((from, index) =>
            energy(at + index * phasing.apart, from, middle, phasing.gather),
          ),
          shieldFlash(formed, middle),
        ],
      },
      cues: [
        sound('gather'),
        voice('monster', 3),
        sound('powerUp', formed - at),
        sound('clang', formed - at),
        voice('monster', 8, formed - at),
      ],
    };
  },
} as const;
export type Phase = keyof typeof phases;

/** How long each phase's beginning lasts, in seconds, before the next sum comes. */
export const phaseSeconds: Readonly<Record<Phase, number>> = {
  rage:
    motionTokens.act.spin.seconds +
    motionTokens.act.swell.up +
    motionTokens.act.swell.hold +
    motionTokens.act.swell.down,
  shield: phasing.gather + phasing.apart * (energyFrom.length - 1) + phasing.after,
};

/** The phase a fight entered at the last answer, if it did: a shield rising, or enraged. */
export function phaseEntered(next: Fight, before: Fight): Phase | undefined {
  if (next.outcome !== 'fighting') return undefined;
  if (next.shieldRaised && !before.shieldRaised) return 'shield';
  return next.enraged && !before.enraged ? 'rage' : undefined;
}

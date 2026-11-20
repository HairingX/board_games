import { useEffect, useEffectEvent, useState, type CSSProperties, type ReactNode } from 'react';
import type { Profile } from '../../family/family';
import { formatNumber } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import { common } from '../../ui/text';
import { seeded, type Random } from '../../lib/random';
import { chimes } from '../../lib/sound/chimes';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { nextTurn } from '../../lib/turns';
import { motionTokens } from '../../ui/motion';
import { SceneCanvas, type LoadPicture } from '../../ui/SceneCanvas';
import {
  answerFight,
  fullHealth,
  coinsEach,
  powerAfter,
  reachedHero,
  startFight,
  type Blow,
  type Fight as FightState,
} from './battle';
import { faces, hud, swordPictures, topFrames } from './art';
import { heroFaces } from './heroes';
import {
  benchAt,
  clearing,
  clearingSheets,
  coinDrop,
  coinSpots,
  heroAt,
  puff,
  reach,
  shieldUp,
  shotReach,
  slimeAt,
  slimeShot,
  slimeSplash,
  smash,
  sweep,
  type Party,
  type Staging,
} from './clearing';
import type { PlayerSettings } from './players';
import { seeds, type SavedFight } from './fightSave';
import { monsterName } from './names';
import { approachSeconds, withTime } from './pace';
import { monsterLives, swordRules } from './swords';
import { hits, music, sounds, victoryLength, type Mixed } from './sounds';
import { pick } from './sums';
import { TaskAnswers } from './TaskAnswers';
import { freshFor, judge, makeTask, sumKey, type Task } from './tasks';
import { text } from './text';
import type { Value } from './values';
import './regnespil.css';

/** The music a fight reads into memory before it is needed, so it plays without the internet. */
export const fightMusic = [music.fight.url, music.victory.url];

/**
 * How often the slime spits a ball of slime when it strikes back, rather than charging, so its
 * blows are not all alike; how high, in pixels, a ball that hits is lobbed; and, when the hero
 * jumps clear of one skimming the ground, how much further it flies on.
 */
const spitting = { share: 0.5, lob: 12, onward: 1.8 } as const;

/** Whether the blow was a stroke at the monster, a power stroke or not. */
const isStroke = (blow: Blow | undefined) => blow === 'struck' || blow === 'smashed';

/** Whether the blow hurt the hero, so the scene shakes. */
const isHurt = (blow: Blow | undefined) => blow === 'bumped' || blow === 'hit' || blow === 'nicked';

/** Where the purses stand at the right of the stage, one under another, in its pixels. */
const purseX = 128;
const purseTop = (index: number) => 4 + index * 14;

/** How wide the life bar under the monster is, in the stage's pixels. */
const lifeWidth = 24;

/**
 * When the answer shows after it is chosen, in seconds: as the hero reaches the monster, or
 * the monster the hero, so there is a moment of hope first, as the owner asked.
 */
const reveal = motionTokens.act.charge.out;

/**
 * When things happen around the answer showing, in seconds from it: the slime squeals at a
 * stroke; it hops into a hero whose answer was far off just before it shows; the hero jumps
 * clear of a blow dodged just before it lands; an enraged slime roars a moment after; a power
 * stroke's second hit follows its first.
 */
const moments = {
  squeal: 0.15,
  hop: 0.1,
  dodge: 0.1,
  ouch: 0.15,
  rage: 0.5,
  second: 0.12,
  settle: 1,
  glare: 0.6,
} as const;

/**
 * The slime walking up to the hero while a sum is thought over: when the sum was asked, when
 * the walk begins, and how long it takes, on the page's clock, in seconds.
 */
interface Walk {
  asked: number;
  at: number;
  lasts: number;
}

/**
 * A walk for the player whose turn it is, asked their sum at `at`, at their own pace, if it is
 * a turn to attack.
 */
function walkFor(
  paces: Readonly<Record<string, readonly number[]>>,
  turn: SavedFight,
  at: number,
): Walk | undefined {
  return turn.fight.outcome === 'fighting' && !turn.fight.threat && !turn.fight.hungry
    ? { asked: at, at: at + moments.settle, lasts: approachSeconds(paces[turn.activeId]) }
    : undefined;
}

/**
 * The heroes changing places as the turn passes: the one whose turn it is now steps forward
 * from their place behind, and the one whose turn it was steps back into theirs.
 */
function changePlaces(ids: readonly string[], was: string, now: string, at: number): Staging {
  const behind = (front: string) => ids.filter((id) => id !== front);
  const places = benchAt(ids.length - 1);
  const from = places[behind(was).indexOf(now)] as { x: number; y: number };
  const to = places[behind(now).indexOf(was)] as { x: number; y: number };
  return {
    hero: { acts: [{ kind: 'step', at, from: { x: from.x - heroAt.x, y: from.y - heroAt.y } }] },
    bench: {
      [was]: { acts: [{ kind: 'step', at, from: { x: heroAt.x - to.x, y: heroAt.y - to.y } }] },
    },
  };
}

/** The slime's walk as an act. */
const approachOf = (walk: Walk) =>
  ({ kind: 'approach', at: walk.at, reach: reach.slime, lasts: walk.lasts }) as const;

/** How far the slime has walked at the moment, in pixels. */
const walkedAt = (walk: Walk | undefined, seconds: number) =>
  walk && seconds > walk.at
    ? Math.round(reach.slime * Math.min(1, (seconds - walk.at) / walk.lasts))
    : 0;

/**
 * When the victory's moments come after the last stroke, in seconds: the slime vanishing, its
 * puff, the first coin springing out and the next after it, and the heroes' cheers.
 */
const victory = {
  vanish: 0.12,
  puff: 0.3,
  coins: { first: 0.45, apart: 0.07 },
  cheers: [0.8, 1.5],
} as const;

/** When a victory's coin springs out, after the last stroke shows, in seconds. */
const coinAt = (index: number) => victory.coins.first + index * victory.coins.apart;

/**
 * A victory's coins, to pick up: when the last stroke showed, on the page's clock; how many
 * have landed, to be picked up; how many each player had before, so the purses count up as
 * the coins are taken; and which have been taken. Coin `i` is for player `i` round the table.
 */
interface Loot {
  at: number;
  landed: number;
  before: readonly number[];
  taken: ReadonlySet<number>;
}

interface Props {
  players: readonly Profile[];
  /** Each player's level and sword, in the players' order. */
  settings: readonly PlayerSettings[];
  /** Back to choosing levels and swords. */
  onBack: () => void;
  /** The fight as saved, to go on from, or null to begin one. */
  saved: SavedFight | null;
  /** Saves the fight, after every answer and when a new one begins. */
  onSave: (fight: SavedFight) => void;
  /** Puts coins in the players' purses, as many as each is given, in the players' order. */
  onCoins: (gains: readonly number[]) => void;
  /** Shown at the right of the header: the sound's levels. */
  aside?: ReactNode;
  random?: Random;
  sound?: SoundEngine;
  /** The page's clock in seconds; the tests give their own. */
  now?: () => number;
  load?: LoadPicture;
}

const pageClock = () => performance.now() / 1000;

/** The sums shown lately, with the task's, the latest last. */
function shownWith(recent: readonly string[], task: Task): readonly string[] {
  return [...recent, sumKey(task.sum)].slice(-freshFor);
}

/**
 * The stage after an answer chosen at `at`, the fight as it was before it and after: who acts,
 * what shows over their heads, and the effects. Attacking, the hero runs at the slime, and as
 * they reach it the answer shows: a stroke, a parry, or the slime bouncing them over.
 * Defending, the slime runs at the hero, and as it reaches them the hero jumps clear or is
 * knocked over; or it `spits` a ball of slime at them, which they jump over or are splashed
 * by. A slime that had `walked` toward the hero hurries home first. At a victory the heroes
 * waiting behind, by these ids, cheer too.
 */
function stage(
  fight: FightState,
  before: FightState,
  at: number,
  walked: number,
  others: readonly string[],
  spits: boolean,
): Staging {
  const { attack, knocked } = motionTokens.act;
  const hurry = walked > 0 ? [{ kind: 'return', at, reach: walked } as const] : [];
  const shown = at + reveal;
  const down = {
    sheet: fight.outcome === 'lost' ? 'sleepy' : 'dizzy',
    at: shown + knocked.fall + knocked.down,
  } as const;
  if (spits && fight.last === 'dodged') {
    // The ball skims along the ground, the hero jumps over it, and it flies on.
    const { onward } = spitting;
    return {
      slime: { acts: [{ kind: 'cheer', at }] },
      hero: { acts: [{ kind: 'cheer', at: shown - moments.dodge }] },
      effects: [slimeShot(at, shotReach * onward, reveal * onward, 0)],
    };
  }
  if (spits && fight.last === 'hit') {
    // A lob of slime that splashes over the hero, who goes over.
    return {
      slime: { acts: [{ kind: 'cheer', at }] },
      hero: { acts: [{ kind: 'knocked', at: shown }], sign: down },
      effects: [slimeShot(at, shotReach, reveal, spitting.lob), slimeSplash(shown)],
    };
  }
  if (fight.last === 'dodged' || fight.last === 'hit') {
    const run = { kind: 'charge', at, reach: reach.slime } as const;
    if (fight.last === 'dodged') {
      return {
        slime: { acts: [run] },
        hero: { acts: [{ kind: 'cheer', at: shown - moments.dodge }] },
        effects: [shieldUp(shown - moments.dodge)],
      };
    }
    return { slime: { acts: [run] }, hero: { acts: [{ kind: 'knocked', at: shown }], sign: down } };
  }
  const run = { kind: 'charge', at, reach: reach.hero } as const;
  if (fight.last === 'fed') {
    // The stroke misses: the slime has turned to the bush, and eats.
    return {
      hero: {
        acts: [
          run,
          { kind: 'attack', at: shown, reach: reach.hero },
          { kind: 'return', at: shown + attack.seconds, reach: reach.hero },
        ],
      },
      slime: { facing: 'right', acts: hurry, sign: { sheet: 'heart', at: shown } },
    };
  }
  if (fight.last === 'bumped') {
    return {
      hero: { acts: [run, { kind: 'knocked', at: shown, reach: reach.hero }], sign: down },
      slime: { acts: [...hurry, { kind: 'cheer', at: shown - moments.hop }] },
    };
  }
  const home = shown + attack.seconds;
  const strike = [
    run,
    { kind: 'attack', at: shown, reach: reach.hero },
    { kind: 'return', at: home, reach: reach.hero },
  ] as const;
  const cuts = fight.last === 'smashed' ? [sweep(shown), smash(shown)] : [sweep(shown)];
  if (!isStroke(fight.last)) {
    return {
      hero: {
        acts: [
          ...strike,
          ...(fight.last === 'nicked'
            ? [{ kind: 'hurt', at: home + motionTokens.act.return.seconds } as const]
            : []),
        ],
      },
      slime: { acts: hurry, sign: { sheet: 'alert', at: shown } },
    };
  }
  if (fight.outcome === 'won') {
    const cheers = victory.cheers.map((cheer) => ({ kind: 'cheer', at: shown + cheer }) as const);
    return {
      bench: Object.fromEntries(others.map((id) => [id, { acts: cheers }])),
      hero: {
        acts: [...strike, ...cheers],
        sign: { sheet: 'heart', at: shown + victory.cheers[0] },
      },
      slime: { acts: [...hurry, { kind: 'vanish', at: shown + victory.vanish }] },
      effects: [
        ...cuts,
        puff(shown + victory.puff),
        ...coinSpots
          .slice(0, (others.length + 1) * coinsEach)
          .map((spot, index) => coinDrop(shown + coinAt(index), spot)),
      ],
    };
  }
  const rage = fight.enraged && !before.enraged;
  return {
    hero: { acts: strike },
    slime: {
      acts: [...hurry, { kind: 'hurt', at: shown + victory.vanish }],
      ...(rage ? { sign: { sheet: 'angry', at: shown + moments.rage } as const } : {}),
    },
    effects: cuts,
  };
}

/**
 * The first stage: the hero against a slime in the forest clearing, with the fight's music.
 * The players take turns, each with a sum at their own level, and what a wrong answer costs is
 * their own sword's. An answer chosen sends the hero running at the slime, and only as they
 * reach it does it show how it went: a right answer strikes the slime; a close one is parried;
 * one far off lets the slime bounce the hero over. While a sum is thought over, the slime walks
 * slowly up to the hero, at the player's own pace (`pace.ts`): it roars and steps back, or,
 * with the flame sword, strikes. Halfway the slime grows enraged. The next
 * sum comes by itself after a short pause. A won fight ends with a fanfare, a puff of smoke,
 * coins springing out and a cheering hero; a lost one with the hero resting.
 */
export function Fight({
  players,
  settings,
  onBack,
  saved,
  onSave,
  onCoins,
  aside,
  random = Math.random,
  sound = defaultSound,
  now = pageClock,
  load,
}: Props) {
  const t = useMessages(text);
  const c = useMessages(common);
  const locale = useLocale();
  const own = (index: number) => settings[index] as PlayerSettings;
  const first = players[0] as Profile;
  /** A new fight, the first player's turn, its sum none of those shown lately. */
  const fresh = (recent: readonly string[]): SavedFight => {
    const lives = monsterLives(settings.map((one) => one.sword));
    return {
      fight: startFight(lives),
      lives,
      activeId: first.id,
      task: makeTask(own(0).level, random, recent),
      recent,
      seed: Math.floor(random() * seeds),
    };
  };
  /** The fight as it stands and goes on, as saved. */
  const [save, setSave] = useState<SavedFight>(() => saved ?? fresh([]));
  /**
   * What it shows: whose turn, their sum, whether it is a turn to defend, and the fight. The
   * saved ones, except after an answer: the fight as it was until the answer shows, and the
   * sum just answered through the pause, while the save already holds what comes next.
   */
  const [view, setView] = useState({
    activeId: save.activeId,
    task: save.task,
    threat: save.fight.threat,
    hungry: save.fight.hungry,
    fight: save.fight,
  });
  const { lives } = save;
  const fight = save.fight;
  const shown = view.fight;
  const task = view.task;
  const active = Math.max(
    0,
    players.findIndex((one) => one.id === view.activeId),
  );
  const [chosen, setChosen] = useState<Value>();
  /** Whether how the answer chosen went shows yet. */
  const [revealed, setRevealed] = useState(false);
  /** A victory's coins, while they are there to pick up. */
  const [loot, setLoot] = useState<Loot>();
  /** Whether the slime spat at the hero, rather than charging, at the last answer. */
  const [spat, setSpat] = useState(false);
  /** How many lives the last stroke took. */
  const [damage, setDamage] = useState(0);
  const [staging, setStaging] = useState<Staging>({});
  /** How long each player took over their latest sums, by their profile's id. */
  const [paces, setPaces] = useState<Readonly<Record<string, readonly number[]>>>({});
  /** The slime's walk up to the hero now, or the next one. */
  const [walk, setWalk] = useState(() => walkFor({}, save, now()));
  /** Whether the slime is on its way, so its life bar goes with it. */
  const [walking, setWalking] = useState(false);
  /** How long the life bar takes to come back, in seconds, after the slime left it. */
  const [back, setBack] = useState(0);
  /** How many walks ended in a roar or a blow, so the life bar comes back afresh. */
  const [walks, setWalks] = useState(0);

  function keep(next: SavedFight): void {
    setSave(next);
    onSave(next);
  }
  /** How many answers have been given, so what one answer starts plays out afresh. */
  const [answers, setAnswers] = useState(0);

  // The sounds are made ready when the fight opens, so the first one plays at once, and the
  // music fades out when it is left.
  useEffect(() => {
    void sound.prepareEffects([...Object.values(sounds), ...hits].map(({ url }) => url));
    void sound.prepareMusic(fightMusic);
    return () => {
      sound.stopMusic();
    };
  }, [sound]);

  // A fight shown won stops its music for the jingle, which gives way to the victory's music,
  // until a new fight begins.
  const outcome = shown.outcome;
  useEffect(() => {
    if (outcome !== 'won') return;
    sound.stopMusic();
    const timer = setTimeout(() => {
      sound.music(music.victory.url, music.victory.gain);
    }, victoryLength * 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [outcome, sound]);

  // Each of a victory's coins becomes one to pick up as it lands.
  const lootAt = loot?.at;
  const coins = players.length * coinsEach;
  useEffect(() => {
    if (lootAt === undefined) return;
    const timers = Array.from({ length: coins }, (_, index) =>
      setTimeout(
        () => {
          // The timers stop when the victory's coins go, so they are there.
          setLoot((known) => {
            const coinsThere = known as Loot;
            return { ...coinsThere, landed: Math.max(coinsThere.landed, index + 1) };
          });
        },
        Math.max(0, lootAt + coinAt(index) + motionTokens.effect.flight - now()) * 1000,
      ),
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [lootAt, coins, now]);

  function play({ url, gain }: Mixed): void {
    sound.music(url, gain);
  }

  function effect({ url, gain }: Mixed, after = 0): void {
    void sound.effect(url, gain, after);
  }

  // An answer chosen shows how it went as the hero reaches the slime. Then the fight pauses,
  // so the stroke and the right answer can be seen, the turn passes and the next sum comes by
  // itself; sooner after a right answer.
  useEffect(() => {
    if (chosen === undefined) return;
    if (!revealed) {
      const timer = setTimeout(() => {
        setRevealed(true);
        setView((before) => ({ ...before, fight: save.fight }));
      }, reveal * 1000);
      return () => {
        clearTimeout(timer);
      };
    }
    if (fight.outcome !== 'fighting') return;
    const { right, wrong } = motionTokens.fightPause;
    const timer = setTimeout(
      () => {
        setView({
          activeId: save.activeId,
          task: save.task,
          threat: save.fight.threat,
          hungry: save.fight.hungry,
          fight: save.fight,
        });
        setChosen(undefined);
        setRevealed(false);
        setWalk(walkFor(paces, save, now()));
        const at = now();
        const ids = players.map((one) => one.id);
        // The heroes change places, and the monster announces its blow, a sign over its head
        // and a growl, or that it goes to eat, turning to the bush with a hum.
        const places =
          save.activeId === view.activeId
            ? {}
            : changePlaces(ids, view.activeId, save.activeId, at);
        if (save.fight.threat) {
          setStaging({ ...places, slime: { sign: { sheet: 'alert', at } } });
          sound.babble(voices.slime, 2);
        } else if (save.fight.hungry) {
          setStaging({ ...places, slime: { facing: 'right', sign: { sheet: 'star', at } } });
          sound.babble(voices.slime, 3);
        } else {
          // The slime turns back to the heroes, if it had turned to eat.
          setStaging((before) => ({ ...before, ...places, slime: {} }));
        }
      },
      (isStroke(fight.last) || fight.last === 'dodged' ? right : wrong) * 1000,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [chosen, revealed, fight, save, now, sound, paces, players, view.activeId]);

  // The slime walks up to the hero while the sum is thought over; once there, it roars and
  // steps back, or, with a sword whose monsters strike in time, strikes.
  const reached = useEffectEvent((walk: Walk) => {
    const at = now();
    const ownSword = own(active).sword;
    const { knocked } = motionTokens.act;
    const home = { kind: 'return', at: at + moments.glare, reach: reach.slime } as const;
    const next = reachedHero(fight, ownSword);
    const struck = next !== fight;
    setWalking(false);
    setWalks(walks + 1);
    setBack(moments.glare + motionTokens.act.return.seconds);
    if (struck) {
      keep({ ...save, fight: next });
      setView((before) => ({ ...before, fight: next }));
      setStaging({
        slime: { acts: [approachOf(walk), home] },
        hero: {
          acts: [{ kind: 'knocked', at }],
          sign: {
            sheet: next.outcome === 'lost' ? 'sleepy' : 'dizzy',
            at: at + knocked.fall + knocked.down,
          },
        },
      });
      sound.babble(voices.slime, 4);
      effect(sounds.bump);
      sound.babble(voices.hero, 2, undefined, moments.ouch);
    } else {
      setStaging({ slime: { acts: [approachOf(walk), home], sign: { sheet: 'angry', at } } });
      sound.babble(voices.slime, 8);
    }
    const rested = struck ? knocked.fall + knocked.down + knocked.rise : 0;
    setWalk(
      next.outcome === 'fighting'
        ? {
            ...walk,
            at: at + moments.glare + motionTokens.act.return.seconds + rested + moments.settle,
          }
        : undefined,
    );
  });
  useEffect(() => {
    if (!walk || chosen !== undefined) return;
    const at = now();
    const begin = setTimeout(
      () => {
        setWalking(true);
      },
      Math.max(0, walk.at - at) * 1000,
    );
    const end = setTimeout(
      () => {
        reached(walk);
      },
      Math.max(0, walk.at + walk.lasts - at) * 1000,
    );
    return () => {
      clearTimeout(begin);
      clearTimeout(end);
    };
  }, [walk, chosen, now]);

  function restart(): void {
    play(music.fight);
    const next = fresh(shownWith(save.recent, task));
    keep(next);
    setView({
      activeId: next.activeId,
      task: next.task,
      threat: false,
      hungry: false,
      fight: next.fight,
    });
    setChosen(undefined);
    setRevealed(false);
    setStaging({});
    setLoot(undefined);
    setBack(0);
    setWalking(false);
    setWalk(walkFor(paces, next, now()));
  }

  function answer(choice: Value): void {
    // The music starts from a tap, as browsers ask; it goes on if it already plays.
    play(music.fight);
    const verdict = judge(choice, task.answer, task.near);
    const next = answerFight(fight, verdict, own(active).sword, random);
    // Saved at once with the next turn and its sum, so a closed app goes on from there.
    const following = nextTurn(active, players.length);
    const recent = shownWith(save.recent, task);
    keep({
      ...save,
      fight: next,
      activeId: (players[following] as Profile).id,
      task: makeTask(own(following).level, random, recent),
      recent,
    });
    const at = now();
    // The slime, if it was on its way, hurries home as the hero runs at it.
    const walked = walkedAt(walk, at);
    const others = players.filter((one) => one.id !== view.activeId).map((one) => one.id);
    // Striking back, the slime charges or spits, as the fight's seed has it for this turn.
    const spits = fight.threat && seeded(save.seed + fight.round)() < spitting.share;
    setSpat(spits);
    setStaging(stage(next, fight, at, walked, others, spits));
    if (walk) {
      setPaces({ ...paces, [view.activeId]: withTime(paces[view.activeId], at - walk.asked) });
    }
    setWalk(undefined);
    setWalking(false);
    setBack(walked > 0 ? motionTokens.act.return.seconds : 0);
    setChosen(choice);
    setDamage(fight.lives - next.lives);
    setAnswers(answers + 1);
    effect(sounds.choose);
    // How it went is heard as it shows.
    sound.chime(chimes[verdict], random, reveal);
    if (spits) {
      // The slime cries out and spits.
      sound.babble(voices.slime, 3);
      effect(sounds.spit);
    } else if (fight.threat) {
      // The slime cries out as it charges.
      sound.babble(voices.slime, 4);
    } else {
      // The hero shouts as they run at the slime.
      sound.babble(voices.hero, 2);
    }
    if (isStroke(next.last)) {
      effect(sounds.slash, reveal);
      effect(pick(random, hits), reveal);
      // A power stroke lands twice.
      if (next.last === 'smashed') effect(pick(random, hits), reveal + moments.second);
      // The slime squeals at the blow, cross at being struck.
      sound.babble(voices.slime, 3, undefined, reveal + moments.squeal);
      if (next.outcome === 'won') {
        // The coins go in the purses at once, so none is lost; picking them up shows them.
        onCoins(players.map(() => coinsEach));
        setLoot({
          at: at + reveal,
          landed: 0,
          before: settings.map((one) => one.coins),
          taken: new Set(),
        });
        effect(sounds.victory, reveal);
        sound.babble(voices.hero, 6, undefined, reveal + victory.cheers[0]);
      } else if (next.enraged && !fight.enraged) {
        // Halfway, enraged: it roars.
        sound.babble(voices.slime, 8, undefined, reveal + moments.rage);
      }
    } else if (next.last === 'fed') {
      // The slime munches its berries, pleased.
      effect(sounds.slash, reveal);
      sound.babble(voices.slime, 5, undefined, reveal + moments.squeal);
    } else if (next.last === 'dodged') {
      // The slime misses: the hero jumps clear with a swish.
      effect(sounds.slash, reveal - moments.dodge);
    } else if (next.last === 'bumped' || next.last === 'hit') {
      if (next.last === 'bumped') sound.babble(voices.slime, 3, undefined, reveal - moments.hop);
      // The bump or the splash, and the hero's "ouch", as it lands.
      effect(spits ? sounds.splash : sounds.bump, reveal);
      sound.babble(voices.hero, 2, undefined, reveal + moments.ouch);
    } else {
      effect(sounds.clang, reveal);
      // The slime giggles at the parry.
      sound.babble(voices.slime, 2, undefined, reveal + moments.squeal);
    }
  }

  const player = players[active] as Profile;
  const sword = own(active).sword;
  /** What a wrong answer costs the active player, in half hearts, at its worst. */
  const cost = swordRules[sword].far;
  const px = (pixels: number) => `calc(var(--px) * ${String(pixels)})`;
  const { charge } = motionTokens.act;

  /** The monster's name, made from the fight's seed. */
  const name = monsterName(t.names.slime, save.seed);
  const party: Party = {
    front: own(active).hero,
    bench: players.flatMap((one, index) =>
      index === active ? [] : [{ id: one.id, hero: own(index).hero }],
    ),
  };
  const scene = clearing(
    walk
      ? {
          ...staging,
          slime: { ...staging.slime, acts: [...(staging.slime?.acts ?? []), approachOf(walk)] },
        }
      : staging,
    party,
    shown.enraged,
    shown.berries,
  );

  const overlay = (
    <div className="rs-hud">
      <span
        className="rs-hearts"
        role="img"
        aria-label={t.hearts(shown.health / 2, fullHealth / 2)}
      >
        {Array.from({ length: fullHealth / 2 }, (_, index) => (
          <span
            key={index}
            className="fight-heart"
            data-fill={Math.min(2, Math.max(0, shown.health - index * 2))}
            style={{ backgroundImage: `url("${hud.heart}")` }}
          />
        ))}
      </span>
      {shown.outcome !== 'won' && (
        <span
          className="rs-combo"
          role="img"
          aria-label={t.combo(shown.combo, powerAfter)}
          data-full={shown.combo >= powerAfter - 1}
        >
          {Array.from({ length: powerAfter }, (_, index) => (
            <img
              key={index}
              src={swordPictures[sword]}
              alt=""
              className="rs-combo-pip"
              data-lit={index < shown.combo}
            />
          ))}
        </span>
      )}
      {loot && shown.outcome === 'won' && (
        <>
          <ul className="rs-purses">
            {players.map((player, index) => {
              const count =
                (loot.before[index] as number) +
                [...loot.taken].filter((coin) => coin % players.length === index).length;
              return (
                <li
                  key={player.id}
                  className="rs-purse"
                  role="img"
                  aria-label={t.purse(player.name, count)}
                  style={{ top: px(purseTop(index)) }}
                >
                  <img src={heroFaces[own(index).hero]} alt="" className="rs-purse-face" />
                  <span
                    className="rs-purse-coin"
                    style={{ backgroundImage: `url("${clearingSheets.coin}")` }}
                  />
                  {/* Drawn anew as it grows, so it gives a little bounce. */}
                  <span key={count} className="rs-purse-count" aria-hidden="true">
                    {formatNumber(locale, count)}
                  </span>
                </li>
              );
            })}
          </ul>
          {coinSpots.slice(0, loot.landed).map((spot, index) => (
            <button
              key={index}
              type="button"
              className="rs-coin"
              aria-label={t.pickUp}
              data-taken={loot.taken.has(index)}
              disabled={loot.taken.has(index)}
              style={
                {
                  left: px(spot.x + 5),
                  top: px(spot.y + 5),
                  '--to-x': px(purseX - spot.x),
                  '--to-y': px(purseTop(index % players.length) - spot.y),
                } as CSSProperties
              }
              onClick={() => {
                effect(sounds.coin);
                setLoot({ ...loot, taken: new Set([...loot.taken, index]) });
              }}
            >
              <span
                className="rs-coin-face"
                style={{ backgroundImage: `url("${clearingSheets.coin}")` }}
              />
            </button>
          ))}
        </>
      )}
      {revealed && (isStroke(fight.last) || fight.last === 'fed') && (
        <span
          // Drawn anew at every stroke, so it floats up again.
          key={`damage-${String(answers)}`}
          className="rs-damage"
          aria-hidden="true"
          style={{ left: px(slimeAt.x + 8), top: px(slimeAt.y - 6) }}
          data-heal={damage < 0}
        >
          {damage < 0 ? '+' : '−'}
          {formatNumber(locale, Math.abs(damage))}
        </span>
      )}
      {shown.lives > 0 && (
        <span
          // Drawn anew at every answer, and when a walk ends, so its fading plays out again.
          key={`life-${String(answers)}-${String(walks)}`}
          className="rs-life"
          role="img"
          aria-label={t.lives(shown.lives)}
          // Away while the monster charges, as the bar stays where the monster stood.
          data-away={chosen !== undefined && view.threat && !spat}
          // Going with the monster as it walks up to the hero; when it turns back, the bar
          // waits at home, unseen until the monster is there again.
          data-walking={walking && walk !== undefined}
          data-back={back > 0}
          style={
            {
              left: px(slimeAt.x + 8),
              top: px(slimeAt.y + 17),
              width: px(lifeWidth),
              '--away': `${String(charge.out + charge.hold + charge.back)}s`,
              '--back': `${String(back)}s`,
              '--walk': px(-reach.slime),
              '--walk-time': `${String(walk?.lasts ?? 0)}s`,
            } as CSSProperties
          }
        >
          {/* Drawn anew at every stroke, so it shakes and a piece breaks off. */}
          <span key={shown.lives} className="rs-life-pieces" data-hit={isStroke(shown.last)}>
            {Array.from({ length: lives }, (_, index) => (
              <span key={index} className="rs-life-piece" data-left={index < shown.lives} />
            ))}
          </span>
        </span>
      )}
      {players.length > 1 && shown.outcome === 'fighting' && (
        <p
          className="rs-nameplate"
          role="status"
          style={{ left: px(heroAt.x + 8), top: px(heroAt.y - 1) }}
        >
          <span aria-hidden="true">{player.name}</span>
          <span className="visually-hidden">{c.turn(player.name)}</span>
        </p>
      )}
    </div>
  );

  return (
    <section className="rs-fight">
      <header className="rs-topbar" style={{ borderImageSource: `url("${topFrames.forest}")` }}>
        <button type="button" className="game-header-button" aria-label={c.back} onClick={onBack}>
          <span aria-hidden="true">‹</span>
        </button>
        <p className="rs-foe">
          <img src={shown.enraged ? faces.slimeRage : faces.slime} alt="" className="rs-foe-face" />
          <span className="rs-foe-name">{name}</span>
        </p>
        {aside}
      </header>
      <div
        className="rs-stage"
        // A hero hurt, or a power stroke, shakes the scene a little.
        data-shake={revealed && (isHurt(fight.last) || fight.last === 'smashed')}
        style={{ aspectRatio: `${String(scene.columns)} / ${String(scene.rows)}` }}
      >
        <SceneCanvas
          scene={scene}
          sheets={clearingSheets}
          label={t.fightLabel}
          overlay={overlay}
          fit="box"
          {...(load ? { load } : {})}
        />
      </div>
      <div
        className="rs-panel"
        data-turn={shown.outcome !== 'fighting' ? undefined : view.threat ? 'defend' : 'attack'}
      >
        {shown.outcome === 'fighting' ? (
          <>
            {view.threat ? (
              <p className="rs-tab" data-defend="true">
                <img src={hud.guard} alt="" className="rs-tab-guard" />
                {t.defend}
              </p>
            ) : (
              <p className="rs-tab">
                <img src={swordPictures[sword]} alt="" className="rs-tab-weapon" />
                {t.attack}
              </p>
            )}
            <p className="rs-stakes">
              {view.threat ? (
                <span className="rs-stake" data-good="true" aria-label={t.stakeDodge}>
                  <span aria-hidden="true">✓</span>
                  <img src={hud.guard} alt="" className="rs-stake-guard" />
                </span>
              ) : (
                <span className="rs-stake" data-good="true" aria-label={t.stakeRight}>
                  <span aria-hidden="true">✓</span>
                  <img src={swordPictures[sword]} alt="" className="rs-stake-weapon" />
                  <span aria-hidden="true">→</span>
                  <span
                    className="rs-stake-slime"
                    style={{ backgroundImage: `url("${clearingSheets.slime}")` }}
                  />
                </span>
              )}
              {view.hungry ? (
                <span className="rs-stake" data-good="false" aria-label={t.stakeFed}>
                  <span aria-hidden="true">✗</span>
                  <span
                    className="rs-stake-slime"
                    style={{ backgroundImage: `url("${clearingSheets.slime}")` }}
                  />
                  <span aria-hidden="true">+{formatNumber(locale, 1)}</span>
                </span>
              ) : (
                <span className="rs-stake" data-good="false" aria-label={t.stakeWrong(cost / 2)}>
                  <span aria-hidden="true">✗</span>
                  <img src={hud.heartIcon} alt="" className="rs-stake-heart" />
                  <span aria-hidden="true">
                    {cost === 1 ? '−½' : `−${formatNumber(locale, cost / 2)}`}
                  </span>
                </span>
              )}
            </p>
            <TaskAnswers task={task} chosen={chosen} revealed={revealed} onChoose={answer} />
          </>
        ) : (
          <div className="fight-over">
            <p role="status">{shown.outcome === 'won' ? t.won(name) : t.lost}</p>
            <button type="button" className="rs-button" onClick={restart}>
              {shown.outcome === 'won' ? t.again : t.tryAgain}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

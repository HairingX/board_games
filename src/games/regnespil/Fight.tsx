import { useEffect, useEffectEvent, useState, type CSSProperties, type ReactNode } from 'react';
import type { Profile } from '../../family/family';
import { formatNumber } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import { common } from '../../ui/text';
import type { Random } from '../../lib/random';
import { chimes } from '../../lib/sound/chimes';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { nextTurn } from '../../lib/turns';
import { motionTokens } from '../../ui/motion';
import { SceneCanvas, type LoadPicture } from '../../ui/SceneCanvas';
import { useWakeLock } from '../../lib/wakeLock';
import {
  answerFight,
  coinsEach,
  noGear,
  shieldPieces,
  reachedHero,
  startFight,
  type Blow,
  type Gear,
} from './battle';
import { hud, swordPictures, topFrames } from './art';
import { heroFaces } from './heroes';
import {
  aftermath,
  answerBeat,
  coinAt,
  glare,
  reached as reachedBeats,
  reveal,
  teases,
  teasing,
  strikes,
  guarded,
  phaseEntered,
  phases,
  phaseSeconds,
  type Beat,
  type Phase,
} from './beats';
import {
  benchAt,
  clearing,
  clearingSheets,
  coinSpots,
  foeMiddle,
  heroAt,
  reach,
  slimeAt,
  type Party,
  type Staging,
} from './clearing';
import { monsters, type Foe } from './monsters';
import type { PlayerSettings } from './players';
import { evasionFor, strikeFor, teaseFor } from './antics';
import { seeds, type SavedFight } from './fightSave';
import { monsterName } from './names';
import { approachSeconds, withTime } from './pace';
import { monsterLives, swordRules } from './swords';
import { hits, music, sounds, victoryLength, type Mixed } from './sounds';
import { pick } from './sums';
import { TaskAnswers } from './TaskAnswers';
import { freshFor, judge, makeTask, sumKey, type Task } from './tasks';
import { text } from './text';
import { treasurePictures } from './treasures';
import type { Value } from './values';
import './regnespil.css';

/** The music a fight reads into memory before it is needed, so it plays without the internet. */
export const fightMusic = [music.fight.url, music.victory.url];

/** Whether the blow was a stroke at the monster, a power stroke or not. */
const isStroke = (blow: Blow | undefined) => blow === 'struck' || blow === 'smashed';

/** Whether the blow hurt the hero, so the scene shakes. */
const isHurt = (blow: Blow | undefined) => blow === 'bumped' || blow === 'hit' || blow === 'nicked';

/** Where the purses stand at the right of the stage, one under another, in its pixels. */
const purseX = 128;
const purseTop = (index: number) => 4 + index * 14;

/** How wide the life bar under the monster is, in the stage's pixels. */
const lifeWidth = 24;

/** How long the monster waits before it begins to walk up to the hero, in seconds. */
const settle = 1;

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
    ? { asked: at, at: at + settle, lasts: approachSeconds(paces[turn.activeId]) }
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
  /** Which monster a new fight is against; a saved fight goes on against its own. */
  foe?: Foe;
  /** What the heroes carry from the treasures they found, as it changes a fight. */
  gear?: Gear;
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
  foe = 'slime',
  gear = noGear,
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
    const against = monsters[foe];
    const lives = Math.ceil(monsterLives(settings.map((one) => one.sword)) * against.toughness);
    return {
      fight: startFight(lives, against.plan, gear),
      lives,
      activeId: first.id,
      task: makeTask(own(0).level, random, recent),
      recent,
      seed: Math.floor(random() * seeds),
      foe,
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
  /** The monster the heroes fight. */
  const monster = monsters[save.foe];
  /** Where the middle of the monster is on the stage, for its life bar and what floats over it. */
  const middle = foeMiddle(monster);
  /** Whether the monster is won over with treats rather than beaten. */
  const befriends = monster.befriends ?? false;
  /** The monster as named in a sentence. */
  const called = t.foes[monster.kind];
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
  /** Whether the monster left its place to strike back at the last answer, so its life bar waits. */
  const [leaves, setLeaves] = useState(false);
  /** How many lives the last stroke took. */
  const [damage, setDamage] = useState(0);
  const [staging, setStaging] = useState<Staging>(() =>
    aftermath(
      save.fight,
      now(),
      players.filter((one) => one.id !== save.activeId).map((one) => one.id),
      middle,
      befriends,
    ),
  );
  /** The phase the monster entered at the last answer, until its beginning has been played. */
  const [phase, setPhase] = useState<Phase>();
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

  // The screen stays on while the fight goes on, as a child thinks over a sum; once it is won
  // or the hero rests, it may go dark, as the owner chose.
  useWakeLock(shown.outcome === 'fighting');

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

  /** Plays a beat: shows its staging, and plays its sounds and voices, each at its moment. */
  function perform(beat: Beat): void {
    setStaging(beat.staging);
    for (const cue of beat.cues) {
      if ('voice' in cue) {
        const voice = cue.voice === 'monster' ? monster.voice : voices.hero;
        sound.babble(voice, cue.syllables, undefined, cue.after);
      } else {
        effect(cue.sound === 'hit' ? pick(random, hits) : sounds[cue.sound], cue.after);
      }
    }
  }

  /** When the monster's teasing between two sums ends, on the page's clock, while it teases. */
  const [teaseEnds, setTeaseEnds] = useState<number>();

  // The next turn shows: whose it is and their sum, and what the slime does on it.
  const showNext = useEffectEvent(() => {
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
      save.activeId === view.activeId ? {} : changePlaces(ids, view.activeId, save.activeId, at);
    if (save.fight.threat) {
      setStaging({ ...places, monster: { sign: { sheet: 'alert', at } } });
      sound.babble(monster.voice, 2);
    } else if (save.fight.hungry) {
      setStaging({ ...places, monster: { facing: 'right', sign: { sheet: 'star', at } } });
      sound.babble(monster.voice, 3);
    } else {
      // The monster turns back to the heroes, if it had turned away.
      setStaging((before) => ({ ...before, ...places, monster: {} }));
    }
  });

  // After the pause, a monster entering a new phase shows it, or it may tease the heroes,
  // before the next turn shows.
  const afterPause = useEffectEvent(() => {
    if (phase) {
      const at = now();
      setTeaseEnds(at + phaseSeconds[phase]);
      perform(phases[phase](at, middle));
      return;
    }
    const how =
      save.fight.threat || save.fight.hungry
        ? undefined
        : teaseFor(save.seed, fight.round, monster.teases);
    if (how === undefined) {
      showNext();
      return;
    }
    const at = now();
    setTeaseEnds(at + teasing.seconds);
    perform(teases[how](at));
  });

  // An answer chosen shows how it went as the hero reaches the slime. Then the fight pauses,
  // so the stroke and the right answer can be seen, and now and then the slime teases the
  // heroes; then the turn passes and the next sum comes by itself, sooner after a right answer.
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
    if (teaseEnds !== undefined) {
      const timer = setTimeout(
        () => {
          setTeaseEnds(undefined);
          setPhase(undefined);
          showNext();
        },
        Math.max(0, teaseEnds - now()) * 1000,
      );
      return () => {
        clearTimeout(timer);
      };
    }
    const { right, wrong } = motionTokens.fightPause;
    const timer = setTimeout(
      () => {
        afterPause();
      },
      (isStroke(fight.last) || fight.last === 'dodged' ? right : wrong) * 1000,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [chosen, revealed, fight, save, now, teaseEnds]);

  // The slime walks up to the hero while the sum is thought over; once there, it roars and
  // steps back, or, with a sword whose monsters strike in time, strikes.
  const reached = useEffectEvent((walk: Walk) => {
    const at = now();
    const { knocked } = motionTokens.act;
    const next = reachedHero(fight, own(active).sword);
    // A charm may turn the blow aside, and the monster only roars.
    const pounced = next !== fight && next.last !== 'guarded';
    setWalking(false);
    setWalks(walks + 1);
    setBack(glare + motionTokens.act.return.seconds);
    if (next !== fight) {
      keep({ ...save, fight: next });
      setView((before) => ({ ...before, fight: next }));
    }
    if (pounced) {
      const moment = { at, walked: 0, others: [], lost: next.outcome === 'lost', middle };
      perform(reachedBeats.pounce(moment, approachOf(walk)));
    } else {
      const roar = reachedBeats.roar(at, approachOf(walk));
      perform(next === fight ? roar : guarded(roar, at, 0));
    }
    const rested = pounced ? knocked.fall + knocked.down + knocked.rise : 0;
    setWalk(
      next.outcome === 'fighting'
        ? { ...walk, at: at + glare + motionTokens.act.return.seconds + rested + settle }
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
    // How the monster acts at this turn, as the fight's seed has it, and the beat it plays.
    const ways = {
      strike: strikeFor(
        save.seed,
        fight.round,
        fight.enraged ? monster.enragedStrikes : monster.strikes,
      ),
      evasion: evasionFor(save.seed, fight.round, monster.evasions),
    };
    setLeaves(fight.threat && strikes[ways.strike].leaves);
    const moment = { at, walked, others, lost: next.outcome === 'lost', middle };
    setPhase(phaseEntered(next, fight));
    effect(sounds.choose);
    perform(answerBeat(next, fight, moment, ways, players.length * coinsEach, befriends));
    if (walk) {
      setPaces({ ...paces, [view.activeId]: withTime(paces[view.activeId], at - walk.asked) });
    }
    setWalk(undefined);
    setWalking(false);
    setBack(walked > 0 ? motionTokens.act.return.seconds : 0);
    setChosen(choice);
    setDamage(fight.lives - next.lives);
    setAnswers(answers + 1);
    // How it went is heard as it shows.
    sound.chime(chimes[verdict], random, reveal);
    if (next.outcome === 'won') {
      // The coins go in the purses at once, so none is lost; picking them up shows them.
      onCoins(players.map(() => coinsEach * gear.coinWorth));
      setLoot({
        at: at + reveal,
        landed: 0,
        before: settings.map((one) => one.coins),
        taken: new Set(),
      });
    }
  }

  const player = players[active] as Profile;
  const sword = own(active).sword;
  /** What a wrong answer costs the active player, in half hearts, at its worst. */
  const cost = swordRules[sword].far;
  const px = (pixels: number) => `calc(var(--px) * ${String(pixels)})`;
  const { charge } = motionTokens.act;

  /** The monster's name, made from the fight's seed. */
  const name = monsterName(t.names[monster.kind], save.seed);
  const party: Party = {
    front: own(active).hero,
    bench: players.flatMap((one, index) =>
      index === active ? [] : [{ id: one.id, hero: own(index).hero }],
    ),
  };
  /** Whether the monster's shield shows: once it has formed, not while it gathers. */
  const shielded = shown.shield > 0 && phase !== 'shield';
  const scene = clearing(
    walk
      ? {
          ...staging,
          monster: {
            ...staging.monster,
            acts: [...(staging.monster?.acts ?? []), approachOf(walk)],
          },
        }
      : staging,
    party,
    {
      look: shown.enraged ? monster.look.enraged : monster.look.calm,
      big: monster.big,
      size: monster.size,
      bush: monster.plan.bush,
      shielded,
    },
    shown.berries,
  );

  const overlay = (
    <div className="rs-hud">
      <span
        className="rs-hearts"
        role="img"
        aria-label={t.hearts(shown.health / 2, shown.maxHealth / 2)}
      >
        {Array.from({ length: shown.maxHealth / 2 }, (_, index) => (
          <span
            key={index}
            className="fight-heart"
            data-fill={Math.min(2, Math.max(0, shown.health - index * 2))}
            style={{ backgroundImage: `url("${hud.heart}")` }}
          />
        ))}
      </span>
      {gear.guards > 0 && (
        <img
          src={treasurePictures.guardCharm}
          className="rs-charm"
          alt={t.charm(shown.guards)}
          data-used={shown.guards === 0}
        />
      )}
      {shown.outcome !== 'won' && (
        <span
          className="rs-combo"
          role="img"
          aria-label={t.combo(shown.combo, shown.powerAt)}
          data-full={shown.combo >= shown.powerAt - 1}
        >
          {Array.from({ length: shown.powerAt }, (_, index) => (
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
                [...loot.taken].filter((coin) => coin % players.length === index).length *
                  gear.coinWorth;
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
          style={{ left: px(middle), top: px(slimeAt.y - 6) }}
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
          aria-label={
            befriends ? t.grumpy(called.the, shown.lives) : t.lives(called.its, shown.lives)
          }
          // Away while the monster charges, as the bar stays where the monster stood.
          data-away={chosen !== undefined && leaves}
          // Going with the monster as it walks up to the hero; when it turns back, the bar
          // waits at home, unseen until the monster is there again.
          data-walking={walking && walk !== undefined}
          data-back={back > 0}
          style={
            {
              left: px(middle),
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
          {shielded && (
            // The shield's pieces over the life bar, breaking off as it is struck.
            <span
              key={`shield-${String(shown.shield)}`}
              className="rs-life-pieces rs-shield-pieces"
              role="img"
              aria-label={t.shieldLeft(shown.shield)}
              data-hit={shown.last === 'shielded'}
            >
              {Array.from({ length: shieldPieces }, (_, index) => (
                <span key={index} className="rs-life-piece" data-left={index < shown.shield} />
              ))}
            </span>
          )}
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
          <img
            src={shown.enraged ? monster.face.enraged : monster.face.calm}
            alt=""
            className="rs-foe-face"
          />
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
          label={t.fightLabel(called.facing)}
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
                <span className="rs-stake" data-good="true" aria-label={t.stakeDodge(called.its)}>
                  <span aria-hidden="true">✓</span>
                  <img src={hud.guard} alt="" className="rs-stake-guard" />
                </span>
              ) : (
                <span
                  className="rs-stake"
                  data-good="true"
                  aria-label={
                    shown.shield > 0
                      ? t.stakeShield
                      : befriends
                        ? t.stakeTreat(called.the)
                        : t.stakeRight(called.the)
                  }
                >
                  <span aria-hidden="true">✓</span>
                  {befriends ? (
                    <img src={hud.treat} alt="" className="rs-stake-weapon" />
                  ) : (
                    <img src={swordPictures[sword]} alt="" className="rs-stake-weapon" />
                  )}
                  <span aria-hidden="true">→</span>
                  {shown.shield > 0 ? (
                    <img src={hud.guard} alt="" className="rs-stake-guard" />
                  ) : (
                    <img src={monster.face.calm} alt="" className="rs-stake-foe" />
                  )}
                </span>
              )}
              {view.hungry ? (
                <span className="rs-stake" data-good="false" aria-label={t.stakeFed(called.the)}>
                  <span aria-hidden="true">✗</span>
                  <img src={monster.face.calm} alt="" className="rs-stake-foe" />
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
            <p role="status">
              {shown.outcome === 'lost' ? t.lost : befriends ? t.befriended(name) : t.won(name)}
            </p>
            <button type="button" className="rs-button" onClick={restart}>
              {shown.outcome === 'won' ? t.again : t.tryAgain}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

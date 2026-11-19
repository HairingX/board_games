import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { Profile } from '../../family/family';
import { Avatar } from '../../family/Avatar';
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
import { answerFight, fullHealth, startFight, type Fight as FightState } from './battle';
import { faces, hud, swordPictures, topFrames } from './art';
import {
  clearing,
  clearingSheets,
  coinDrop,
  heroAt,
  puff,
  reach,
  shieldUp,
  slimeAt,
  sweep,
  type Staging,
} from './clearing';
import type { PlayerSettings } from './players';
import type { SavedFight } from './fightSave';
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
 * clear of a blow dodged just before it lands; an enraged slime roars a moment after.
 */
const moments = { squeal: 0.15, hop: 0.1, dodge: 0.1, ouch: 0.15, rage: 0.5 } as const;

/**
 * When the victory's moments come after the last stroke, in seconds, and how far to the side
 * each coin springs from the slime's place, in the stage's pixels.
 */
const victory = {
  vanish: 0.12,
  puff: 0.3,
  coins: [
    { at: 0.45, aside: -24 },
    { at: 0.55, aside: 22 },
    { at: 0.65, aside: -10 },
    { at: 0.75, aside: 8 },
  ],
  cheers: [0.8, 1.5],
} as const;

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
 * knocked over.
 */
function stage(fight: FightState, before: FightState, at: number): Staging {
  const { attack, knocked } = motionTokens.act;
  const shown = at + reveal;
  const down = {
    sheet: fight.outcome === 'lost' ? 'sleepy' : 'dizzy',
    at: shown + knocked.fall + knocked.down,
  } as const;
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
  if (fight.last === 'bumped') {
    return {
      hero: { acts: [run, { kind: 'knocked', at: shown, reach: reach.hero }], sign: down },
      slime: { acts: [{ kind: 'cheer', at: shown - moments.hop }] },
    };
  }
  const home = shown + attack.seconds;
  const strike = [
    run,
    { kind: 'attack', at: shown, reach: reach.hero },
    { kind: 'return', at: home, reach: reach.hero },
  ] as const;
  if (fight.last !== 'struck') {
    return {
      hero: {
        acts: [
          ...strike,
          ...(fight.last === 'nicked'
            ? [{ kind: 'hurt', at: home + motionTokens.act.return.seconds } as const]
            : []),
        ],
      },
      slime: { sign: { sheet: 'alert', at: shown } },
    };
  }
  if (fight.outcome === 'won') {
    return {
      hero: {
        acts: [
          ...strike,
          ...victory.cheers.map((cheer) => ({ kind: 'cheer', at: shown + cheer }) as const),
        ],
        sign: { sheet: 'heart', at: shown + victory.cheers[0] },
      },
      slime: { acts: [{ kind: 'vanish', at: shown + victory.vanish }] },
      effects: [
        sweep(shown),
        puff(shown + victory.puff),
        ...victory.coins.map((coin) => coinDrop(shown + coin.at, coin.aside)),
      ],
    };
  }
  const rage = fight.enraged && !before.enraged;
  return {
    hero: { acts: strike },
    slime: {
      acts: [{ kind: 'hurt', at: shown + victory.vanish }],
      ...(rage ? { sign: { sheet: 'angry', at: shown + moments.rage } as const } : {}),
    },
    effects: [sweep(shown)],
  };
}

/**
 * The first stage: the hero against a slime in the forest clearing, with the fight's music.
 * The players take turns, each with a sum at their own level, and what a wrong answer costs is
 * their own sword's. An answer chosen sends the hero running at the slime, and only as they
 * reach it does it show how it went: a right answer strikes the slime; a close one is parried;
 * one far off lets the slime bounce the hero over. Halfway the slime grows enraged. The next
 * sum comes by itself after a short pause. A won fight ends with a fanfare, a puff of smoke,
 * coins springing out and a cheering hero; a lost one with the hero resting.
 */
export function Fight({
  players,
  settings,
  onBack,
  saved,
  onSave,
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
  const [staging, setStaging] = useState<Staging>({});

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
          fight: save.fight,
        });
        setChosen(undefined);
        setRevealed(false);
        // The monster announces its blow: a sign over its head and a growl.
        if (save.fight.threat) {
          setStaging({ slime: { sign: { sheet: 'alert', at: now() } } });
          sound.babble(voices.slime, 2);
        }
      },
      (fight.last === 'struck' || fight.last === 'dodged' ? right : wrong) * 1000,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [chosen, revealed, fight, save, now, sound]);

  function restart(): void {
    play(music.fight);
    const next = fresh(shownWith(save.recent, task));
    keep(next);
    setView({ activeId: next.activeId, task: next.task, threat: false, fight: next.fight });
    setChosen(undefined);
    setRevealed(false);
    setStaging({});
  }

  function answer(choice: Value): void {
    // The music starts from a tap, as browsers ask; it goes on if it already plays.
    play(music.fight);
    const verdict = judge(choice, task.answer, task.near);
    const next = answerFight(fight, verdict, own(active).sword);
    // Saved at once with the next turn and its sum, so a closed app goes on from there.
    const following = nextTurn(active, players.length);
    const recent = shownWith(save.recent, task);
    keep({
      fight: next,
      lives,
      activeId: (players[following] as Profile).id,
      task: makeTask(own(following).level, random, recent),
      recent,
    });
    setChosen(choice);
    setStaging(stage(next, fight, now()));
    setAnswers(answers + 1);
    effect(sounds.choose);
    // How it went is heard as it shows.
    sound.chime(chimes[verdict], random, reveal);
    if (fight.threat) {
      // The slime cries out as it charges.
      sound.babble(voices.slime, 4);
    } else {
      // The hero shouts as they run at the slime.
      sound.babble(voices.hero, 2);
    }
    if (next.last === 'struck') {
      effect(sounds.slash, reveal);
      effect(pick(random, hits), reveal);
      // The slime squeals at the blow, cross at being struck.
      sound.babble(voices.slime, 3, undefined, reveal + moments.squeal);
      if (next.outcome === 'won') {
        effect(sounds.victory, reveal);
        sound.babble(voices.hero, 6, undefined, reveal + victory.cheers[0]);
      } else if (next.enraged && !fight.enraged) {
        // Halfway, enraged: it roars.
        sound.babble(voices.slime, 8, undefined, reveal + moments.rage);
      }
    } else if (next.last === 'dodged') {
      // The slime misses: the hero jumps clear with a swish.
      effect(sounds.slash, reveal - moments.dodge);
    } else if (next.last === 'bumped' || next.last === 'hit') {
      if (next.last === 'bumped') sound.babble(voices.slime, 3, undefined, reveal - moments.hop);
      // The bump, and the hero's "ouch", as it lands.
      effect(sounds.bump, reveal);
      sound.babble(voices.hero, 2, undefined, reveal + moments.ouch);
    } else {
      effect(sounds.clang, reveal);
    }
  }

  const player = players[active] as Profile;
  const sword = own(active).sword;
  /** What a wrong answer costs the active player, in half hearts, at its worst. */
  const cost = swordRules[sword].far;
  const px = (pixels: number) => `calc(var(--px) * ${String(pixels)})`;
  const { charge } = motionTokens.act;

  const scene = clearing(staging, shown.enraged);

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
      {shown.lives > 0 && (
        <span
          // Drawn anew at every answer, so its fading plays out again.
          key={answers}
          className="rs-life"
          role="img"
          aria-label={t.lives(shown.lives)}
          // Away while the monster charges, as the bar stays where the monster stood.
          data-away={chosen !== undefined && view.threat}
          style={
            {
              left: px(slimeAt.x + 8),
              top: px(slimeAt.y + 17),
              width: px(lifeWidth),
              '--away': `${String(charge.out + charge.hold + charge.back)}s`,
            } as CSSProperties
          }
        >
          {/* Drawn anew at every stroke, so it shakes and a piece breaks off. */}
          <span key={shown.lives} className="rs-life-pieces" data-hit={shown.lives < lives}>
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
          <Avatar profile={player} size="tiny" />
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
          <span className="rs-foe-name">{t.slime}</span>
        </p>
        {aside}
      </header>
      <div
        className="rs-stage"
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
      <div className="rs-panel">
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
              <span className="rs-stake" data-good="false" aria-label={t.stakeWrong(cost / 2)}>
                <span aria-hidden="true">✗</span>
                <img src={hud.heartIcon} alt="" className="rs-stake-heart" />
                <span aria-hidden="true">
                  {cost === 1 ? '−½' : `−${formatNumber(locale, cost / 2)}`}
                </span>
              </span>
            </p>
            <TaskAnswers task={task} chosen={chosen} revealed={revealed} onChoose={answer} />
          </>
        ) : (
          <div className="fight-over">
            <p role="status">{shown.outcome === 'won' ? t.won : t.lost}</p>
            <button type="button" className="rs-button" onClick={restart}>
              {shown.outcome === 'won' ? t.again : t.tryAgain}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

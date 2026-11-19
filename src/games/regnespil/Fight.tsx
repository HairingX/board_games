import { useEffect, useState, type ReactNode } from 'react';
import heart from '../../../assets/ninja-adventure/Ui/Receptacle/Heart.png';
import type { Profile } from '../../family/family';
import { useMessages } from '../../i18n/I18n';
import type { Random } from '../../lib/random';
import { chimes } from '../../lib/sound/chimes';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { nextTurn } from '../../lib/turns';
import { GameHeader } from '../../ui/GameHeader';
import { motionTokens } from '../../ui/motion';
import { SceneCanvas, type LoadPicture } from '../../ui/SceneCanvas';
import { TurnBanner } from '../../ui/TurnBanner';
import { answerFight, fullHealth, startFight, type Fight as FightState } from './battle';
import { clearing, clearingSheets, coinDrop, puff, sweep, type Staging } from './clearing';
import type { PlayerSettings } from './players';
import { monsterLives } from './swords';
import { hits, music, sounds, victoryLength, type Mixed } from './sounds';
import { pick } from './sums';
import { TaskAnswers } from './TaskAnswers';
import { judge, makeTask, type Task } from './tasks';
import { text } from './text';
import type { Value } from './values';
import './regnespil.css';

/** The music a fight reads into memory before it is needed, so it plays without the internet. */
export const fightMusic = [music.fight.url, music.victory.url];

/** How long after the growl the monster's bump lands, in seconds. */
const growlLead = 0.35;

/**
 * When the victory's moments come after the last stroke, in seconds, and where each coin lands
 * beside the slime's place, in the stage's pixels.
 */
const victory = {
  vanish: 0.12,
  puff: 0.3,
  coins: [
    { at: 0.5, aside: -10 },
    { at: 0.65, aside: 0 },
    { at: 0.8, aside: 10 },
  ],
  cheers: [0.6, 1.4],
} as const;

interface Props {
  players: readonly Profile[];
  /** Each player's level and sword, in the players' order. */
  settings: readonly PlayerSettings[];
  /** Back to choosing levels and swords. */
  onBack: () => void;
  /** Shown at the right of the header: the sound's levels. */
  aside?: ReactNode;
  random?: Random;
  sound?: SoundEngine;
  /** The page's clock in seconds; the tests give their own. */
  now?: () => number;
  load?: LoadPicture;
}

const pageClock = () => performance.now() / 1000;

/** The stage after an answer: who acts, what shows over their heads, and the effects. */
function stage(fight: FightState, at: number): Staging {
  if (fight.last === 'struck') {
    if (fight.outcome === 'won') {
      return {
        hero: {
          acts: [
            { kind: 'attack', at },
            ...victory.cheers.map((cheer) => ({ kind: 'cheer', at: at + cheer }) as const),
          ],
          sign: { sheet: 'heart', at: at + victory.cheers[0] },
        },
        slime: { acts: [{ kind: 'vanish', at: at + victory.vanish }] },
        effects: [
          sweep(at),
          puff(at + victory.puff),
          ...victory.coins.map((coin) => coinDrop(at + coin.at, coin.aside)),
        ],
      };
    }
    return {
      hero: { acts: [{ kind: 'attack', at }] },
      slime: { acts: [{ kind: 'hurt', at: at + victory.vanish }] },
      effects: [sweep(at)],
    };
  }
  if (fight.last === 'parried' || fight.last === 'nicked') {
    return {
      hero: {
        acts: [
          { kind: 'attack', at },
          ...(fight.last === 'nicked' ? [{ kind: 'hurt', at: at + 0.3 } as const] : []),
        ],
      },
      slime: { sign: { sheet: 'alert', at } },
    };
  }
  const lost = fight.outcome === 'lost';
  return {
    slime: { acts: [{ kind: 'attack', at }] },
    hero: {
      acts: [{ kind: 'hurt', at: at + 0.15 }],
      sign: { sheet: lost ? 'sleepy' : 'dizzy', at: at + 0.15 },
    },
  };
}

/**
 * The first stage: the hero against a slime in the forest clearing, with the fight's music.
 * The players take turns, each with a sum at their own level, and what a wrong answer costs is
 * their own sword's. A right answer strikes the slime; a close one is parried; one far off lets
 * the slime bump the hero. The next sum comes by itself after a short pause. A won fight ends
 * with a fanfare, a puff of smoke, coins and a cheering hero; a lost one with the hero resting.
 */
export function Fight({
  players,
  settings,
  onBack,
  aside,
  random = Math.random,
  sound = defaultSound,
  now = pageClock,
  load,
}: Props) {
  const t = useMessages(text);
  const lives = monsterLives(settings.map((own) => own.sword));
  const [active, setActive] = useState(0);
  const own = (index: number) => settings[index] as PlayerSettings;
  const [task, setTask] = useState<Task>(() => makeTask(own(0).level, random));
  const [chosen, setChosen] = useState<Value>();
  const [fight, setFight] = useState(() => startFight(lives));
  const [staging, setStaging] = useState<Staging>({});

  // The sounds are made ready when the fight opens, so the first one plays at once, and the
  // music fades out when it is left.
  useEffect(() => {
    void sound.prepareEffects([...Object.values(sounds), ...hits].map(({ url }) => url));
    void sound.prepareMusic(fightMusic);
    return () => {
      sound.focusMusic(false);
      sound.stopMusic();
    };
  }, [sound]);

  // The music steps back while a sum waits for its answer, so it never wears on the mind, and
  // comes forward again as the answer strikes or is struck.
  const thinking = chosen === undefined && fight.outcome === 'fighting';
  useEffect(() => {
    sound.focusMusic(thinking);
  }, [sound, thinking]);

  // A won fight's jingle gives way to the victory's music, until a new fight begins.
  useEffect(() => {
    if (fight.outcome !== 'won') return;
    const timer = setTimeout(() => {
      play(music.victory);
    }, victoryLength * 1000);
    return () => {
      clearTimeout(timer);
    };
  });

  // The monster's bump lands just after its growl.
  useEffect(() => {
    if (chosen === undefined || fight.last !== 'bumped') return;
    const timer = setTimeout(() => {
      effect(sounds.bump);
    }, growlLead * 1000);
    return () => {
      clearTimeout(timer);
    };
  });

  function play({ url, gain }: Mixed): void {
    sound.music(url, gain);
  }

  function effect({ url, gain }: Mixed): void {
    void sound.effect(url, gain);
  }

  // After an answer the fight pauses, so the stroke and the right answer can be seen, then the
  // turn passes and the next sum comes by itself.
  useEffect(() => {
    if (chosen === undefined || fight.outcome !== 'fighting') return;
    const { right, wrong } = motionTokens.fightPause;
    const timer = setTimeout(
      () => {
        const next = nextTurn(active, players.length);
        setActive(next);
        setTask(makeTask((settings[next] as PlayerSettings).level, random));
        setChosen(undefined);
      },
      (fight.last === 'struck' ? right : wrong) * 1000,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [chosen, fight, active, players.length, settings, random]);

  function restart(): void {
    play(music.fight);
    setActive(0);
    setTask(makeTask(own(0).level, random));
    setChosen(undefined);
    setFight(startFight(lives));
    setStaging({});
  }

  function answer(choice: Value): void {
    // The music starts from a tap, as browsers ask; it goes on if it already plays.
    play(music.fight);
    const verdict = judge(choice, task.answer, task.near);
    const next = answerFight(fight, verdict, own(active).sword);
    setChosen(choice);
    setFight(next);
    setStaging(stage(next, now()));
    sound.chime(chimes[verdict]);
    if (next.last === 'struck') {
      effect(sounds.slash);
      effect(pick(random, hits));
      if (next.outcome === 'won') {
        sound.stopMusic();
        effect(sounds.victory);
        sound.babble(voices.hero, 6);
      }
    } else if (next.last === 'bumped') {
      sound.babble(voices.slime, 3);
    } else {
      effect(sounds.clang);
    }
  }

  const player = players[active] as Profile;

  return (
    <section className="rs-fight">
      <GameHeader title={t.clearing} onBack={onBack} aside={aside} />
      <div className="fight-bars">
        <span
          className="fight-hearts"
          role="img"
          aria-label={t.hearts(fight.health / 2, fullHealth / 2)}
        >
          {Array.from({ length: fullHealth / 2 }, (_, index) => (
            <span
              key={index}
              className="fight-heart"
              data-fill={Math.min(2, Math.max(0, fight.health - index * 2))}
              style={{ backgroundImage: `url("${heart}")` }}
            />
          ))}
        </span>
        <span className="fight-lives" role="img" aria-label={t.lives(fight.lives)}>
          {Array.from({ length: lives }, (_, index) => (
            <span key={index} className="fight-life" data-left={index < fight.lives} />
          ))}
        </span>
      </div>
      <SceneCanvas
        scene={clearing(staging)}
        sheets={clearingSheets}
        label={t.fightLabel}
        {...(load ? { load } : {})}
      />
      {fight.outcome === 'fighting' ? (
        <>
          {players.length > 1 && <TurnBanner player={player} />}
          <TaskAnswers task={task} chosen={chosen} onChoose={answer} />
        </>
      ) : (
        <div className="fight-over">
          <p role="status">{fight.outcome === 'won' ? t.won : t.lost}</p>
          <button type="button" className="btn btn-primary btn-block" onClick={restart}>
            {fight.outcome === 'won' ? t.again : t.tryAgain}
          </button>
        </div>
      )}
    </section>
  );
}

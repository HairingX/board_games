import { useEffect, useState } from 'react';
import win from '../../../assets/ninja-adventure/Audio/Jingles/Success1.m4a';
import hit from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Hit1.m4a';
import clang from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Impact.m4a';
import bump from '../../../assets/ninja-adventure/Audio/Sounds/Jump & Bounce/Jump.m4a';
import slashSound from '../../../assets/ninja-adventure/Audio/Sounds/Whoosh & Slash/Slash.m4a';
import heart from '../../../assets/ninja-adventure/Ui/Receptacle/Heart.png';
import { answerFight, firstFight, startFight, type Fight } from '../../games/regnespil/battle';
import { LevelPicker } from '../../games/regnespil/LevelPicker';
import type { Level } from '../../games/regnespil/levels';
import { TaskAnswers } from '../../games/regnespil/TaskAnswers';
import { judge, makeTask, type Task } from '../../games/regnespil/tasks';
import type { Value } from '../../games/regnespil/values';
import { useMessages } from '../../i18n/I18n';
import type { Random } from '../../lib/random';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { GameHeader } from '../../ui/GameHeader';
import { motionTokens } from '../../ui/motion';
import { SceneCanvas, type LoadPicture } from '../../ui/SceneCanvas';
import { clearing, clearingSheets, puff, sweep, type Staging } from './clearing';
import { labText } from './text';
import './beta.css';

interface Props {
  onBack: () => void;
  random?: Random;
  sound?: SoundEngine;
  /** The page's clock in seconds; the tests give their own. */
  now?: () => number;
  load?: LoadPicture;
}

const pageClock = () => performance.now() / 1000;

/** The stage after an answer: who acts, what shows over their heads, and the effects. */
function stage(fight: Fight, at: number): Staging {
  if (fight.last === 'struck') {
    const won = fight.outcome === 'won';
    return {
      hero: {
        acts: [{ kind: 'attack', at }, ...(won ? [{ kind: 'cheer', at: at + 0.6 } as const] : [])],
        ...(won ? { sign: { sheet: 'star', at: at + 0.6 } } : {}),
      },
      slime: { acts: [{ kind: won ? 'vanish' : 'hurt', at: at + 0.12 }] },
      effects: won ? [sweep(at), puff(at + 0.3)] : [sweep(at)],
    };
  }
  if (fight.last === 'parried') {
    return {
      hero: { acts: [{ kind: 'attack', at }] },
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
 * The first fight to try: the hero against a slime in the forest clearing. A right answer is a
 * stroke of the sword, a close one is parried, and one far off lets the slime bump the hero, who
 * loses a heart. The next sum comes by itself after a short pause, so no one has to tap on.
 */
export function BattleLab({
  onBack,
  random = Math.random,
  sound = defaultSound,
  now = pageClock,
  load,
}: Props) {
  const lab = useMessages(labText);

  // The sounds are made ready when the page opens, so the first one plays at once.
  useEffect(() => {
    void sound.prepareEffects([slashSound, hit, clang, bump, win]);
  }, [sound]);
  const [level, setLevel] = useState<Level>(1);
  const [task, setTask] = useState<Task>(() => makeTask(1, random));
  const [chosen, setChosen] = useState<Value>();
  const [fight, setFight] = useState(() => startFight(firstFight));
  const [staging, setStaging] = useState<Staging>({});

  function restart(next: Level): void {
    setLevel(next);
    setTask(makeTask(next, random));
    setChosen(undefined);
    setFight(startFight(firstFight));
    setStaging({});
  }

  // After an answer the fight pauses, so the stroke and the right answer can be seen, then the
  // next sum comes by itself.
  useEffect(() => {
    if (chosen === undefined || fight.outcome !== 'fighting') return;
    const { right, wrong } = motionTokens.fightPause;
    const timer = setTimeout(
      () => {
        setTask(makeTask(level, random));
        setChosen(undefined);
      },
      (fight.last === 'struck' ? right : wrong) * 1000,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [chosen, fight, level, random]);

  function answer(choice: Value): void {
    const next = answerFight(fight, judge(choice, task.answer, task.near));
    setChosen(choice);
    setFight(next);
    setStaging(stage(next, now()));
    if (next.last === 'struck') {
      void sound.effect(slashSound);
      void sound.effect(hit);
      if (next.outcome === 'won') {
        void sound.effect(win);
        sound.babble(voices.hero, 5);
      }
    } else if (next.last === 'parried') {
      void sound.effect(clang);
    } else {
      void sound.effect(bump);
    }
  }

  return (
    <section className="family lab">
      <GameHeader title={lab.fightTitle} onBack={onBack} />
      <LevelPicker level={level} onChange={restart} />
      <div className="fight-bars">
        <span className="fight-hearts" role="img" aria-label={lab.hearts(fight.hearts)}>
          {Array.from({ length: firstFight.hearts }, (_, index) => (
            <span
              key={index}
              className="fight-heart"
              data-full={index < fight.hearts}
              style={{ backgroundImage: `url("${heart}")` }}
            />
          ))}
        </span>
        <span className="fight-lives" role="img" aria-label={lab.lives(fight.lives)}>
          {Array.from({ length: firstFight.lives }, (_, index) => (
            <span key={index} className="fight-life" data-left={index < fight.lives} />
          ))}
        </span>
      </div>
      <SceneCanvas
        scene={clearing(staging)}
        sheets={clearingSheets}
        label={lab.fightLabel}
        {...(load ? { load } : {})}
      />
      {fight.outcome === 'fighting' ? (
        <TaskAnswers task={task} chosen={chosen} onChoose={answer} />
      ) : (
        <div className="fight-over" role="status">
          <p>{fight.outcome === 'won' ? lab.won : lab.lost}</p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              restart(level);
            }}
          >
            {fight.outcome === 'won' ? lab.again : lab.tryAgain}
          </button>
        </div>
      )}
    </section>
  );
}

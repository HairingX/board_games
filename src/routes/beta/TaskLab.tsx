import { useState } from 'react';
import { LevelPicker } from '../../games/regnespil/LevelPicker';
import { type Level } from '../../games/regnespil/levels';
import { TaskAnswers } from '../../games/regnespil/TaskAnswers';
import { judge, makeTask, type Task } from '../../games/regnespil/tasks';
import { text } from '../../games/regnespil/text';
import type { Value } from '../../games/regnespil/values';
import { useMessages } from '../../i18n/I18n';
import type { Random } from '../../lib/random';
import { chimes } from '../../lib/sound/chimes';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { GameHeader } from '../../ui/GameHeader';
import { labText } from './text';
import './beta.css';

interface Props {
  onBack: () => void;
  random?: Random;
  sound?: SoundEngine;
}

/**
 * The math game's tasks to try, level by level: a sum, three answers, and at once whether the
 * one chosen was right, close or far off, with the right answer shown either way.
 */
export function TaskLab({ onBack, random = Math.random, sound = defaultSound }: Props) {
  const lab = useMessages(labText);

  const t = useMessages(text);
  const [level, setLevel] = useState<Level>(1);
  const [task, setTask] = useState<Task>(() => makeTask(1, random));
  const [chosen, setChosen] = useState<Value>();
  const [tally, setTally] = useState({ right: 0, total: 0 });

  return (
    <section className="family lab">
      <GameHeader title={lab.tasksTitle} onBack={onBack} />
      <p className="family-intro">{lab.tasksIntro}</p>
      <LevelPicker
        level={level}
        onChange={(next) => {
          setLevel(next);
          setTask(makeTask(next, random));
          setChosen(undefined);
          setTally({ right: 0, total: 0 });
        }}
      />
      <TaskAnswers
        task={task}
        chosen={chosen}
        onChoose={(choice) => {
          setChosen(choice);
          const verdict = judge(choice, task.answer, task.near);
          setTally({ right: tally.right + Number(verdict === 'right'), total: tally.total + 1 });
          sound.chime(chimes[verdict]);
        }}
      />
      {chosen !== undefined && (
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            setTask(makeTask(level, random));
            setChosen(undefined);
          }}
        >
          {t.next}
        </button>
      )}
      <p className="level-grade">{t.tally(tally.right, tally.total)}</p>
    </section>
  );
}

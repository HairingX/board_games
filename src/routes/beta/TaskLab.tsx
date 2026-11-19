import { useState } from 'react';
import coin from '../../../assets/ninja-adventure/Audio/Sounds/Bonus/Coin.m4a';
import { grades, levels, type Level } from '../../games/regnespil/levels';
import { SumView } from '../../games/regnespil/SumView';
import { judge, makeTask, type Task } from '../../games/regnespil/tasks';
import { text } from '../../games/regnespil/text';
import { formatNumber } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import type { Random } from '../../lib/random';
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
  const locale = useLocale();
  const [level, setLevel] = useState<Level>(1);
  const [task, setTask] = useState<Task>(() => makeTask(1, random));
  const [chosen, setChosen] = useState<number>();
  const [tally, setTally] = useState({ right: 0, total: 0 });
  const [from, to] = grades[level];

  function start(next: Level): void {
    setLevel(next);
    setTask(makeTask(next, random));
    setChosen(undefined);
    setTally({ right: 0, total: 0 });
  }

  function answer(choice: number): void {
    setChosen(choice);
    const right = choice === task.answer;
    setTally({ right: tally.right + Number(right), total: tally.total + 1 });
    if (right) void sound.effect(coin);
  }

  const verdict = chosen === undefined ? undefined : judge(chosen, task.answer);
  const answerText = formatNumber(locale, task.answer);

  return (
    <section className="family lab">
      <GameHeader title={lab.tasksTitle} onBack={onBack} />
      <p className="family-intro">{lab.tasksIntro}</p>

      <div className="lab-levels" role="radiogroup" aria-label={t.level}>
        {levels.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={level === option}
            onClick={() => {
              start(option);
            }}
          >
            {formatNumber(locale, option)}
          </button>
        ))}
      </div>
      <p className="lab-grade">
        {t.level} {formatNumber(locale, level)} · {t.grade(from, to)}
      </p>

      <div className="task">
        <SumView sum={task.sum} />
        <div className="task-choices">
          {task.choices.map((choice) => {
            const state =
              chosen === undefined
                ? undefined
                : choice === task.answer
                  ? 'right'
                  : choice === chosen
                    ? verdict
                    : 'other';
            return (
              <button
                key={choice}
                type="button"
                className="task-choice"
                data-state={state}
                disabled={chosen !== undefined}
                onClick={() => {
                  answer(choice);
                }}
              >
                {formatNumber(locale, choice)}
              </button>
            );
          })}
        </div>
        <p className="task-verdict" role="status">
          {verdict === 'right'
            ? t.right
            : verdict === 'close'
              ? t.close(answerText)
              : verdict === 'far'
                ? t.far(answerText)
                : ''}
        </p>
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
        <p className="lab-grade">{t.tally(tally.right, tally.total)}</p>
      </div>
    </section>
  );
}

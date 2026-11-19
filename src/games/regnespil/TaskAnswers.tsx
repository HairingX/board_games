import { formatNumber } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import { SumView } from './SumView';
import { judge, type Task } from './tasks';
import { text } from './text';
import './regnespil.css';

interface Props {
  task: Task;
  /** The answer chosen, once one is; then the answers show how it went. */
  chosen: number | undefined;
  onChoose: (choice: number) => void;
}

/**
 * A sum and its three answers. Once one is chosen, it shows at once: the right answer green,
 * a wrong one yellow if close and red if far off, the others faded, and in words how it went.
 */
export function TaskAnswers({ task, chosen, onChoose }: Props) {
  const t = useMessages(text);
  const locale = useLocale();
  const verdict = chosen === undefined ? undefined : judge(chosen, task.answer);
  const answer = formatNumber(locale, task.answer);

  return (
    <div className="task">
      <SumView sum={task.sum} />
      <div className="task-choices">
        {task.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className="task-choice"
            data-state={
              chosen === undefined
                ? undefined
                : choice === task.answer
                  ? 'right'
                  : choice === chosen
                    ? verdict
                    : 'other'
            }
            disabled={chosen !== undefined}
            onClick={() => {
              onChoose(choice);
            }}
          >
            {formatNumber(locale, choice)}
          </button>
        ))}
      </div>
      <p className="task-verdict" role="status">
        {verdict === 'right'
          ? t.right
          : verdict === 'close'
            ? t.close(answer)
            : verdict === 'far'
              ? t.far(answer)
              : ''}
      </p>
    </div>
  );
}

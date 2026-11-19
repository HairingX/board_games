import { useLocale, useMessages } from '../../i18n/I18n';
import { SumView } from './SumView';
import { judge, type Task } from './tasks';
import { text } from './text';
import { formatValue, ValueView } from './ValueView';
import { same, valueKey, type Value } from './values';
import './regnespil.css';

interface Props {
  task: Task;
  /** The answer chosen, once one is; then the answers show how it went. */
  chosen: Value | undefined;
  /**
   * Whether how it went shows yet: until it does, the answer chosen only shows as chosen, so
   * there is a moment of hope while the hero runs at the monster.
   */
  revealed: boolean;
  onChoose: (choice: Value) => void;
}

/**
 * A sum and its three answers. Once one is chosen and revealed, it shows how it went: the
 * right answer green, a wrong one yellow if close and red if far off, the others faded, and in
 * words how it went.
 */
export function TaskAnswers({ task, chosen, revealed, onChoose }: Props) {
  const t = useMessages(text);
  const locale = useLocale();
  const verdict =
    chosen === undefined || !revealed ? undefined : judge(chosen, task.answer, task.near);
  const answer = formatValue(locale, task.answer);

  return (
    <div className="task">
      <SumView sum={task.sum} />
      <div className="task-choices">
        {task.choices.map((choice) => (
          <button
            key={valueKey(choice)}
            type="button"
            className="task-choice"
            data-state={
              chosen === undefined
                ? undefined
                : !revealed
                  ? same(choice, chosen)
                    ? 'chosen'
                    : undefined
                  : same(choice, task.answer)
                    ? 'right'
                    : same(choice, chosen)
                      ? verdict
                      : 'other'
            }
            disabled={chosen !== undefined}
            onClick={() => {
              onChoose(choice);
            }}
          >
            <ValueView value={choice} />
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

import { formatNumber } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import { guides, levels, type Level } from './levels';
import { text } from './text';
import './regnespil.css';

/** A player's level, one step easier or harder at a time, and whom the level roughly suits. */
export function LevelStepper({
  name,
  level,
  onChange,
}: {
  /** Whose level it is. */
  name: string;
  level: Level;
  onChange: (level: Level) => void;
}) {
  const t = useMessages(text);
  const locale = useLocale();
  const guide = guides[level];
  const at = levels.indexOf(level);
  const easier = levels[at - 1];
  const harder = levels[at + 1];
  return (
    <div className="level-stepper" role="group" aria-label={t.levelOf(name)}>
      <button
        type="button"
        aria-label={t.easier}
        disabled={easier === undefined}
        onClick={
          easier === undefined
            ? undefined
            : () => {
                onChange(easier);
              }
        }
      >
        −
      </button>
      <p className="level-stepper-value" aria-live="polite">
        <strong>
          {t.level} {formatNumber(locale, level)}
        </strong>
        <span>{typeof guide === 'string' ? t.beyond[guide] : t.grade(...guide)}</span>
      </p>
      <button
        type="button"
        aria-label={t.harder}
        disabled={harder === undefined}
        onClick={
          harder === undefined
            ? undefined
            : () => {
                onChange(harder);
              }
        }
      >
        +
      </button>
    </div>
  );
}

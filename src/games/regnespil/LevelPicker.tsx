import { formatNumber } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import { grades, levels, type Level } from './levels';
import { text } from './text';
import './regnespil.css';

/** The levels side by side, the one chosen marked, and which grade it roughly suits. */
export function LevelPicker({
  level,
  onChange,
}: {
  level: Level;
  onChange: (level: Level) => void;
}) {
  const t = useMessages(text);
  const locale = useLocale();
  const [from, to] = grades[level];
  return (
    <div className="level-picker">
      <div className="level-options" role="radiogroup" aria-label={t.level}>
        {levels.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={level === option}
            onClick={() => {
              onChange(option);
            }}
          >
            {formatNumber(locale, option)}
          </button>
        ))}
      </div>
      <p className="level-grade">
        {t.level} {formatNumber(locale, level)} · {t.grade(from, to)}
      </p>
    </div>
  );
}

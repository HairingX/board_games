import { useState } from 'react';
import { timeAgo } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import { GameHeader } from '../../ui/GameHeader';
import { GameName } from '../../ui/GameName';
import { common } from '../../ui/text';
import { about } from './about';
import { cards, categories, type CategoryId } from './cards';
import {
  choose,
  hasStarted,
  progress,
  remaining,
  restart,
  type DeckState,
  type Mode,
} from './deck';
import { text } from './text';

interface Props {
  deck: DeckState;
  onChange: (deck: DeckState) => void;
  onStart: () => void;
}

const modes: readonly Mode[] = ['blandet', 'let-til-dyb'];

/** Choosing categories and order, seeing how far you are, and starting over. */
export function Setup({ deck, onChange, onStart }: Props) {
  const locale = useLocale();
  const t = useMessages(text);
  const { cancel, start, countOf } = useMessages(common);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [openedAt] = useState(Date.now);
  const { seen, later, total } = progress(deck, cards);
  const started = hasStarted(deck);
  const left = remaining({ ...deck, categories: categories.map((c) => c.id) }, cards);
  const leftIn = (id: CategoryId) => left.filter((card) => card.category === id).length;
  const chosen = new Set(deck.categories);

  function toggle(id: CategoryId): void {
    onChange(
      choose(deck, {
        categories: chosen.has(id)
          ? deck.categories.filter((other) => other !== id)
          : categories.map((c) => c.id).filter((other) => other === id || chosen.has(other)),
      }),
    );
  }

  return (
    <>
      <GameHeader title={<GameName about={about} />} />

      <p className="pk-intro">{t.intro}</p>

      <section className="pk-panel" aria-label={t.progress}>
        <div className="pk-progress-text">
          <strong>{countOf(seen, total)}</strong> {t.talkedAbout(total)}
        </div>
        {later > 0 && <p className="pk-last">{t.waiting(later)}</p>}
        {deck.playedAt !== null && (
          <p className="pk-last">{t.lastPlayed(timeAgo(locale, deck.playedAt, openedAt))}</p>
        )}
        <div
          className="pk-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={seen}
        >
          <span style={{ width: `${String(total === 0 ? 0 : (seen / total) * 100)}%` }} />
        </div>
      </section>

      <section className="pk-section">
        <h2>{t.categories}</h2>
        <div className="pk-chips">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="pk-chip"
              aria-pressed={chosen.has(category.id)}
              onClick={() => {
                toggle(category.id);
              }}
            >
              {category.name}
              <span className="pk-chip-count">{leftIn(category.id)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pk-section">
        <h2>{t.order}</h2>
        <div className="segmented" role="radiogroup" aria-label={t.order}>
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={deck.mode === mode}
              onClick={() => {
                onChange(choose(deck, { mode }));
              }}
            >
              {t.modes[mode]}
            </button>
          ))}
        </div>
      </section>

      <div className="pk-footer">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={deck.categories.length === 0}
          onClick={onStart}
        >
          {started ? t.carryOn : start}
        </button>
        {deck.categories.length === 0 && <p className="pk-note">{t.chooseOne}</p>}

        {started &&
          (confirmRestart ? (
            <div className="pk-confirm" role="alertdialog" aria-label={t.restart}>
              <p>{t.restartQuestion}</p>
              <div className="pk-confirm-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setConfirmRestart(false);
                  }}
                >
                  {cancel}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onChange(restart(deck, cards));
                    setConfirmRestart(false);
                  }}
                >
                  {t.yesRestart}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                setConfirmRestart(true);
              }}
            >
              {t.restart}
            </button>
          ))}
      </div>
    </>
  );
}

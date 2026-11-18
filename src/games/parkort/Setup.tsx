import { useState } from 'react';
import { timeAgo } from '../../lib/time';
import { GameHeader } from '../../ui/GameHeader';
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

interface Props {
  deck: DeckState;
  onChange: (deck: DeckState) => void;
  onStart: () => void;
}

const modes: readonly { id: Mode; name: string }[] = [
  { id: 'blandet', name: 'Blandet' },
  { id: 'let-til-dyb', name: 'Let til dyb' },
];

/** Choosing categories and order, seeing how far you are, and starting over. */
export function Setup({ deck, onChange, onStart }: Props) {
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
      <GameHeader title="Parkort" />

      <section className="pk-hero">
        <span className="pk-hero-icon" aria-hidden="true">
          💞
        </span>
        <p>
          Vend et kort, læs spørgsmålet højt, og svar begge to. Der er ingen rigtige svar – kun gode
          samtaler.
        </p>
      </section>

      <section className="pk-panel" aria-label="Fremskridt">
        <div className="pk-progress-text">
          <strong>
            {seen} af {total}
          </strong>{' '}
          kort snakket om
        </div>
        {later > 0 && <p className="pk-last">{later} kort venter til senere</p>}
        {deck.playedAt !== null && (
          <p className="pk-last">Sidst spillet {timeAgo(deck.playedAt, openedAt)}</p>
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
        <h2>Kategorier</h2>
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
              <span aria-hidden="true">{category.icon}</span>
              {category.name}
              <span className="pk-chip-count">{leftIn(category.id)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pk-section">
        <h2>Rækkefølge</h2>
        <div className="pk-segmented" role="radiogroup" aria-label="Rækkefølge">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={deck.mode === mode.id}
              onClick={() => {
                onChange(choose(deck, { mode: mode.id }));
              }}
            >
              {mode.name}
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
          {started ? 'Fortsæt hvor I slap' : 'Start'}
        </button>
        {deck.categories.length === 0 && <p className="pk-note">Vælg mindst én kategori.</p>}

        {started &&
          (confirmRestart ? (
            <div className="pk-confirm" role="alertdialog" aria-label="Start forfra">
              <p>Alle kort bliver blandet igen, og I starter fra første kort. Er I sikre?</p>
              <div className="pk-confirm-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setConfirmRestart(false);
                  }}
                >
                  Annullér
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onChange(restart(deck, cards));
                    setConfirmRestart(false);
                  }}
                >
                  Ja, start forfra
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
              Start forfra
            </button>
          ))}
      </div>
    </>
  );
}

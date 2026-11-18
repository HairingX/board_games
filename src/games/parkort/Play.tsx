import { AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useWakeLock } from '../../lib/wakeLock';
import { FlipCard, type CardMove } from '../../ui/FlipCard';
import { GameHeader } from '../../ui/GameHeader';
import { cards, categoryById, levelNames, levels, type QuestionCard } from './cards';
import {
  flip,
  markSeen,
  previous,
  progress,
  putOff,
  remaining,
  restart,
  type DeckState,
} from './deck';

interface Props {
  deck: DeckState;
  onChange: (deck: DeckState) => void;
  onBack: () => void;
}

/**
 * The deck: tap the top card to turn it, then go on to the next card, put it off till later,
 * or go back to the card before. Thrown right it goes on; thrown left the card before comes back.
 */
export function Play({ deck, onChange, onBack }: Props) {
  const [move, setMove] = useState<CardMove>('next');
  useWakeLock(true);
  const queue = remaining(deck, cards);
  const card = queue[0];
  const canGoBack = deck.history.length > 0;
  const { seen, total } = progress(deck, cards);

  function go(nextMove: CardMove, next: DeckState): void {
    setMove(nextMove);
    onChange(next);
  }

  const goBack = () => {
    go('previous', previous(deck));
  };

  if (!card) {
    return (
      <>
        <GameHeader title="Parkort" onBack={onBack} />
        <section className="pk-done">
          <span className="pk-done-icon" aria-hidden="true">
            🎉
          </span>
          <h2>Godt snakket!</h2>
          <p>I har været alle {total} kort i de valgte kategorier igennem.</p>
          <div className="pk-footer">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                onChange(restart(deck, cards));
              }}
            >
              Start forfra
            </button>
            {canGoBack && (
              <button type="button" className="btn btn-ghost btn-block" onClick={goBack}>
                Forrige kort
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-block" onClick={onBack}>
              Vælg andre kategorier
            </button>
          </div>
        </section>
      </>
    );
  }

  const current = card;
  const flipped = deck.flipped === current.id;
  const putOffJustNow = !flipped && deck.history.at(-1)?.action === 'later';

  return (
    <div className="pk-play">
      <GameHeader
        title="Parkort"
        onBack={onBack}
        aside={
          <span aria-label={`${String(seen)} af ${String(total)} kort snakket om`}>
            {seen} / {total}
          </span>
        }
      />

      <div className="pk-table">
        {queue.length > 2 && <div className="pk-stack pk-stack-2" aria-hidden="true" />}
        {queue.length > 1 && <div className="pk-stack pk-stack-1" aria-hidden="true" />}
        <AnimatePresence custom={move} initial={false}>
          <FlipCard
            key={current.id}
            move={move}
            flipped={flipped}
            onFlip={() => {
              onChange(flip(deck, current.id, Date.now()));
            }}
            onSwipe={(direction) => {
              if (direction === 1) go('next', markSeen(deck, current.id));
              else if (canGoBack) goBack();
            }}
            label="Vend kortet"
            back={<CardBack />}
            front={<CardFront card={current} />}
          />
        </AnimatePresence>
      </div>

      <p className="pk-hint" aria-live="polite">
        {flipped
          ? 'Læs kortet højt, og svar begge to.'
          : putOffJustNow
            ? 'Kortet ligger nu nederst i bunken.'
            : 'Tryk på kortet for at vende det.'}
      </p>

      <div className="pk-actions">
        <button type="button" className="btn btn-ghost" disabled={!canGoBack} onClick={goBack}>
          Forrige
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!flipped}
          onClick={() => {
            go('next', markSeen(deck, current.id));
          }}
        >
          Næste kort
        </button>
      </div>
      <button
        type="button"
        className="btn btn-quiet btn-block"
        disabled={!flipped}
        onClick={() => {
          go('later', putOff(deck, current.id));
        }}
      >
        Tag den senere
      </button>
    </div>
  );
}

function CardBack() {
  return (
    <>
      <span className="pk-back-icon">💞</span>
      <span className="pk-back-title">Parkort</span>
      <span className="pk-back-hint">Tryk for at vende</span>
    </>
  );
}

function CardFront({ card }: { card: QuestionCard }) {
  const category = categoryById[card.category];
  return (
    <>
      <div className="pk-front-top">
        <span className="pk-front-category">
          <span aria-hidden="true">{category.icon}</span> {category.name}
        </span>
        <span className="pk-front-level" aria-label={`Niveau: ${levelNames[card.level]}`}>
          {levels.map((level) => (
            <span key={level} className={level <= card.level ? 'on' : ''} />
          ))}
        </span>
      </div>
      <p className="pk-front-text">{card.text}</p>
      <span className="pk-front-mark" aria-hidden="true">
        💞
      </span>
    </>
  );
}

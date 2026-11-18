import { AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { FlipCard } from '../../ui/FlipCard';
import { GameHeader } from '../../ui/GameHeader';
import { cards, categoryById, levelNames, type QuestionCard } from './cards';
import { flip, markSeen, progress, remaining, restart, skip, type DeckState } from './deck';

interface Props {
  deck: DeckState;
  onChange: (deck: DeckState) => void;
  onBack: () => void;
}

/** The deck: tap the top card to turn it, then go on to the next or skip it. */
export function Play({ deck, onChange, onBack }: Props) {
  const [direction, setDirection] = useState<-1 | 1>(1);
  const queue = remaining(deck, cards);
  const card = queue[0];
  const flipped = card !== undefined && deck.flipped === card.id;
  const { seen, total } = progress(deck, cards);

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
            <button type="button" className="btn btn-ghost btn-block" onClick={onBack}>
              Vælg andre kategorier
            </button>
          </div>
        </section>
      </>
    );
  }

  function leave(towards: -1 | 1, next: DeckState): void {
    setDirection(towards);
    onChange(next);
  }

  const current = card;
  const talkedAbout = (towards: -1 | 1) => {
    leave(towards, markSeen(deck, current.id));
  };

  return (
    <>
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
        <AnimatePresence custom={direction} initial={false}>
          <FlipCard
            key={card.id}
            flipped={flipped}
            onFlip={() => {
              onChange(flip(deck, current.id, Date.now()));
            }}
            onSwipe={talkedAbout}
            label="Vend kortet"
            back={<CardBack />}
            front={<CardFront card={card} />}
          />
        </AnimatePresence>
      </div>

      <p className="pk-hint">
        {flipped
          ? 'Læs højt, og svar begge to. Swipe kortet væk, når I er færdige.'
          : 'Tryk på kortet for at vende det.'}
      </p>

      <div className="pk-actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!flipped}
          onClick={() => {
            leave(-1, skip(deck, current.id));
          }}
        >
          Spring over
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!flipped}
          onClick={() => {
            talkedAbout(1);
          }}
        >
          Næste kort
        </button>
      </div>
    </>
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
          {[1, 2, 3].map((dot) => (
            <span key={dot} className={dot <= card.level ? 'on' : ''} />
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

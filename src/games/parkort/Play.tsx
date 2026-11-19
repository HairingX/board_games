import { AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useWakeLock } from '../../lib/wakeLock';
import { FlipCard, type CardMove } from '../../ui/FlipCard';
import { useMessages } from '../../i18n/I18n';
import { GameHeader } from '../../ui/GameHeader';
import { GameName } from '../../ui/GameName';
import { common } from '../../ui/text';
import { about } from './about';
import { CardBack, CardFront } from './CardFaces';
import { cards } from './cards';
import {
  flip,
  markSeen,
  progress,
  putAway,
  putOff,
  remaining,
  restart,
  type DeckState,
} from './deck';
import { text } from './text';

interface Props {
  deck: DeckState;
  onChange: (deck: DeckState) => void;
  onBack: () => void;
}

/**
 * The deck: tap the top card to turn it, then go on to the next card or put it off till later.
 * "Forrige" looks back at the cards put away, face up, and "Næste kort" goes forward again; looking
 * back changes nothing and is never saved, so the game always reopens at the furthest card.
 * Thrown right a card goes on; thrown left the card before comes back to look at.
 */
export function Play({ deck, onChange, onBack }: Props) {
  const t = useMessages(text);
  const { countOf } = useMessages(common);
  const [move, setMove] = useState<CardMove>('next');
  /** How many cards back the couple is looking; 0 at the furthest card. */
  const [back, setBack] = useState(0);
  useWakeLock(true);
  const queue = remaining(deck, cards);
  const past = putAway(deck, cards);
  const { seen, total } = progress(deck, cards);
  const canGoBack = back < past.length;

  const goBack = () => {
    setMove('previous');
    setBack(back + 1);
  };

  const lookingBack = back > 0;
  const shown = lookingBack ? past[back - 1] : queue[0];
  if (!shown) {
    return (
      <>
        <GameHeader title={<GameName about={about} />} onBack={onBack} />
        <section className="pk-done">
          <span className="pk-done-icon" aria-hidden="true">
            🎉
          </span>
          <h2>{t.doneTitle}</h2>
          <p>{t.doneAll(total)}</p>
          <p>{t.doneAgain}</p>
          <div className="pk-footer">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                onChange(restart(deck, cards));
              }}
            >
              {t.newRound}
            </button>
            {canGoBack && (
              <button type="button" className="btn btn-ghost btn-block" onClick={goBack}>
                {t.previousCard}
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-block" onClick={onBack}>
              {t.otherCategories}
            </button>
          </div>
        </section>
      </>
    );
  }

  const flipped = lookingBack || deck.flipped === shown.id;
  const putOffJustNow = !flipped && deck.history.at(-1)?.action === 'later';

  const goOn = () => {
    setMove('next');
    if (lookingBack) setBack(back - 1);
    else onChange(markSeen(deck, shown.id));
  };

  return (
    <div className="pk-play">
      <GameHeader
        title={<GameName about={about} />}
        onBack={onBack}
        aside={
          <span aria-label={`${countOf(seen, total)} ${t.talkedAbout(total)}`}>
            {seen} / {total}
          </span>
        }
      />

      <div className="pk-table">
        <div className="pk-slot">
          {queue.length > 2 && <div className="pk-stack pk-stack-2" aria-hidden="true" />}
          {queue.length > 1 && <div className="pk-stack pk-stack-1" aria-hidden="true" />}
          <AnimatePresence custom={move} initial={false}>
            <FlipCard
              key={`${shown.id}@${String(back)}`}
              move={move}
              flipped={flipped}
              onFlip={() => {
                onChange(flip(deck, shown.id, Date.now()));
              }}
              onSwipe={(direction) => {
                if (direction === 1) goOn();
                else if (canGoBack) goBack();
              }}
              label={t.turnCard}
              back={<CardBack />}
              front={<CardFront card={shown} />}
            />
          </AnimatePresence>
        </div>
      </div>

      <p className="pk-hint" aria-live="polite">
        {lookingBack
          ? t.lookingBack(t.next)
          : flipped
            ? t.readAloud
            : putOffJustNow
              ? t.putAtBottom
              : t.tapToTurn}
      </p>

      <div className="pk-actions">
        <button type="button" className="btn btn-ghost" disabled={!canGoBack} onClick={goBack}>
          {t.previous}
        </button>
        <button type="button" className="btn btn-primary" disabled={!flipped} onClick={goOn}>
          {t.next}
        </button>
      </div>
      <button
        type="button"
        className="btn btn-quiet btn-block"
        disabled={!flipped || lookingBack}
        onClick={() => {
          setMove('later');
          onChange(putOff(deck, shown.id));
        }}
      >
        {t.later}
      </button>
    </div>
  );
}

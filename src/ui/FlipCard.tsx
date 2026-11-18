import { motion, useMotionValue, useTransform, type Variants } from 'motion/react';
import type { ReactNode } from 'react';
import { motionTokens } from './motion';
import './FlipCard.css';

/** Why a card enters or leaves: going on, going back to the one before, or putting it off. */
export type CardMove = 'next' | 'previous' | 'later';

/** -1 or 1 when a drag ended far or fast enough to throw the card that way, otherwise 0. */
export function swipeDirection(offset: number, velocity: number): -1 | 0 | 1 {
  const { distance, velocityWeight } = motionTokens.swipe;
  const push = offset + velocity * velocityWeight;
  if (Math.abs(push) < distance) return 0;
  return push < 0 ? -1 : 1;
}

const { throw: thrown, sink } = motionTokens;

/**
 * The card a move brings in arrives from the pile, or from the left when it is the card before;
 * the card it takes away is thrown to the right, or sinks back into the pile.
 */
const variants: Variants = {
  enter: (move: CardMove) =>
    move === 'previous'
      ? { opacity: 0, x: -thrown.distance, rotate: -thrown.tilt }
      : { opacity: 0, y: sink.drop, scale: sink.scale },
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    zIndex: 1,
    transition: motionTokens.arrive,
  },
  exit: (move: CardMove) =>
    move === 'next'
      ? {
          opacity: 0,
          x: thrown.distance,
          rotate: thrown.tilt,
          zIndex: 2,
          transition: motionTokens.leave,
        }
      : { opacity: 0, y: sink.drop, scale: sink.scale, zIndex: 0, transition: motionTokens.leave },
};

interface Props {
  /** Whether the face shows. */
  flipped: boolean;
  /** Called when the face-down card is tapped. */
  onFlip: () => void;
  /** Called when the face-up card is thrown left (-1) or right (1); without it, it cannot be. */
  onSwipe?: (direction: -1 | 1) => void;
  /** The move that brought this card in, which decides where it comes from. */
  move: CardMove;
  /** What the card shows face down. */
  back: ReactNode;
  /** What the card shows face up. */
  front: ReactNode;
  /** The accessible name of the face-down card, which is a button. */
  label: string;
}

/**
 * A playing card that turns over with a spring when tapped and, face up, can be thrown aside.
 * Inside AnimatePresence, give AnimatePresence the same `custom` move, so that the card leaving
 * knows where to go.
 */
export function FlipCard({ flipped, onFlip, onSwipe, move, back, front, label }: Props) {
  const x = useMotionValue(0);
  const { degrees, distance } = motionTokens.dragTilt;
  const rotate = useTransform(x, [-distance, distance], [-degrees, degrees]);
  const canSwipe = flipped && onSwipe !== undefined;

  return (
    <motion.div
      className="flip-card"
      custom={move}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ x, rotate }}
      drag={canSwipe ? 'x' : false}
      dragSnapToOrigin
      dragElastic={motionTokens.swipe.elastic}
      onDragEnd={(_event, info) => {
        const direction = swipeDirection(info.offset.x, info.velocity.x);
        if (direction !== 0) onSwipe?.(direction);
      }}
      whileTap={flipped ? {} : motionTokens.press}
    >
      <motion.div
        className="flip-card-inner"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={motionTokens.flip}
      >
        <button
          type="button"
          className="flip-card-face flip-card-back"
          onClick={onFlip}
          disabled={flipped}
          aria-label={label}
          aria-hidden={flipped}
        >
          {back}
        </button>
        <div className="flip-card-face flip-card-front" aria-hidden={!flipped}>
          {front}
        </div>
      </motion.div>
    </motion.div>
  );
}

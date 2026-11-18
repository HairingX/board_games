import { motion, useMotionValue, useTransform, type Variants } from 'motion/react';
import type { ReactNode } from 'react';
import './FlipCard.css';

/** -1 or 1 when a drag ended far or fast enough to throw the card that way, otherwise 0. */
export function swipeDirection(offset: number, velocity: number): -1 | 0 | 1 {
  const push = offset + velocity * 0.2;
  if (Math.abs(push) < 120) return 0;
  return push < 0 ? -1 : 1;
}

const variants: Variants = {
  enter: { opacity: 0, y: 28, scale: 0.94 },
  center: { opacity: 1, y: 0, scale: 1, zIndex: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * 440,
    rotate: direction * 18,
    zIndex: 2,
    transition: { duration: 0.32, ease: 'easeIn' },
  }),
};

interface Props {
  /** Whether the face shows. */
  flipped: boolean;
  /** Called when the face-down card is tapped. */
  onFlip: () => void;
  /** Called when the face-up card is thrown left (-1) or right (1). */
  onSwipe?: (direction: -1 | 1) => void;
  /** What the card shows face down. */
  back: ReactNode;
  /** What the card shows face up. */
  front: ReactNode;
  /** The accessible name of the face-down card, which is a button. */
  label: string;
}

/**
 * A playing card that turns over with a spring when tapped, and once face up can be thrown
 * aside. Inside AnimatePresence it rises in, and leaves in the direction given as `custom`.
 */
export function FlipCard({ flipped, onFlip, onSwipe, back, front, label }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-14, 14]);
  const canSwipe = flipped && onSwipe !== undefined;

  return (
    <motion.div
      className="flip-card"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ x, rotate }}
      drag={canSwipe ? 'x' : false}
      dragSnapToOrigin
      dragElastic={0.8}
      onDragEnd={(_event, info) => {
        const direction = swipeDirection(info.offset.x, info.velocity.x);
        if (direction !== 0) onSwipe?.(direction);
      }}
      whileTap={flipped ? {} : { scale: 0.97 }}
    >
      <motion.div
        className="flip-card-inner"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 210, damping: 19, mass: 0.9 }}
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

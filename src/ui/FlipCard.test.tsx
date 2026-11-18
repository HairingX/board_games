import { fireEvent, render, screen } from '@testing-library/react';
import { AnimatePresence } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { drag } from '../../tests/drag';
import { FlipCard, swipeDirection, type CardMove } from './FlipCard';

describe('swipeDirection', () => {
  it.each([
    [0, 0, 0],
    [100, 0, 0],
    [-100, 0, 0],
    [130, 0, 1],
    [-130, 0, -1],
    [20, 600, 1],
    [-20, -600, -1],
    [150, -1500, -1],
  ])('reads offset %d and velocity %d as %d', (offset, velocity, expected) => {
    expect(swipeDirection(offset, velocity)).toBe(expected);
  });
});

function Card({
  flipped,
  onFlip = () => undefined,
  onSwipe,
  move = 'next',
  id = 'kort',
}: {
  flipped: boolean;
  onFlip?: () => void;
  onSwipe?: (direction: -1 | 1) => void;
  move?: CardMove;
  id?: string;
}) {
  return (
    <AnimatePresence custom={move}>
      <FlipCard
        key={id}
        flipped={flipped}
        onFlip={onFlip}
        {...(onSwipe ? { onSwipe } : {})}
        move={move}
        label="Vend kortet"
        back={<span>Bagside {id}</span>}
        front={<span>Forside {id}</span>}
      />
    </AnimatePresence>
  );
}

const cardOf = (text: string): Element => {
  const card = screen.getByText(text).closest('.flip-card');
  if (!card) throw new Error('No card');
  return card;
};

describe('FlipCard', () => {
  it('turns over when the face-down card is tapped', () => {
    const onFlip = vi.fn();
    render(<Card flipped={false} onFlip={onFlip} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vend kortet' }));
    expect(onFlip).toHaveBeenCalledOnce();
  });

  it('cannot be tapped again once face up', () => {
    render(<Card flipped />);
    expect(screen.getByText('Bagside kort').closest('button')).toBeDisabled();
    expect(screen.getByText('Forside kort')).toBeInTheDocument();
  });

  it.each([
    [300, 1],
    [-300, -1],
  ])('is thrown when dragged %d pixels', async (distance, direction) => {
    const onSwipe = vi.fn();
    render(<Card flipped onSwipe={onSwipe} />);
    await drag(cardOf('Forside kort'), distance);
    expect(onSwipe).toHaveBeenCalledWith(direction);
  });

  it('springs back when dragged only a little', async () => {
    const onSwipe = vi.fn();
    render(<Card flipped onSwipe={onSwipe} />);
    await drag(cardOf('Forside kort'), 30);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it.each<CardMove>(['next', 'previous', 'later'])(
    'replaces one card with the next for the move %s',
    async (move) => {
      const { rerender } = render(<Card flipped move={move} id="første" />);
      rerender(<Card flipped move={move} id="anden" />);
      expect(await screen.findByText('Forside anden')).toBeInTheDocument();
    },
  );
});

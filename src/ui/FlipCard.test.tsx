import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FlipCard, swipeDirection } from './FlipCard';

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

function renderCard(flipped: boolean, onSwipe?: (direction: -1 | 1) => void) {
  const onFlip = vi.fn();
  render(
    <FlipCard
      flipped={flipped}
      onFlip={onFlip}
      {...(onSwipe ? { onSwipe } : {})}
      label="Vend kortet"
      back={<span>Bagside</span>}
      front={<span>Forside</span>}
    />,
  );
  return { onFlip };
}

const nextFrame = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 20);
  });

async function drag(element: Element, distance: number): Promise<void> {
  fireEvent.pointerDown(element, {
    pointerId: 1,
    button: 0,
    isPrimary: true,
    clientX: 0,
    clientY: 0,
  });
  for (let step = 1; step <= 5; step++) {
    await nextFrame();
    fireEvent.pointerMove(window, {
      pointerId: 1,
      isPrimary: true,
      clientX: (distance * step) / 5,
      clientY: 0,
    });
  }
  await nextFrame();
  fireEvent.pointerUp(window, { pointerId: 1, isPrimary: true, clientX: distance, clientY: 0 });
  await nextFrame();
}

describe('FlipCard', () => {
  it('turns over when the face-down card is tapped', () => {
    const { onFlip } = renderCard(false);
    fireEvent.click(screen.getByRole('button', { name: 'Vend kortet' }));
    expect(onFlip).toHaveBeenCalledOnce();
  });

  it('cannot be tapped again once face up', () => {
    renderCard(true);
    expect(screen.getByText('Bagside').closest('button')).toBeDisabled();
    expect(screen.getByText('Forside')).toBeInTheDocument();
  });

  it('is thrown in the direction it is dragged far enough', async () => {
    const onSwipe = vi.fn();
    renderCard(true, onSwipe);
    const card = screen.getByText('Forside').closest('.flip-card');
    if (!card) throw new Error('No card');
    await drag(card, 300);
    expect(onSwipe).toHaveBeenCalledWith(1);
  });

  it('springs back when dragged only a little', async () => {
    const onSwipe = vi.fn();
    renderCard(true, onSwipe);
    const card = screen.getByText('Forside').closest('.flip-card');
    if (!card) throw new Error('No card');
    await drag(card, 30);
    expect(onSwipe).not.toHaveBeenCalled();
  });
});

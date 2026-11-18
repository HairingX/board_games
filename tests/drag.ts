import { fireEvent } from '@testing-library/react';

const nextFrame = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 20);
  });

/**
 * Drags the element sideways by the distance, a frame between each step, as Motion reads
 * pointer moves once a frame.
 */
export async function drag(element: Element, distance: number): Promise<void> {
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

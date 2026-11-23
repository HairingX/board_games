import { act, render, screen, waitFor } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scene } from '../lib/scene/scene';
import { loadPicture, paint, SceneCanvas, type LoadPicture } from './SceneCanvas';

const scene: Scene = {
  columns: 2,
  rows: 1,
  groundSheet: 'floor',
  ground: [
    [
      [0, 0],
      [1, 0],
    ],
  ],
  things: [],
  figures: [{ sheet: 'hero', x: 0, y: 0, facing: 'down', doing: 'standing' }],
};
const sheets = { floor: '/floor.png', hero: '/hero.png' };

/** A drawing context that remembers what it drew. */
function fakeContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    imageSmoothingEnabled: true,
  };
}

let resized: (() => void) | undefined;

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resized = callback;
      }
      observe(): void {
        resized?.();
      }
      disconnect(): void {
        resized = undefined;
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const loadAll: LoadPicture = (url) => Promise.resolve({ url } as unknown as CanvasImageSource);

function drawWith(context: ReturnType<typeof fakeContext> | null) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
}

describe('SceneCanvas', () => {
  it('draws the scene once its pictures load, enlarged by a whole number to fit', async () => {
    const context = fakeContext();
    drawWith(context);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    render(<SceneCanvas scene={scene} sheets={sheets} label="En skov" load={loadAll} />);
    const canvas = screen.getByRole('img', { name: 'En skov' });
    expect(canvas).toHaveAttribute('width', String(32 * 3));
    expect(canvas.parentElement).toHaveStyle({ width: `${String(32 * 3)}px` });
    await waitFor(() => {
      expect(context.drawImage.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
    expect(context.setTransform).toHaveBeenCalledWith(3, 0, 0, 3, 0, 0);
    expect(context.imageSmoothingEnabled).toBe(false);
  });

  it('counts the scale in the phone’s own pixels, and lays the overlay in the stage’s', () => {
    drawWith(null);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    vi.stubGlobal('devicePixelRatio', 3);
    render(
      <SceneCanvas
        scene={scene}
        sheets={sheets}
        label="En skov"
        load={loadAll}
        overlay={<span>Hjerter</span>}
      />,
    );
    const canvas = screen.getByRole('img', { name: 'En skov' });
    // 100 page pixels are 300 of the phone's; 300 / 32 gives 9 for each of the stage's pixels.
    expect(canvas).toHaveAttribute('width', String(32 * 9));
    expect(canvas.parentElement).toHaveStyle({ width: '96px', '--px': '3px' });
    // Over the scene, in a layer the camera moves.
    expect(screen.getByText('Hjerter').parentElement?.parentElement).toBe(canvas.parentElement);
    vi.unstubAllGlobals();
  });

  it('lays the light over the scene, keeps what is in front still, and moves the overlay with the camera', async () => {
    const context = fakeContext();
    drawWith(context);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(64);
    const filmed: Scene = {
      ...scene,
      light: 'evening',
      camera: { start: { x: 24, y: 8, zoom: 2 } },
    };
    const { container, rerender } = render(
      <SceneCanvas
        scene={filmed}
        sheets={sheets}
        label="En skov"
        load={loadAll}
        overlay={<span>Hjerter</span>}
        front={<p>Konen siger</p>}
      />,
    );
    expect(container.querySelector('.scene-light')).toHaveAttribute('data-light', 'evening');
    expect(screen.getByText('Konen siger').parentElement).toHaveClass('scene-frame');
    await waitFor(() => {
      expect(context.drawImage).toHaveBeenCalled();
    });
    // Twice enlarged, its corner at 16 across and 4 down of the stage's 32 by 16 pixels, at a
    // scale of 2.
    expect(context.setTransform).toHaveBeenCalledWith(4, 0, 0, 4, -64, -16);
    expect(screen.getByText('Hjerter').parentElement).toHaveStyle({
      transform: 'translate(-64px, -16px) scale(2)',
    });
    rerender(
      <SceneCanvas
        scene={{ ...scene, light: 'day' }}
        sheets={sheets}
        label="En skov"
        load={loadAll}
      />,
    );
    expect(container.querySelector('.scene-light')).toBeNull();
  });

  it('fits inside a low box both ways when asked', () => {
    drawWith(null);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
    render(<SceneCanvas scene={scene} sheets={sheets} label="En skov" load={loadAll} fit="box" />);
    const canvas = screen.getByRole('img', { name: 'En skov' });
    // 100 wide would give 3, but only 40 high: 40 / 16 gives 2.
    expect(canvas).toHaveAttribute('width', String(32 * 2));
  });

  it('draws again only when the picture changes, as the figure breathes', async () => {
    const context = fakeContext();
    drawWith(context);
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const { unmount } = render(
      <SceneCanvas scene={scene} sheets={sheets} label="En skov" load={loadAll} />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(context.clearRect).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(context.clearRect).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(context.clearRect).toHaveBeenCalledTimes(2);
    unmount();
    vi.useRealTimers();
  });

  it('stands still when motion is reduced, drawing it once', async () => {
    const context = fakeContext();
    drawWith(context);
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const { unmount } = render(
      <MotionConfig reducedMotion="always">
        <SceneCanvas scene={scene} sheets={sheets} label="En skov" load={loadAll} />
      </MotionConfig>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(context.clearRect).toHaveBeenCalledTimes(1);
    unmount();
    vi.useRealTimers();
  });

  it('draws nothing where the browser cannot draw, or a picture will not load', async () => {
    drawWith(null);
    const first = render(
      <SceneCanvas scene={scene} sheets={sheets} label="Ingen" load={loadAll} />,
    );
    await act(() => Promise.resolve());
    first.unmount();
    const context = fakeContext();
    drawWith(context);
    const { unmount } = render(
      <SceneCanvas
        scene={scene}
        sheets={sheets}
        label="Mangler"
        load={() => Promise.reject(new Error('gone'))}
      />,
    );
    await act(() => Promise.resolve());
    expect(context.drawImage).not.toHaveBeenCalled();
    unmount();
  });

  it('forgets pictures that load after it is gone', async () => {
    const context = fakeContext();
    drawWith(context);
    let finish: () => void = () => undefined;
    const slow: LoadPicture = (url) =>
      new Promise((resolve) => {
        finish = () => {
          resolve({ url } as unknown as CanvasImageSource);
        };
      });
    const { unmount } = render(
      <SceneCanvas scene={scene} sheets={{ floor: '/floor.png' }} label="Langsom" load={slow} />,
    );
    unmount();
    await act(async () => {
      finish();
      await Promise.resolve();
    });
    expect(context.drawImage).not.toHaveBeenCalled();
  });
});

describe('paint', () => {
  it('turns a figure about its middle by quarter turns, and back for the next', () => {
    const context = fakeContext();
    const picture = document.createElement('canvas');
    paint(
      context as unknown as CanvasRenderingContext2D,
      [
        { sheet: 'hero', cut: { x: 0, y: 0, width: 16, height: 16 }, x: 10, y: 20, turn: 1 },
        { sheet: 'hero', cut: { x: 0, y: 0, width: 16, height: 16 }, x: 40, y: 20 },
      ],
      new Map([['hero', picture]]),
      { width: 64, height: 64 },
      2,
    );
    expect(context.setTransform.mock.calls).toEqual([
      [1, 0, 0, 1, 0, 0],
      [2, 0, 0, 2, 0, 0],
      [0, 2, -2, 0, 36, 56],
      [2, 0, 0, 2, 0, 0],
    ]);
    expect(context.drawImage.mock.calls[0]?.slice(5)).toEqual([-8, -8, 16, 16]);
    expect(context.drawImage.mock.calls[1]?.slice(5)).toEqual([40, 20, 16, 16]);
  });

  it('grows a figure about its feet, and mirrors it, as a monster swelling and spinning', () => {
    const context = fakeContext();
    const picture = document.createElement('canvas');
    paint(
      context as unknown as CanvasRenderingContext2D,
      [
        { sheet: 'boss', cut: { x: 0, y: 0, width: 20, height: 10 }, x: 10, y: 20, grow: 1.5 },
        { sheet: 'boss', cut: { x: 0, y: 0, width: 20, height: 10 }, x: 10, y: 20, flip: true },
      ],
      new Map([['boss', picture]]),
      { width: 64, height: 64 },
      2,
    );
    // A zero may come out signed, which draws the same.
    const unsigned = context.setTransform.mock.calls.map((call) =>
      (call as number[]).map((n) => n + 0),
    );
    expect(unsigned).toEqual([
      [1, 0, 0, 1, 0, 0],
      [2, 0, 0, 2, 0, 0],
      [3, 0, 0, 3, 40, 45],
      [2, 0, 0, 2, 0, 0],
      [-2, 0, 0, 2, 40, 50],
      [2, 0, 0, 2, 0, 0],
    ]);
    expect(context.drawImage.mock.calls[0]?.slice(5)).toEqual([-10, -5, 20, 10]);
  });

  it('draws a faint picture faintly, and the next wholly', () => {
    const context = fakeContext();
    const alphas: number[] = [];
    const picture = document.createElement('canvas');
    const drawing = {
      ...context,
      drawImage: vi.fn(() => {
        alphas.push((drawing as unknown as { globalAlpha: number }).globalAlpha);
      }),
    };
    paint(
      drawing as unknown as CanvasRenderingContext2D,
      [
        { sheet: 'rays', cut: { x: 0, y: 0, width: 8, height: 8 }, x: 0, y: 0, opacity: 0.2 },
        { sheet: 'rays', cut: { x: 0, y: 0, width: 8, height: 8 }, x: 8, y: 0 },
      ],
      new Map([['rays', picture]]),
      { width: 16, height: 8 },
      1,
    );
    expect(alphas).toEqual([0.2, 1]);
  });

  it('leaves out a picture it does not have', () => {
    const context = fakeContext();
    paint(
      context as unknown as CanvasRenderingContext2D,
      [{ sheet: 'gone', cut: { x: 0, y: 0, width: 16, height: 16 }, x: 0, y: 0 }],
      new Map(),
      { width: 16, height: 16 },
      2,
    );
    expect(context.drawImage).not.toHaveBeenCalled();
  });
});

describe('loadPicture', () => {
  it('loads a picture with the browser, or says it could not', async () => {
    const picture = document.createElement('img');
    const loading = loadPicture('/hero.png', () => picture);
    expect(picture.getAttribute('src')).toBe('/hero.png');
    picture.dispatchEvent(new Event('load'));
    expect(await loading).toBe(picture);

    const broken = document.createElement('img');
    const failing = loadPicture('/gone.png', () => broken);
    broken.dispatchEvent(new Event('error'));
    await expect(failing).rejects.toThrow('/gone.png');
  });

  it('makes an image element when none is given', () => {
    void loadPicture('/hero.png').catch(() => undefined);
  });
});

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
    expect(canvas).toHaveStyle({ width: `${String(32 * 3)}px` });
    await waitFor(() => {
      expect(context.drawImage).toHaveBeenCalledTimes(3);
    });
    expect(context.setTransform).toHaveBeenCalledWith(3, 0, 0, 3, 0, 0);
    expect(context.imageSmoothingEnabled).toBe(false);
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

  it('stands still when motion is reduced', async () => {
    const context = fakeContext();
    drawWith(context);
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    render(
      <MotionConfig reducedMotion="always">
        <SceneCanvas scene={scene} sheets={sheets} label="En skov" load={loadAll} />
      </MotionConfig>,
    );
    await waitFor(() => {
      expect(context.drawImage).toHaveBeenCalled();
    });
    expect(frame).not.toHaveBeenCalled();
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

import { useReducedMotionConfig } from 'motion/react';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { drawScene, stageSize, type Draw, type Scene } from '../lib/scene/scene';
import './SceneCanvas.css';

/** Loads a picture for drawing; the tests give their own. */
export type LoadPicture = (url: string) => Promise<CanvasImageSource>;

/** Loads a picture with the browser, from an image element `make` gives. */
export function loadPicture(
  url: string,
  make: () => HTMLImageElement = () => new Image(),
): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    const picture = make();
    picture.onload = () => {
      resolve(picture);
    };
    picture.onerror = () => {
      reject(new Error(`The picture ${url} could not be loaded.`));
    };
    picture.src = url;
  });
}

/** Draws what is to be drawn, enlarged by the whole number given, every pixel sharp. */
export function paint(
  context: CanvasRenderingContext2D,
  draws: readonly Draw[],
  pictures: ReadonlyMap<string, CanvasImageSource>,
  size: { width: number; height: number },
  scale: number,
): void {
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, size.width, size.height);
  for (const { sheet, cut, x, y, turn, grow, flip } of draws) {
    const picture = pictures.get(sheet);
    if (!picture) continue;
    const { width, height } = cut;
    if (turn === undefined && grow === undefined && !flip) {
      context.drawImage(picture, cut.x, cut.y, width, height, x, y, width, height);
      continue;
    }
    // Grown about its feet, mirrored, and turned about its middle by quarter turns, which keep
    // every pixel on the grid: a monster swelling or spinning, a figure knocked over.
    const size = grow ?? 1;
    const mirror = flip ? -1 : 1;
    const sin = Math.round(Math.sin(((turn ?? 0) * Math.PI) / 2));
    const cos = Math.round(Math.cos(((turn ?? 0) * Math.PI) / 2));
    const middle = { x: x + width / 2, y: y + height - (height * size) / 2 };
    context.setTransform(
      scale * cos * size * mirror,
      scale * sin * size * mirror,
      -scale * sin * size,
      scale * cos * size,
      middle.x * scale,
      middle.y * scale,
    );
    context.drawImage(picture, cut.x, cut.y, width, height, -width / 2, -height / 2, width, height);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }
}

/**
 * How many of the phone's own pixels each pixel of the stage is drawn as: the largest whole
 * number that fits the box's width, and with `fit` "box" its height too, at least 1. Counted
 * in the phone's pixels, not the page's, so the stage fills the box closely and every pixel
 * stays sharp.
 */
function useDeviceScale(
  box: HTMLElement | null,
  size: { width: number; height: number },
  density: number,
  fit: Fit,
): number {
  const [scale, setScale] = useState(density);
  const { width, height } = size;
  useEffect(() => {
    if (!box) return;
    const observer = new ResizeObserver(() => {
      const across = (box.clientWidth * density) / width;
      const down = fit === 'box' ? (box.clientHeight * density) / height : across;
      setScale(Math.max(1, Math.floor(Math.min(across, down))));
    });
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  }, [box, width, height, density, fit]);
  return scale;
}

/** Whether the stage fills the box's width, or fits inside the box both ways. */
type Fit = 'width' | 'box';

/** The scene's pictures, by name, once every one has loaded. */
function usePictures(
  sheets: Readonly<Record<string, string>>,
  load: LoadPicture,
): ReadonlyMap<string, CanvasImageSource> | undefined {
  const [pictures, setPictures] = useState<ReadonlyMap<string, CanvasImageSource>>();
  useEffect(() => {
    let current = true;
    void Promise.all(
      Object.entries(sheets).map(async ([name, url]) => [name, await load(url)] as const),
    )
      .then((loaded) => {
        if (current) setPictures(new Map(loaded));
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [sheets, load]);
  return pictures;
}

interface Props {
  scene: Scene;
  /** The address of each picture the scene names. */
  sheets: Readonly<Record<string, string>>;
  /** What the scene shows, said to those who cannot see it. */
  label: string;
  load?: LoadPicture;
  /**
   * What lies over the scene, such as a game's hearts and name plates, placed in the stage's
   * own pixels with the custom property `--px`, the size of one of them on the page.
   */
  overlay?: ReactNode;
  /**
   * "width" (the default) to fill the box's width, the box as tall as the stage then is;
   * "box" to fit inside a box whose height is set from outside, as a screen with little
   * height makes it, smaller on a low phone.
   */
  fit?: Fit;
}

/**
 * A scene of the puppet theatre, drawn on a canvas: each of its pixels a whole number of the
 * phone's own pixels, as many as fill the width, and drawn again only when the picture
 * changes, so it costs the battery little. Its clock is the page's (`performance.now()`, in seconds), so a
 * screen can start an act at the moment it happens. With reduced motion on, nothing moves.
 */
export function SceneCanvas({
  scene,
  sheets,
  label,
  load = loadPicture,
  overlay,
  fit = 'width',
}: Props) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const size = stageSize(scene);
  const density = Math.max(1, Math.round(window.devicePixelRatio));
  const scale = useDeviceScale(box, size, density, fit);
  const pictures = usePictures(sheets, load);
  const still = useReducedMotionConfig() === true;
  /** One of the stage's pixels on the page. */
  const pixel = scale / density;

  useEffect(() => {
    if (!canvas || !pictures) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const pen = context;
    const loaded = pictures;
    const stage = stageSize(scene);
    let frame = 0;
    let drawn = '';
    function tick(now: number): void {
      const draws = drawScene(scene, now / 1000, still);
      const picture = JSON.stringify(draws);
      if (picture !== drawn) {
        drawn = picture;
        paint(pen, draws, loaded, stage, scale);
      }
      frame = requestAnimationFrame(tick);
    }
    tick(performance.now());
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [canvas, scene, pictures, scale, still]);

  return (
    <div ref={setBox} className="scene" data-fit={fit}>
      <div
        className="scene-frame"
        style={
          {
            width: size.width * pixel,
            height: size.height * pixel,
            '--px': `${String(pixel)}px`,
          } as CSSProperties
        }
      >
        <canvas
          ref={setCanvas}
          role="img"
          aria-label={label}
          width={size.width * scale}
          height={size.height * scale}
        />
        {overlay}
      </div>
    </div>
  );
}

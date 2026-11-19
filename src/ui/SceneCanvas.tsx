import { useReducedMotionConfig } from 'motion/react';
import { useEffect, useState } from 'react';
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
  for (const { sheet, cut, x, y } of draws) {
    const picture = pictures.get(sheet);
    if (picture) {
      context.drawImage(picture, cut.x, cut.y, cut.width, cut.height, x, y, cut.width, cut.height);
    }
  }
}

/** The largest whole number the stage can be enlarged by to fit the box's width, at least 1. */
function useWholeScale(box: HTMLElement | null, width: number): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!box) return;
    const observer = new ResizeObserver(() => {
      setScale(Math.max(1, Math.floor(box.clientWidth / width)));
    });
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  }, [box, width]);
  return scale;
}

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
}

/**
 * A scene of the puppet theatre, drawn on a canvas: enlarged by a whole number to fill the
 * width, at the phone's own pixel density, and drawn again only when the picture changes, so
 * it costs the battery little. Its clock is the page's (`performance.now()`, in seconds), so a
 * screen can start an act at the moment it happens. With reduced motion on, nothing moves.
 */
export function SceneCanvas({ scene, sheets, label, load = loadPicture }: Props) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const size = stageSize(scene);
  const scale = useWholeScale(box, size.width);
  const pictures = usePictures(sheets, load);
  const still = useReducedMotionConfig() === true;
  const density = Math.max(1, Math.round(window.devicePixelRatio));

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
        paint(pen, draws, loaded, stage, scale * density);
      }
      frame = requestAnimationFrame(tick);
    }
    tick(performance.now());
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [canvas, scene, pictures, scale, density, still]);

  return (
    <div ref={setBox} className="scene">
      <canvas
        ref={setCanvas}
        role="img"
        aria-label={label}
        width={size.width * scale * density}
        height={size.height * scale * density}
        style={{ width: size.width * scale, height: size.height * scale }}
      />
    </div>
  );
}

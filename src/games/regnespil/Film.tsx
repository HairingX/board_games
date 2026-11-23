import { useEffect, useEffectEvent, useMemo, useState, type ReactNode } from 'react';
import { useMessages } from '../../i18n/I18n';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { useWakeLock } from '../../lib/wakeLock';
import { SceneCanvas, type LoadPicture } from '../../ui/SceneCanvas';
import { common } from '../../ui/text';
import { topFrames } from './art';
import { filmSheets, type Picture, type Shot } from './film';
import type { Hero } from './heroes';
import { sounds } from './sounds';
import { text } from './text';
import './regnespil.css';

interface Props {
  shots: readonly Shot[];
  /** The players' heroes, the first in front. */
  heroes: readonly Hero[];
  /** When the film has been seen, or skipped. */
  onDone: () => void;
  onBack: () => void;
  /** Shown at the right of the header: the sound's levels. */
  aside?: ReactNode;
  sound?: SoundEngine;
  /** The page's clock in seconds; the tests give their own. */
  now?: () => number;
  load?: LoadPicture;
}

const pageClock = () => performance.now() / 1000;

/**
 * How many times their size the pictures in a dialog box are drawn, where there is room, so a
 * child sees what they show on a phone; and how long, in seconds, before the film can be
 * skipped, so a child's first tap does not end it.
 */
const bubbleZoom = 2;
export const skipAfter = 3;

/**
 * How large a dialog box may draw its pictures: twice their size, or their own if three of them
 * side by side would not fit beside the portrait on a stage this wide, in its pixels.
 */
export function dialogZoom(pictures: readonly Picture[], width: number): number {
  const room = width - dialogRoom;
  const across = pictures.reduce(
    (sum, picture) => sum + ('arrow' in picture ? 0 : picture.cut.width),
    0,
  );
  return across * bubbleZoom <= room ? bubbleZoom : 1;
}

/** What a dialog box takes of the stage's width besides its pictures: the portrait, margins. */
const dialogRoom = 64;

/** The voices the films' characters babble in. */
const filmVoices = { hero: voices.hero, crone: voices.crone, dog: voices.dog } as const;

/**
 * A film of the story, played shot by shot on the puppet theatre's stage, with the
 * characters' sounds and voices and their picture bubbles, each at its moment. What each shot
 * shows is told in words to screen readers. After its first moments it can be skipped, from a
 * quiet button at the top, and the screen is kept on while it plays.
 */
export function Film({
  shots,
  heroes,
  onDone,
  onBack,
  aside,
  sound = defaultSound,
  now = pageClock,
  load,
}: Props) {
  const t = useMessages(text);
  const c = useMessages(common);
  /** Which shot plays, from when on the page's clock, and how far into it the bubbles are. */
  const [playing, setPlaying] = useState(() => ({ index: 0, at: now() }));
  const [into, setInto] = useState(0);
  /** Whether the film may be skipped yet: not in its first moments, so a tap does not end it. */
  const [skippable, setSkippable] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSkippable(true);
    }, skipAfter * 1000);
    return () => {
      clearTimeout(timer);
    };
  }, []);
  const shot = shots[playing.index] as Shot;
  useWakeLock(true);

  // The sounds are made ready as the film opens; its music is the game's to choose.
  useEffect(() => {
    void sound.prepareEffects(Object.values(sounds).map(({ url }) => url));
  }, [sound]);

  /** The next shot begins, or, after the last, the film ends. */
  const advance = useEffectEvent((index: number) => {
    if (index + 1 < shots.length) {
      setPlaying({ index: index + 1, at: now() });
      setInto(0);
    } else {
      onDone();
    }
  });

  /** Plays the shot's sounds and voices, each at its moment. */
  const cue = useEffectEvent((played: Shot) => {
    for (const one of played.cues) {
      if ('voice' in one) {
        sound.babble(filmVoices[one.voice], one.syllables, undefined, one.after);
      } else {
        const { url, gain } = sounds[one.sound];
        void sound.effect(url, gain, one.after);
      }
    }
  });

  // Each shot plays its sounds, shows its bubbles as they come and go, and gives way to the
  // next, or ends the film; once, however often the screen is drawn meanwhile.
  useEffect(() => {
    const played = shots[playing.index] as Shot;
    cue(played);
    const marks = played.bubbles.flatMap((bubble) => [bubble.at, bubble.at + bubble.lasts]);
    const timers = marks.map((mark) =>
      setTimeout(() => {
        setInto(mark);
      }, mark * 1000),
    );
    const next = setTimeout(() => {
      advance(playing.index);
    }, played.seconds * 1000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(next);
    };
  }, [playing, shots]);

  const scene = useMemo(() => shot.scene(playing.at, heroes), [shot, playing.at, heroes]);
  const px = (pixels: number) => `calc(var(--px) * ${String(pixels)})`;
  const showing = shot.bubbles.filter(
    (bubble) => bubble.at <= into && into < bubble.at + bubble.lasts,
  );
  const width = scene.columns * 16;

  /** A bubble's pictures, each drawn `zoom` times larger, an arrow plainly. */
  const drawn = (pictures: readonly Picture[], zoom: number) =>
    pictures.map((picture, index) => {
      if ('arrow' in picture) {
        return <span key={index} className="rs-bubble-arrow" />;
      }
      const zoomed = (pixels: number) => px(pixels * zoom);
      return (
        <span
          key={index}
          className="rs-bubble-picture"
          style={{
            width: zoomed(picture.cut.width),
            height: zoomed(picture.cut.height),
            backgroundImage: `url("${picture.url}")`,
            backgroundPosition: `${zoomed(-picture.cut.x)} ${zoomed(-picture.cut.y)}`,
            backgroundSize: `${zoomed(picture.image.width)} ${zoomed(picture.image.height)}`,
          }}
        />
      );
    });

  // What is said in a dialog box at the foot of the screen, with the portrait of who says it,
  // the pictures as large as the box has room for.
  const front = showing.map((bubble) => (
    <div key={bubble.at} className="rs-dialog" aria-hidden="true">
      <img src={bubble.speaks} alt="" className="rs-dialog-face" />
      <p className="rs-dialog-pictures">
        {drawn(bubble.pictures, dialogZoom(bubble.pictures, width))}
      </p>
    </div>
  ));

  return (
    <section className="rs-fight rs-film">
      <header className="rs-topbar" style={{ borderImageSource: `url("${topFrames.forest}")` }}>
        <button type="button" className="game-header-button" aria-label={c.back} onClick={onBack}>
          <span aria-hidden="true">‹</span>
        </button>
        {skippable ? (
          <button type="button" className="rs-skip" onClick={onDone}>
            {t.film.skip}
            <span aria-hidden="true"> ⏭</span>
          </button>
        ) : (
          <span />
        )}
        {aside}
      </header>
      <div
        className="rs-stage"
        style={{ aspectRatio: `${String(scene.columns)} / ${String(scene.rows)}` }}
      >
        <SceneCanvas
          scene={scene}
          sheets={filmSheets}
          label={t.film.label}
          front={front}
          fit="box"
          {...(load ? { load } : {})}
        />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {t.film.shots[shot.tells]}
      </p>
    </section>
  );
}

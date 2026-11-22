import {
  Fragment,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import littleChest from '../../../assets/ninja-adventure/Items/Treasure/LittleTreasureChest.png';
import { useMessages } from '../../i18n/I18n';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { SceneCanvas, type LoadPicture } from '../../ui/SceneCanvas';
import { common } from '../../ui/text';
import { topFrames } from './art';
import type { Hero } from './heroes';
import { ahead, copperChapter, stepsLeft, type Chapter, type Journey, type Step } from './journey';
import { heroesAt, isTough, mapScene, mapSheets, markOver, walkSeconds, type Walk } from './map';
import { monsters } from './monsters';
import { sounds } from './sounds';
import { text } from './text';
import './regnespil.css';

interface Props {
  journey: Journey;
  /** The players' heroes, the first leading the way on the map. */
  heroes: readonly Hero[];
  /** Goes on to a step ahead, once the heroes have walked there. */
  onGo: (step: string) => void;
  onBack: () => void;
  aside?: ReactNode;
  chapter?: Chapter;
  sound?: SoundEngine;
  /** The page's clock in seconds; the tests give their own. */
  now?: () => number;
  load?: LoadPicture;
}

const pageClock = () => performance.now() / 1000;

/**
 * The journey's map, as the owner asked, so it is plain the adventure is under way, where the
 * heroes are going and how far it is: the forest from the road to the hollow tree, the roads
 * between the steps, those walked in light sand, a flag where a monster was beaten, and a sign
 * at the fork pointing down the detour, with a chest over it. The heroes are drawn large, so
 * they are seen at once; the roads they can take now are dotted in white, and what waits at
 * their ends hops under a marker pointing down at it, as the owner asked; tapped, the heroes
 * walk there, and its fight or chest begins. Over the map, a pip for each step done and each
 * left, the last the boss's portrait.
 */
export function JourneyMap({
  journey,
  heroes,
  onGo,
  onBack,
  aside,
  chapter = copperChapter,
  sound = defaultSound,
  now = pageClock,
  load,
}: Props) {
  const t = useMessages(text);
  const c = useMessages(common);
  const [walk, setWalk] = useState<Walk>();
  const scene = useMemo(
    () => mapScene(journey, heroes, walk, chapter),
    [journey, heroes, walk, chapter],
  );
  const px = (pixels: number) => `calc(var(--px) * ${String(pixels)})`;

  const arrived = useEffectEvent((to: string) => {
    onGo(to);
  });
  useEffect(() => {
    if (!walk) return;
    const timer = setTimeout(() => {
      arrived(walk.to);
    }, walk.lasts * 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [walk]);

  const left = stepsLeft(journey, chapter);
  /** The chapter's last step, its boss. */
  const last = Object.values(chapter.steps).find(
    (step): step is Extract<Step, { foe: unknown }> =>
      step.next.length === 0 && step.kind !== 'chest',
  ) as Extract<Step, { foe: unknown }>;
  const here = chapter.steps[journey.at] as Step;

  /** What going to a step means, said to whoever cannot see it. */
  const goTo = (step: Step): string => {
    if (step.kind === 'chest') return t.map.chest;
    const called = t.foes[step.foe];
    if (step.kind === 'boss') return t.map.boss(called.the);
    return isTough(step) ? t.map.tough(called.strong) : t.map.fight(called.the);
  };

  /** The heroes setting out for a step ahead, with a sound under the finger. */
  const go = (id: string): void => {
    void sound.effect(sounds.choose.url, sounds.choose.gain);
    const step = chapter.steps[id] as Step;
    setWalk({ to: id, at: now(), lasts: walkSeconds(heroesAt(here), heroesAt(step)) });
  };

  const overlay = (
    <div className="rs-hud">
      {chapter.signs.map((sign) => {
        const place = { left: px(sign.x + 8), top: px(sign.y) };
        const shows = <img src={littleChest} alt="" className="rs-sign-chest" />;
        // While its road lies ahead, the sign leads the heroes down it, as the step does.
        return ahead(journey, chapter).includes(sign.to) ? (
          <button
            key={sign.to}
            type="button"
            className="rs-bubble rs-sign"
            aria-label={`${t.map.sign}. ${goTo(chapter.steps[sign.to] as Step)}`}
            disabled={walk !== undefined}
            style={place}
            onClick={() => {
              go(sign.to);
            }}
          >
            {shows}
          </button>
        ) : (
          <p
            key={sign.to}
            className="rs-bubble rs-sign"
            role="img"
            aria-label={t.map.sign}
            style={place}
          >
            {shows}
          </p>
        );
      })}
      {ahead(journey, chapter).map((id) => {
        const step = chapter.steps[id] as Step;
        const mark = markOver(step);
        // The button covers what stands at the step, from the marker's tip to its feet.
        const middle = (mark.y + step.y + 16) / 2;
        return (
          <Fragment key={id}>
            {walk === undefined && (
              <span
                className="rs-step-mark"
                aria-hidden="true"
                style={{ left: px(mark.x), top: px(mark.y) }}
              />
            )}
            <button
              type="button"
              className="rs-step"
              aria-label={goTo(step)}
              disabled={walk !== undefined}
              style={
                {
                  left: px(mark.x),
                  top: px(middle),
                  '--reach': px(step.y + 16 - mark.y),
                } as CSSProperties
              }
              onClick={() => {
                go(id);
              }}
            />
          </Fragment>
        );
      })}
    </div>
  );

  return (
    <section className="rs-fight rs-map">
      <header className="rs-topbar" style={{ borderImageSource: `url("${topFrames.forest}")` }}>
        <button type="button" className="game-header-button" aria-label={c.back} onClick={onBack}>
          <span aria-hidden="true">‹</span>
        </button>
        <p className="rs-progress" role="img" aria-label={t.map.left(left)}>
          {journey.done.map((id) => (
            <span key={id} className="rs-progress-pip" data-done="true" />
          ))}
          {Array.from({ length: left - 1 }, (_, index) => (
            <span key={index} className="rs-progress-pip" />
          ))}
          {/* The last step, the chapter's boss, by its portrait. */}
          <img src={monsters[last.foe].face.calm} alt="" className="rs-progress-boss" />
        </p>
        {aside}
      </header>
      <div
        className="rs-stage rs-map-stage"
        style={{ aspectRatio: `${String(scene.columns)} / ${String(scene.rows)}` }}
      >
        <SceneCanvas
          scene={scene}
          sheets={mapSheets}
          label={t.map.label}
          overlay={overlay}
          fit="box"
          {...(load ? { load } : {})}
        />
      </div>
    </section>
  );
}

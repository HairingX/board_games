import { useEffect, useEffectEvent, useMemo, useState, type ReactNode } from 'react';
import arrow from '../../../assets/ninja-adventure/Ui/Arrow.png';
import littleChest from '../../../assets/ninja-adventure/Items/Treasure/LittleTreasureChest.png';
import { useMessages } from '../../i18n/I18n';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { SceneCanvas, type LoadPicture } from '../../ui/SceneCanvas';
import { common } from '../../ui/text';
import { topFrames } from './art';
import type { Hero } from './heroes';
import { ahead, copperChapter, stepsLeft, type Chapter, type Journey, type Step } from './journey';
import { heroesAt, isTough, mapScene, mapSheets, roads, walkSeconds, type Walk } from './map';
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
 * between the steps, those walked drawn whole, a flag where a monster was beaten, and a sign
 * at the fork showing a chest down the detour. The steps the heroes can go to bounce under an
 * arrow; tapped, the heroes walk there, and its fight or chest begins. Over the map, how many
 * steps are left to the hollow tree.
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
  const here = chapter.steps[journey.at] as Step;

  /** What going to a step means, said to whoever cannot see it. */
  const goTo = (step: Step): string => {
    if (step.kind === 'chest') return t.map.chest;
    const called = t.foes[step.foe];
    if (step.kind === 'boss') return t.map.boss(called.the);
    return isTough(step) ? t.map.tough(called.strong) : t.map.fight(called.the);
  };

  const overlay = (
    <div className="rs-hud">
      <svg
        className="rs-roads"
        viewBox={`0 0 ${String(scene.columns * 16)} ${String(scene.rows * 16)}`}
        aria-hidden="true"
      >
        {roads(journey, chapter).map(({ from, to, walked }) => (
          <line
            key={`${String(from.x)},${String(from.y)}>${String(to.x)},${String(to.y)}`}
            x1={from.x + 8}
            y1={from.y + 8}
            x2={to.x + 8}
            y2={to.y + 8}
            data-walked={walked}
          />
        ))}
      </svg>
      {chapter.signs.map((sign) => (
        <p
          key={sign.to}
          className="rs-bubble rs-sign"
          role="img"
          aria-label={t.map.sign}
          style={{ left: px(sign.x + 8), top: px(sign.y) }}
        >
          <img src={littleChest} alt="" className="rs-sign-chest" />
        </p>
      ))}
      {ahead(journey, chapter).map((id) => {
        const step = chapter.steps[id] as Step;
        return (
          <button
            key={id}
            type="button"
            className="rs-step"
            aria-label={goTo(step)}
            disabled={walk !== undefined}
            style={{ left: px(step.x + 8), top: px(step.y + 8) }}
            onClick={() => {
              void sound.effect(sounds.choose.url, sounds.choose.gain);
              setWalk({ to: id, at: now(), lasts: walkSeconds(heroesAt(here), heroesAt(step)) });
            }}
          >
            {walk === undefined && <img src={arrow} alt="" className="rs-step-arrow" />}
          </button>
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
          {Array.from({ length: left }, (_, index) => (
            <span key={index} className="rs-progress-pip" data-last={index === left - 1} />
          ))}
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

import { useState, type ReactNode } from 'react';
import { useMessages } from '../../i18n/I18n';
import type { SoundEngine } from '../../lib/sound/engine';
import type { LoadPicture } from '../../ui/SceneCanvas';
import { common } from '../../ui/text';
import { topFrames } from './art';
import { epilogue } from './film';
import { Film } from './Film';
import type { Hero } from './heroes';
import { copperDog } from './monsters';
import { text } from './text';
import { treasurePictures, type Treasure } from './treasures';
import './regnespil.css';

interface Props {
  heroes: readonly Hero[];
  /** The treasures found on the journey. */
  treasures: readonly Treasure[];
  /** Begins the chapter again, from its film. */
  onAgain: () => void;
  onBack: () => void;
  aside?: ReactNode;
  sound?: SoundEngine;
  now?: () => number;
  load?: LoadPicture;
}

/**
 * The chapter's end: its film, the heroes jumping down into the hollow tree, and then what was
 * done: the chapter cleared, the treasures found on the way, and the chapter to play again.
 */
export function JourneyEnd({ heroes, treasures, onAgain, onBack, aside, sound, now, load }: Props) {
  const t = useMessages(text);
  const c = useMessages(common);
  const [filmed, setFilmed] = useState(false);
  if (!filmed) {
    return (
      <Film
        shots={epilogue}
        heroes={heroes}
        onDone={() => {
          setFilmed(true);
        }}
        onBack={onBack}
        aside={aside}
        {...(sound ? { sound } : {})}
        {...(now ? { now } : {})}
        {...(load ? { load } : {})}
      />
    );
  }
  return (
    <section className="rs-fight rs-end">
      <header className="rs-topbar" style={{ borderImageSource: `url("${topFrames.forest}")` }}>
        <button type="button" className="game-header-button" aria-label={c.back} onClick={onBack}>
          <span aria-hidden="true">‹</span>
        </button>
        <span />
        {aside}
      </header>
      <div className="rs-panel rs-end-panel">
        <img src={copperDog.face.calm} alt="" className="rs-end-friend" />
        <h2 className="rs-end-title">{t.end.title}</h2>
        <p>{t.end.text}</p>
        {treasures.length > 0 && (
          <>
            <h3 className="rs-end-found">{t.end.found}</h3>
            <ul className="rs-end-treasures">
              {treasures.map((treasure) => (
                <li key={treasure}>
                  <img src={treasurePictures[treasure]} alt="" />
                  {t.treasures[treasure].name}
                </li>
              ))}
            </ul>
          </>
        )}
        <button type="button" className="rs-button" onClick={onAgain}>
          {t.end.again}
        </button>
      </div>
    </section>
  );
}

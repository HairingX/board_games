import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import bigChest from '../../../assets/ninja-adventure/Items/Treasure/BigTreasureChest.png';
import { formatNumber } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { common } from '../../ui/text';
import { hud, swordPictures, topFrames } from './art';
import { clearingSheets } from './clearing';
import { sounds } from './sounds';
import { text } from './text';
import { treasurePictures, type Treasure } from './treasures';
import './regnespil.css';

interface Props {
  /** The treasures the chest holds, one to be chosen. */
  offers: readonly Treasure[];
  onChoose: (treasure: Treasure) => void;
  onBack: () => void;
  aside?: ReactNode;
  sound?: SoundEngine;
}

/** How long the treasure chosen is shown, before the journey goes on, in seconds. */
export const chosenFor = 1.4;

/**
 * A chest, as the owner's design has it: tapped, it springs open with a jingle and three
 * treasures rise from it, each with its picture and, as pictures, what it does in a fight; one
 * is chosen, kept for the rest of the journey, and the journey goes on.
 */
export function Chest({ offers, onChoose, onBack, aside, sound = defaultSound }: Props) {
  const t = useMessages(text);
  const c = useMessages(common);
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Treasure>();

  useEffect(() => {
    void sound.prepareEffects([sounds.chest.url, sounds.coin.url]);
  }, [sound]);

  const done = useEffectEvent((treasure: Treasure) => {
    onChoose(treasure);
  });
  useEffect(() => {
    if (chosen === undefined) return;
    const timer = setTimeout(() => {
      done(chosen);
    }, chosenFor * 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [chosen]);

  /** What each treasure does, as pictures. */
  const shows: Readonly<Record<Treasure, ReactNode>> = {
    heartJar: (
      <>
        <img src={hud.heartIcon} alt="" />+{formatNumber(locale, 1)}
      </>
    ),
    powerRing: (
      <>
        <img src={swordPictures.jern} alt="" />
        <img src={swordPictures.jern} alt="" />
        <span>⚡</span>
      </>
    ),
    goldPouch: (
      <>
        <span
          className="rs-purse-coin"
          style={{ backgroundImage: `url("${clearingSheets.coin}")` }}
        />
        ×{formatNumber(locale, 2)}
      </>
    ),
    guardCharm: (
      <>
        <img src={hud.guard} alt="" />
        <img src={hud.heartIcon} alt="" />
      </>
    ),
  };

  return (
    <section className="rs-fight rs-chest">
      <header className="rs-topbar" style={{ borderImageSource: `url("${topFrames.forest}")` }}>
        <button type="button" className="game-header-button" aria-label={c.back} onClick={onBack}>
          <span aria-hidden="true">‹</span>
        </button>
        <span />
        {aside}
      </header>
      <div className="rs-chest-stage">
        <button
          type="button"
          className="rs-chest-box"
          aria-label={t.chest.open}
          data-open={open}
          disabled={open}
          style={{ backgroundImage: `url("${bigChest}")` }}
          onClick={() => {
            setOpen(true);
            void sound.effect(sounds.chest.url, sounds.chest.gain);
          }}
        />
      </div>
      <div className="rs-panel">
        {open && (
          <>
            <h2 className="rs-chest-title">{t.chest.choose}</h2>
            <ul className="rs-treasures">
              {offers.map((treasure, index) => (
                <li key={treasure} style={{ animationDelay: `${String(index * 0.15)}s` }}>
                  <button
                    type="button"
                    className="rs-treasure"
                    data-chosen={chosen === treasure}
                    data-other={chosen !== undefined && chosen !== treasure}
                    disabled={chosen !== undefined}
                    onClick={() => {
                      setChosen(treasure);
                      void sound.effect(sounds.coin.url, sounds.coin.gain);
                    }}
                  >
                    <img src={treasurePictures[treasure]} alt="" className="rs-treasure-icon" />
                    <span className="rs-treasure-shows" aria-hidden="true">
                      {shows[treasure]}
                    </span>
                    <span className="rs-treasure-name">{t.treasures[treasure].name}</span>
                    <span className="rs-treasure-does">{t.treasures[treasure].does}</span>
                  </button>
                </li>
              ))}
            </ul>
            {chosen && (
              <p className="visually-hidden" role="status">
                {t.chest.took(t.treasures[chosen].name)}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

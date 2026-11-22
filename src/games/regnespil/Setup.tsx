import { useState, type ReactNode } from 'react';
import { Avatar } from '../../family/Avatar';
import type { Profile } from '../../family/family';
import { formatNumber } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import { common } from '../../ui/text';
import { GameHeader } from '../../ui/GameHeader';
import { clearingSheets } from './clearing';
import { HeroPicker } from './HeroPicker';
import { LevelStepper } from './LevelStepper';
import type { Foe } from './monsters';
import type { PlayerSettings } from './players';
import { SwordPicker } from './SwordPicker';
import { text } from './text';
import './regnespil.css';

interface Props {
  players: readonly Profile[];
  /** Each player's level and sword, in the players' order. */
  settings: readonly PlayerSettings[];
  onChange: (index: number, settings: PlayerSettings) => void;
  /** Whether an adventure is under way, to go on with. */
  adventure: boolean;
  /** Goes on with the adventure, or begins it. */
  onAdventure: () => void;
  /** Begins the adventure again, from its film. */
  onRestart: () => void;
  /** Begins a quick fight against the slime, or, while the game is tried, the giant slime. */
  onStart: (foe: Foe) => void;
  /** Opens the sounds to compare, while the game's sounds are being chosen. */
  onListen: () => void;
  /** Shown at the right of the header: the sound's levels. */
  aside: ReactNode;
}

/**
 * Before the adventure: each player's own level for the sums and own sword for the fight,
 * suggested from their age the first time and kept on their profile after.
 */
export function Setup({
  players,
  settings,
  onChange,
  adventure,
  onAdventure,
  onRestart,
  onStart,
  onListen,
  aside,
}: Props) {
  const t = useMessages(text);
  const c = useMessages(common);
  const locale = useLocale();
  const [confirmRestart, setConfirmRestart] = useState(false);
  return (
    <section className="rs-setup">
      <GameHeader title={t.setupTitle} aside={aside} />
      <p className="family-intro">{t.setupIntro}</p>
      <ul className="rs-players">
        {players.map((player, index) => {
          const own = settings[index] as PlayerSettings;
          return (
            <li key={player.id} className="rs-player">
              <div className="rs-player-head">
                <h2 className="rs-player-name">
                  <Avatar profile={player} size="small" />
                  {player.name}
                </h2>
                <span
                  className="rs-player-purse"
                  role="img"
                  aria-label={t.purse(player.name, own.coins)}
                >
                  <span
                    className="rs-purse-coin"
                    style={{ backgroundImage: `url("${clearingSheets.coin}")` }}
                  />
                  <span aria-hidden="true">{formatNumber(locale, own.coins)}</span>
                </span>
              </div>
              <LevelStepper
                name={player.name}
                level={own.level}
                onChange={(level) => {
                  onChange(index, { ...own, level });
                }}
              />
              <SwordPicker
                name={player.name}
                sword={own.sword}
                onChange={(sword) => {
                  onChange(index, { ...own, sword });
                }}
              />
              <HeroPicker
                name={player.name}
                hero={own.hero}
                onChange={(hero) => {
                  onChange(index, { ...own, hero });
                }}
              />
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn btn-primary btn-block" onClick={onAdventure}>
        {adventure ? t.adventure.resume : t.adventure.start}
      </button>
      {adventure &&
        (confirmRestart ? (
          <div className="rs-confirm" role="alertdialog" aria-label={t.adventure.restart}>
            <p>{t.adventure.restartQuestion}</p>
            <div className="rs-confirm-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setConfirmRestart(false);
                }}
              >
                {c.cancel}
              </button>
              <button type="button" className="btn btn-primary" onClick={onRestart}>
                {t.adventure.yesRestart}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => {
              setConfirmRestart(true);
            }}
          >
            {t.adventure.restart}
          </button>
        ))}
      <details className="rs-trials">
        <summary>{t.adventure.trials}</summary>
        <button
          type="button"
          className="btn btn-quiet btn-block"
          onClick={() => {
            onStart('slime');
          }}
        >
          {t.adventure.quickFight}
        </button>
        <button
          type="button"
          className="btn btn-quiet btn-block"
          onClick={() => {
            onStart('giantSlime');
          }}
        >
          {t.boss}
        </button>
        <button type="button" className="btn btn-quiet btn-block rs-listen" onClick={onListen}>
          {t.listen.title}
        </button>
      </details>
    </section>
  );
}

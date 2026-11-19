import { Avatar } from '../../family/Avatar';
import type { Profile } from '../../family/family';
import { useMessages } from '../../i18n/I18n';
import { GameHeader } from '../../ui/GameHeader';
import { LevelStepper } from './LevelStepper';
import type { PlayerSettings } from './players';
import { SwordPicker } from './SwordPicker';
import { text } from './text';
import './regnespil.css';

interface Props {
  players: readonly Profile[];
  /** Each player's level and sword, in the players' order. */
  settings: readonly PlayerSettings[];
  onChange: (index: number, settings: PlayerSettings) => void;
  onStart: () => void;
}

/**
 * Before the adventure: each player's own level for the sums and own sword for the fight,
 * suggested from their age the first time and kept on their profile after.
 */
export function Setup({ players, settings, onChange, onStart }: Props) {
  const t = useMessages(text);
  return (
    <section className="rs-setup">
      <GameHeader title={t.setupTitle} />
      <p className="family-intro">{t.setupIntro}</p>
      <ul className="rs-players">
        {players.map((player, index) => {
          const own = settings[index] as PlayerSettings;
          return (
            <li key={player.id} className="rs-player">
              <h2 className="rs-player-name">
                <Avatar profile={player} size="small" />
                {player.name}
              </h2>
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
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn btn-primary btn-block" onClick={onStart}>
        {t.toFight}
      </button>
    </section>
  );
}

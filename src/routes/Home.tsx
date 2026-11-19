import type { CSSProperties } from 'react';
import { appMeta } from '../appMeta';
import { Avatar } from '../family/Avatar';
import { formatLanguages } from '../i18n/format';
import { useLocale, useMessages } from '../i18n/I18n';
import type { Profile } from '../family/family';
import { gameTheme, type GameInfo } from '../lib/games';
import { gameHref } from '../lib/router';
import { GameName } from '../ui/GameName';
import { appText } from './text';
import './Home.css';

interface Props {
  games: readonly GameInfo[];
  /** Who is playing. */
  player: Profile;
  /** Goes back to "Hvem spiller?". */
  onSwitch: () => void;
  /** Opens the settings; offered to grown-ups only. */
  onSettings: () => void;
}

/**
 * The games the player may play, who is playing, and a note when a new version of the app is
 * ready. Grown-ups open the settings from here; children never see them.
 */
export function Home({ games, player, onSwitch, onSettings }: Props) {
  const t = useMessages(appText);
  return (
    <>
      <div className="player">
        <button
          type="button"
          className="player-switch"
          aria-label={t.switchFrom(player.name)}
          onClick={onSwitch}
        >
          <Avatar profile={player} size="small" />
          <span className="player-name">{player.name}</span>
        </button>
        {player.role === 'voksen' && (
          <button
            type="button"
            className="player-settings"
            aria-label={t.settings}
            onClick={onSettings}
          >
            <Gear />
          </button>
        )}
      </div>
      <header className="home-header">
        <h1 className="home-title">{appMeta.name}</h1>
        <p>{t.tagline}</p>
      </header>

      {games.length === 0 ? (
        <p className="home-empty">{t.noGames}</p>
      ) : (
        <ul className="home-games">
          {games.map((game, index) => (
            <li
              key={game.id}
              style={{ ...gameTheme(game), '--delay': `${String(index * 60)}ms` } as CSSProperties}
            >
              {game.Screen ? (
                <a className={game.beta ? 'tile tile-flagged' : 'tile'} href={gameHref(game.id)}>
                  <TileContent game={game} />
                  {game.beta && <span className="tile-pill">{t.inDevelopment}</span>}
                </a>
              ) : (
                <div className="tile tile-soon tile-flagged" aria-disabled="true">
                  <TileContent game={game} />
                  <span className="tile-pill">{t.soon}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function TileContent({ game }: { game: GameInfo }) {
  const locale = useLocale();
  const { description } = useMessages(game.about);
  const { writtenIn } = useMessages(appText);
  return (
    <>
      <span className="tile-icon" aria-hidden="true">
        {game.icon}
      </span>
      <span className="tile-text">
        <strong>
          <GameName about={game.about} />
        </strong>
        <span>{description}</span>
        {!game.languages.includes(locale) && (
          <span className="tile-language">
            {writtenIn(formatLanguages(locale, game.languages))}
          </span>
        )}
      </span>
    </>
  );
}

/** The settings' sign: a cog. */
function Gear() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm8-3.2c0-.5 0-1-.1-1.4l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.4-1.4L14.7 2h-4l-.4 2.6a7.6 7.6 0 0 0-2.4 1.4l-2.4-1-2 3.4 2 1.6a7.7 7.7 0 0 0 0 2.8l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.4 1.4l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 2.4-1.4l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

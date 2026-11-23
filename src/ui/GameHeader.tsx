import type { ReactNode } from 'react';
import { Avatar } from '../family/Avatar';
import { formatList } from '../i18n/format';
import { useLocale, useMessages } from '../i18n/I18n';
import { useGameFrame } from './GameFrame';
import { common } from './text';
import './GameHeader.css';

interface Props {
  title: ReactNode;
  /**
   * Called by the back button, on a screen further into a game or the settings. Without it the
   * screen is a game's first, and the button closes the game, going to the home screen.
   */
  onBack?: () => void;
  /** Shown at the right, such as the progress. */
  aside?: ReactNode;
}

/**
 * The bar at the top of a screen. On a game's screens it shows the game's icon beside the title,
 * and the players' pictures, small and overlapping, so it is always clear which game is open
 * and whose it is, even when the phone is picked up again later. On a game's first screen the
 * button at the left closes the game, as leaving it is what it does, and the players' pictures
 * open "Hvem er med?", so others can play instead.
 */
export function GameHeader({ title, onBack, aside }: Props) {
  const t = useMessages(common);
  const locale = useLocale();
  const frame = useGameFrame();
  const players = frame?.players ?? [];
  const named = t.players(
    formatList(
      locale,
      players.map((player) => player.name),
    ),
  );
  const pictures = players.map((player) => <Avatar key={player.id} profile={player} size="tiny" />);
  const change = onBack ? undefined : frame?.changePlayers;
  return (
    <header className="game-header">
      {onBack ? (
        <button type="button" className="game-header-back" onClick={onBack} aria-label={t.back}>
          <BackArrow />
        </button>
      ) : frame ? (
        <a className="game-header-back" href="#/" aria-label={t.closeGame}>
          <Cross />
        </a>
      ) : (
        <a className="game-header-back" href="#/" aria-label={t.home}>
          <BackArrow />
        </a>
      )}
      <div className="game-header-middle">
        <h1 className="game-header-title">
          {frame && (
            <span className="game-header-icon" aria-hidden="true">
              {frame.icon}
            </span>
          )}
          {title}
        </h1>
        {players.length > 0 &&
          (change ? (
            <button
              type="button"
              className="game-header-players game-header-change"
              aria-label={`${t.changePlayers}. ${named}`}
              onClick={change}
            >
              <span className="game-header-faces">{pictures}</span>
              <span aria-hidden="true">{t.change}</span>
            </button>
          ) : (
            <span className="game-header-players" role="img" aria-label={named}>
              <span className="game-header-faces">{pictures}</span>
            </span>
          ))}
      </div>
      <span className="game-header-aside">{aside}</span>
    </header>
  );
}

function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

import type { ReactNode } from 'react';
import { useMessages } from '../i18n/I18n';
import { useGameIcon } from './GameIcon';
import { common } from './text';
import './GameHeader.css';

interface Props {
  title: string;
  /** Called by the back button; without it, the back button leads to the home screen. */
  onBack?: () => void;
  /** Shown at the right, such as the progress. */
  aside?: ReactNode;
}

/**
 * The bar at the top of a screen. On a game's screens it shows the game's icon beside the title,
 * so it is always clear which game is open, even when the phone is picked up again later.
 */
export function GameHeader({ title, onBack, aside }: Props) {
  const t = useMessages(common);
  const icon = useGameIcon();
  return (
    <header className="game-header">
      {onBack ? (
        <button type="button" className="game-header-back" onClick={onBack} aria-label={t.back}>
          <BackArrow />
        </button>
      ) : (
        <a className="game-header-back" href="#/" aria-label={t.home}>
          <BackArrow />
        </a>
      )}
      <h1 className="game-header-title">
        {icon !== null && (
          <span className="game-header-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {title}
      </h1>
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

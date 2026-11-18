import type { CSSProperties } from 'react';
import { appMeta } from '../appMeta';
import { Avatar } from '../family/Avatar';
import { familyText } from '../family/text';
import { formatLanguages } from '../i18n/format';
import { useLocale, useMessages } from '../i18n/I18n';
import type { Locale } from '../i18n/locales';
import type { Profile } from '../family/family';
import { gameTheme, type GameInfo } from '../lib/games';
import { gameHref } from '../lib/router';
import { common } from '../ui/text';
import { LanguageChoice } from './LanguageChoice';
import { SavedGames } from './SavedGames';
import { appText } from './text';
import './Home.css';

interface Props {
  games: readonly GameInfo[];
  /** Who is playing. */
  player: Profile;
  /** Goes back to "Hvem spiller?". */
  onSwitch: () => void;
  /** Opens the family's profiles; offered to grown-ups only. */
  onManageFamily: () => void;
  /** Changes the player's language; offered to grown-ups, whose children's is set for them. */
  onChangeLanguage: (locale: Locale) => void;
  /** Loads the new version that is waiting; given only while one is. */
  onUpdate?: () => void;
}

/**
 * The games the player may play, who is playing, and a note when a new version of the app is
 * ready. Children do not see how the games are saved and backed up.
 */
export function Home({
  games,
  player,
  onSwitch,
  onManageFamily,
  onChangeLanguage,
  onUpdate,
}: Props) {
  const t = useMessages(appText);
  const { hello } = useMessages(common);
  const { family } = useMessages(familyText);
  return (
    <>
      <div className="player">
        <Avatar profile={player} size="small" />
        <span className="player-name">{hello(player.name)}</span>
        <button type="button" className="btn btn-quiet" onClick={onSwitch}>
          {t.switchPlayer}
        </button>
      </div>
      {player.role === 'voksen' && (
        <button type="button" className="btn btn-ghost player-family" onClick={onManageFamily}>
          {family}
        </button>
      )}
      {onUpdate && (
        <div className="update" role="status">
          <span>{t.newVersion(appMeta.name)}</span>
          <button type="button" className="btn btn-primary" onClick={onUpdate}>
            {t.update}
          </button>
        </div>
      )}
      <header className="home-header">
        <span className="badge">
          <span className="badge-dot" aria-hidden="true" />
          {t.offline}
        </span>
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
                <a className="tile" href={gameHref(game.id)}>
                  <TileContent game={game} />
                </a>
              ) : (
                <div className="tile tile-soon" aria-disabled="true">
                  <TileContent game={game} />
                  <span className="tile-pill">{t.soon}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {player.role === 'voksen' && (
        <>
          <LanguageChoice onChange={onChangeLanguage} />
          <SavedGames />
        </>
      )}
    </>
  );
}

function TileContent({ game }: { game: GameInfo }) {
  const locale = useLocale();
  const { title, description } = useMessages(game.about);
  const { writtenIn } = useMessages(appText);
  return (
    <>
      <span className="tile-icon" aria-hidden="true">
        {game.icon}
      </span>
      <span className="tile-text">
        <strong>{title}</strong>
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

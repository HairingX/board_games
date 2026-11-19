import { appMeta } from '../appMeta';
import { WhoIsPlaying } from '../family/WhoIsPlaying';
import { useMessages } from '../i18n/I18n';
import { gameTheme, type GameInfo } from '../lib/games';
import { LanguageSelect } from '../ui/LanguageSelect';
import { appText } from './text';
import { UpdateBanner } from './UpdateBanner';
import './Home.css';
import './Start.css';

interface Props {
  /** Every game, shown as a fan of their cards' backs. */
  games: readonly GameInfo[];
  /** Loads the new version that is waiting; given only while one is. */
  onUpdate?: () => void;
}

/**
 * What the app opens on when no one is playing: its name, what it is, the games' cards, and
 * "Hvem spiller?". A new version can be loaded here, before anyone is chosen.
 */
export function Start({ games, onUpdate }: Props) {
  const t = useMessages(appText);
  return (
    <WhoIsPlaying
      header={
        <>
          <div className="start-top">
            <LanguageSelect compact />
          </div>
          {onUpdate && <UpdateBanner onUpdate={onUpdate} />}
          <header className="start-hero">
            <div className="start-fan" aria-hidden="true">
              {games.map((game) => (
                <span key={game.id} className="start-card" style={gameTheme(game)}>
                  <span className="start-card-icon">{game.icon}</span>
                </span>
              ))}
            </div>
            <h1 className="home-title">{appMeta.name}</h1>
            <p className="start-tagline">{t.tagline}</p>
          </header>
        </>
      }
    />
  );
}

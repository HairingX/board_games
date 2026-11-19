import { appMeta } from '../appMeta';
import { Avatar } from '../family/Avatar';
import { useFamily } from '../family/FamilyContext';
import { WhoIsPlaying } from '../family/WhoIsPlaying';
import { useMessages } from '../i18n/I18n';
import { gameTheme, type GameInfo } from '../lib/games';
import { LanguageSelect } from '../ui/LanguageSelect';
import { appText } from './text';
import { UpdateToast } from './UpdateToast';
import './Home.css';
import './Start.css';

interface Props {
  /** Every game, shown as a fan of their cards' backs. */
  games: readonly GameInfo[];
  /** Loads the new version that is waiting; given only while one is. */
  onUpdate?: () => void;
}

/**
 * Where the app opens, as a game's title screen: its name, what it is, the games' cards, and
 * whoever played last, who continues where they were with one tap or switches player. With no
 * one to continue, "Hvem spiller?" is asked here. A new version can be loaded here too.
 */
export function Start({ games, onUpdate }: Props) {
  const t = useMessages(appText);
  const { current, leave, place } = useFamily();

  const header = (
    <>
      <div className="start-top">
        <LanguageSelect compact />
      </div>
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
  );

  const toast = onUpdate && <UpdateToast onUpdate={onUpdate} />;

  if (!current) {
    return (
      <>
        <WhoIsPlaying header={header} />
        {toast}
      </>
    );
  }

  return (
    <>
      <section className="family">
        {header}
        <div className="start-continue">
          <Avatar profile={current} />
          <p className="start-hello">{current.name}</p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              window.location.replace(place);
            }}
          >
            {t.continue}
          </button>
          <button type="button" className="btn btn-quiet btn-block" onClick={leave}>
            {t.switchPlayer}
          </button>
        </div>
      </section>
      {toast}
    </>
  );
}

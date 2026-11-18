import type { CSSProperties } from 'react';
import { appMeta } from '../appMeta';
import { gameTheme, type GameInfo } from '../lib/games';
import { gameHref } from '../lib/router';
import { SavedGames } from './SavedGames';
import './Home.css';

interface Props {
  games: readonly GameInfo[];
  /** Loads the new version that is waiting; given only while one is. */
  onUpdate?: () => void;
}

/** The list of games, and a note when a new version of the app is ready. */
export function Home({ games, onUpdate }: Props) {
  return (
    <>
      {onUpdate && (
        <div className="update" role="status">
          <span>Der er en ny version af {appMeta.name}.</span>
          <button type="button" className="btn btn-primary" onClick={onUpdate}>
            Opdatér
          </button>
        </div>
      )}
      <header className="home-header">
        <span className="badge">
          <span className="badge-dot" aria-hidden="true" />
          Virker uden internet
        </span>
        <h1 className="home-title">{appMeta.name}</h1>
        <p>Små spil til sofaen, middagsbordet og køreturen.</p>
      </header>

      {games.length === 0 ? (
        <p className="home-empty">Spillene er på vej.</p>
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
                  <span className="tile-pill">Kommer snart</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <SavedGames />
    </>
  );
}

function TileContent({ game }: { game: GameInfo }) {
  return (
    <>
      <span className="tile-icon" aria-hidden="true">
        {game.icon}
      </span>
      <span className="tile-text">
        <strong>{game.title}</strong>
        <span>{game.description}</span>
      </span>
    </>
  );
}

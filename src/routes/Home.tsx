import type { CSSProperties } from 'react';
import { gameTheme, type GameInfo } from '../lib/games';
import { gameHref } from '../lib/router';
import './Home.css';

/** The list of games. */
export function Home({ games }: { games: readonly GameInfo[] }) {
  return (
    <>
      <header className="home-header">
        <span className="badge">
          <span className="badge-dot" aria-hidden="true" />
          Virker uden internet
        </span>
        <h1 className="home-title">Småspil</h1>
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

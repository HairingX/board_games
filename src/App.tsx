import { MotionConfig } from 'motion/react';
import { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { games as allGames, type GameInfo } from './lib/games';
import { parseGameId } from './lib/router';
import { Home } from './routes/Home';

/** The app: the home screen, or the game the location's hash names. */
export function App({ games = allGames }: { games?: readonly GameInfo[] }) {
  const [gameId, setGameId] = useState(() => parseGameId(window.location.hash));

  useEffect(() => {
    function onHashChange(): void {
      setGameId(parseGameId(window.location.hash));
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const game = games.find((candidate) => candidate.id === gameId);

  return (
    <MotionConfig reducedMotion="user">
      {gameId === undefined ? (
        <Home games={games} />
      ) : game?.Screen ? (
        <ErrorBoundary key={gameId} fallback={<Message text="Spillet kunne ikke hentes." />}>
          <Suspense fallback={<p className="status">Henter spillet…</p>}>
            <game.Screen />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <Message text="Det spil findes ikke." />
      )}
    </MotionConfig>
  );
}

function Message({ text }: { text: string }) {
  return (
    <>
      <p className="status">{text}</p>
      <a className="status-link" href="#/">
        Tilbage til forsiden
      </a>
    </>
  );
}

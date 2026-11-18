import { MotionConfig } from 'motion/react';
import { Suspense, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { mayPlay } from './family/family';
import { FamilyProvider, useFamily } from './family/FamilyContext';
import { WhoIsPlaying } from './family/WhoIsPlaying';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { games as allGames, gameTheme, type GameInfo } from './lib/games';
import { parseGameId } from './lib/router';
import { loadNewVersion, useUpdateChecks } from './lib/updates';
import { Home } from './routes/Home';

/**
 * The app: "Hvem spiller?" first, then the home screen, or the game the location's hash names.
 * Only the games the player may play are offered or opened.
 */
export function App({ games = allGames }: { games?: readonly GameInfo[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <FamilyProvider>
        <Shell games={games} />
      </FamilyProvider>
    </MotionConfig>
  );
}

function Shell({ games }: { games: readonly GameInfo[] }) {
  const { current, leave } = useFamily();
  const [gameId, setGameId] = useState(() => parseGameId(window.location.hash));
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const {
    needRefresh: [updateWaiting],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_url, registered) => {
      setRegistration(registered);
    },
  });
  useUpdateChecks(registration);

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

  if (!current) return <WhoIsPlaying />;
  const playable = games.filter((candidate) => mayPlay(current.role, candidate.audience));
  const game = playable.find((candidate) => candidate.id === gameId);

  return gameId === undefined ? (
    <Home
      games={playable}
      player={current}
      onSwitch={leave}
      {...(updateWaiting
        ? {
            onUpdate: () => {
              loadNewVersion(
                navigator.serviceWorker,
                updateServiceWorker,
                window.location.reload.bind(window.location),
              );
            },
          }
        : {})}
    />
  ) : game?.Screen ? (
    <ErrorBoundary key={gameId} fallback={<Message text="Spillet kunne ikke hentes." />}>
      <Suspense fallback={<p className="status">Henter spillet…</p>}>
        <div className="game" style={gameTheme(game)}>
          <game.Screen />
        </div>
      </Suspense>
    </ErrorBoundary>
  ) : (
    <Message text="Det spil findes ikke." />
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

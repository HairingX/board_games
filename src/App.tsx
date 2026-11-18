import { MotionConfig } from 'motion/react';
import { Suspense, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ChoosePlayers } from './family/ChoosePlayers';
import { mayPlay, type Profile } from './family/family';
import { FamilyProvider, useFamily } from './family/FamilyContext';
import { WhoIsPlaying } from './family/WhoIsPlaying';
import { I18nProvider, useMessages } from './i18n/I18n';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { gameSaveKey, games as allGames, gameTheme, type GameInfo } from './lib/games';
import { moveSave, saves } from './lib/saves';
import { parseGameId } from './lib/router';
import { loadNewVersion, useUpdateChecks } from './lib/updates';
import { Home } from './routes/Home';
import { Settings } from './routes/Settings';
import { appText } from './routes/text';
import { common } from './ui/text';

/**
 * The app: "Hvem spiller?" first, then the home screen, or the game the location's hash names.
 * Only the games the player may play are offered or opened.
 */
export function App({ games = allGames }: { games?: readonly GameInfo[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <FamilyProvider>
          <Shell games={games} />
        </FamilyProvider>
      </I18nProvider>
    </MotionConfig>
  );
}

/** A game being played: who plays it and where it saves. */
interface Session {
  gameId: string;
  players: Profile[];
  saveKey: string;
}

function Shell({ games }: { games: readonly GameInfo[] }) {
  const t = useMessages(appText);
  const { family, current, save, leave } = useFamily();
  const [inSettings, setInSettings] = useState(false);
  const [session, setSession] = useState<Session>();
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
      const next = parseGameId(window.location.hash);
      setGameId(next);
      // The players are chosen again only when another game opens, not when the same is named.
      setSession((playing) => (playing?.gameId === next ? playing : undefined));
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  if (!current) return <WhoIsPlaying />;
  if (inSettings) {
    return (
      <Settings
        family={family}
        current={current}
        onChange={save}
        onBack={() => {
          setInSettings(false);
        }}
      />
    );
  }
  const playable = games.filter((candidate) => mayPlay(current.role, candidate.audience));
  const game = playable.find((candidate) => candidate.id === gameId);

  return gameId === undefined ? (
    <Home
      games={playable}
      player={current}
      onSwitch={leave}
      onSettings={() => {
        setInSettings(true);
      }}
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
    <ErrorBoundary key={gameId} fallback={<Message text={t.loadFailed} />}>
      <Suspense fallback={<p className="status">{t.loading}</p>}>
        <div className="game" style={gameTheme(game)}>
          {session?.gameId === game.id ? (
            <game.Screen players={session.players} saveKey={session.saveKey} />
          ) : (
            <ChoosePlayers
              game={game}
              family={family}
              current={current}
              onChange={save}
              onStart={(players) => {
                const saveKey = gameSaveKey(game, players);
                const moved = game.formerSaveKey
                  ? moveSave(saves, game.formerSaveKey, saveKey)
                  : Promise.resolve();
                void moved
                  .catch(() => undefined)
                  .then(() => {
                    setSession({ gameId: game.id, players, saveKey });
                  });
              }}
            />
          )}
        </div>
      </Suspense>
    </ErrorBoundary>
  ) : (
    <Message text={t.noSuchGame} />
  );
}

function Message({ text }: { text: string }) {
  const { backHome } = useMessages(common);
  return (
    <>
      <p className="status">{text}</p>
      <a className="status-link" href="#/">
        {backHome}
      </a>
    </>
  );
}

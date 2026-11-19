import { MotionConfig } from 'motion/react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ChoosePlayers } from './family/ChoosePlayers';
import { mayPlay, type Family, type Profile } from './family/family';
import { FamilyProvider, useFamily } from './family/FamilyContext';
import { I18nProvider, useMessages } from './i18n/I18n';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { GameFrameProvider } from './ui/GameFrame';
import { betaSaveKey, reviveBeta } from './lib/beta';
import { gameSaveKey, games as allGames, gameTheme, type GameInfo } from './lib/games';
import { useOfflineStatus } from './lib/offline';
import { moveSave, saves } from './lib/saves';
import { navigate, useRoute } from './lib/router';
import { loadNewVersion, useUpdateChecks } from './lib/updates';
import { useSaved } from './lib/useSaved';
import { Home } from './routes/Home';
import { Settings } from './routes/Settings';
import { Start } from './routes/Start';
import { appText } from './routes/text';
import { common } from './ui/text';

/**
 * The app: the start screen until someone is chosen, then the screen the location's hash names.
 * It opens again on whoever was playing, where they were. Only the games the player may play
 * are offered or opened.
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

/** The players a game's address names, if they are all in the family and may play it. */
function playersFor(
  game: GameInfo,
  ids: readonly string[] | null,
  family: Family,
): Profile[] | undefined {
  if (!ids || new Set(ids).size !== ids.length) return undefined;
  const players = ids.map((id) => family.profiles.find((profile) => profile.id === id));
  const known = players.filter((player): player is Profile => player !== undefined);
  const fits =
    known.length === ids.length &&
    known.length >= game.players.min &&
    known.length <= game.players.max &&
    known.every((player) => mayPlay(player.role, game.audience));
  return fits ? known : undefined;
}

/**
 * The players of a game when there is no choice to make: the game takes a set number, and
 * exactly that many in the family may play it, as two grown-ups and Parkort.
 */
function onlyGroup(game: GameInfo, family: Family): Profile[] | undefined {
  const { min, max } = game.players;
  const able = family.profiles.filter((profile) => mayPlay(profile.role, game.audience));
  return min === max && able.length === min ? able : undefined;
}

/** Starts the game with its only possible players at once, in place of asking who joins. */
function StartAlone({ onStart }: { onStart: () => void }) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    onStart();
  }, [onStart]);
  return null;
}

function Shell({ games }: { games: readonly GameInfo[] }) {
  const t = useMessages(appText);
  const { family, current, save, leave, place, notePlace } = useFamily();
  const route = useRoute();
  const [beta, setBeta] = useSaved(betaSaveKey, reviveBeta);
  /** The games offered: those still being built only while beta is on. */
  const shown = games.filter((game) => game.beta !== true || beta === true);
  /** Whether the app opened on someone remembered, who stays on the address it opened on. */
  const resumed = useRef(current !== undefined);
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
  const offline = useOfflineStatus(registration);

  /** Where the player was last noted, read when the player changes. */
  const lastPlace = useRef(place);
  useEffect(() => {
    lastPlace.current = place;
  }, [place]);

  // Someone newly chosen goes home. The one the app opened on stays where it opened: on the
  // start screen, or on the screen a reload or an update kept. Only a new player moves the
  // address; moving about the app only notes where they are.
  const playerId = current?.id;
  useEffect(() => {
    if (playerId === undefined) return;
    const opened = resumed.current;
    resumed.current = false;
    if (!opened && window.location.hash !== lastPlace.current) {
      window.location.replace(lastPlace.current);
    }
  }, [playerId]);

  // Where someone is, is remembered for the next time the app opens.
  useEffect(() => {
    // The start address is left for where the player was as soon as they are known.
    if (current && window.location.hash !== '') notePlace(window.location.hash);
  }, [current, route, notePlace]);

  const update = updateWaiting
    ? () => {
        loadNewVersion(
          navigator.serviceWorker,
          updateServiceWorker,
          window.location.reload.bind(window.location),
        );
      }
    : undefined;

  if (!current || route.name === 'start') {
    return <Start games={shown} {...(update ? { onUpdate: update } : {})} />;
  }

  const playable = shown.filter((candidate) => mayPlay(current.role, candidate.audience));
  const home = () => {
    navigate({ name: 'home' });
  };

  switch (route.name) {
    case 'home':
      return (
        <Home
          games={playable}
          player={current}
          onSwitch={leave}
          onSettings={() => {
            navigate({ name: 'settings', page: { name: 'main' } });
          }}
          {...(update ? { onUpdate: update } : {})}
        />
      );
    case 'settings':
      return current.role === 'voksen' ? (
        <Settings
          family={family}
          current={current}
          onChange={save}
          page={route.page}
          go={(page) => {
            navigate({ name: 'settings', page });
          }}
          onBack={home}
          offline={offline}
          beta={beta === true}
          onBeta={setBeta}
        />
      ) : (
        <Message text={t.noSuchPage} />
      );
    case 'game': {
      // A game still being built waits until it is known whether beta is on.
      if (beta === undefined && games.some((game) => game.beta === true && game.id === route.id)) {
        return null;
      }
      const game = playable.find((candidate) => candidate.id === route.id);
      if (!game?.Screen) return <Message text={t.noSuchGame} />;
      const players = playersFor(game, route.players, family);
      /** Starts the game with these players, once a save from before they were chosen is theirs. */
      const start = (chosen: readonly Profile[], replace = false) => {
        const moved = game.formerSaveKey
          ? moveSave(saves, game.formerSaveKey, gameSaveKey(game, chosen))
          : Promise.resolve();
        void moved
          .catch(() => undefined)
          .then(() => {
            navigate(
              {
                name: 'game',
                id: game.id,
                players: chosen.map((player) => player.id),
                place: [],
              },
              { replace },
            );
          });
      };
      const only = players ? undefined : onlyGroup(game, family);
      return (
        <ErrorBoundary key={game.id} fallback={<Message text={t.loadFailed} />}>
          <Suspense fallback={<p className="status">{t.loading}</p>}>
            <GameFrameProvider icon={game.icon} players={players ?? []}>
              <div className="game" style={gameTheme(game)}>
                {only ? (
                  <StartAlone
                    onStart={() => {
                      start(only, true);
                    }}
                  />
                ) : players ? (
                  <game.Screen
                    players={players}
                    saveKey={gameSaveKey(game, players)}
                    place={route.place}
                    go={(next) => {
                      navigate({ ...route, place: next });
                    }}
                  />
                ) : (
                  <ChoosePlayers
                    game={game}
                    family={family}
                    current={current}
                    onChange={save}
                    onStart={(chosen) => {
                      start(chosen);
                    }}
                  />
                )}
              </div>
            </GameFrameProvider>
          </Suspense>
        </ErrorBoundary>
      );
    }
    case 'unknown':
      return <Message text={t.noSuchPage} />;
  }
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

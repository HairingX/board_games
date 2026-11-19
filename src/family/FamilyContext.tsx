import { createContext, use, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useSaved } from '../lib/useSaved';
import { isLocked, reviveFamily, type Family, type Profile } from './family';
import { nobody, rememberedSaveKey, reviveRemembered, type Remembered } from './remembered';

interface FamilyApi {
  family: Family;
  /** Who is playing now, as the family has them; undefined while "Hvem spiller?" is shown. */
  current: Profile | undefined;
  save: (family: Family) => void;
  /** Shows the home screen for the profile, once the lock's code, if it asks for one, is given. */
  choose: (profile: Profile) => void;
  /** Goes back to "Hvem spiller?". */
  leave: () => void;
  /** Where the player was when the app was last used: a location's hash. */
  place: string;
  /** Remembers where the player is now. */
  notePlace: (place: string) => void;
}

const FamilyContext = createContext<FamilyApi | undefined>(undefined);

/** Where the family is saved on the phone. */
export const familySaveKey = 'familie';

/**
 * The family on this phone, who is playing and where. Who was playing is remembered, so the
 * app opens straight on them, except a grown-up behind the lock once the app has lain unused
 * for a while. Each time the app is left, when it was last used is noted.
 */
export function FamilyProvider({ children }: { children: ReactNode }) {
  const [family, save] = useSaved(familySaveKey, reviveFamily);
  const [remembered, remember] = useSaved(rememberedSaveKey, reviveRemembered);

  /** What is remembered now, changes made in the same moment included. */
  const latest = useRef<Remembered | undefined>(undefined);
  useEffect(() => {
    latest.current = remembered;
  }, [remembered]);

  const update = useCallback(
    (change: Partial<Remembered>) => {
      // A child's effects run before this provider's, so the latest may not be noted yet.
      const base = latest.current ?? remembered;
      if (!family || !base) return;
      const next = { ...base, ...change, at: Date.now() };
      const player = family.profiles.find((profile) => profile.id === next.player);
      const full = { ...next, locked: player ? isLocked(family, player) : false };
      latest.current = full;
      remember(full);
    },
    [family, remembered, remember],
  );

  useEffect(() => {
    function onHide(): void {
      if (document.visibilityState === 'hidden') update({});
    }
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [update]);

  const notePlace = useCallback(
    (place: string) => {
      if (place !== latest.current?.place) update({ place });
    },
    [update],
  );

  if (!family || !remembered) return null;

  const api: FamilyApi = {
    family,
    current: family.profiles.find((profile) => profile.id === remembered.player),
    save,
    choose(profile) {
      update({ player: profile.id, place: '#/' });
    },
    leave() {
      update({ ...nobody });
    },
    place: remembered.place,
    notePlace,
  };
  return <FamilyContext value={api}>{children}</FamilyContext>;
}

/** The family and who is playing, inside a FamilyProvider. */
export function useFamily(): FamilyApi {
  const api = use(FamilyContext);
  if (!api) throw new Error('useFamily is used outside a FamilyProvider.');
  return api;
}

import { createContext, use, useState, type ReactNode } from 'react';
import { useSaved } from '../lib/useSaved';
import { reviveFamily, type Family, type Profile } from './family';

interface FamilyApi {
  family: Family;
  /** Who is playing now; undefined while "Hvem spiller?" is shown. */
  current: Profile | undefined;
  save: (family: Family) => void;
  /**
   * Plays as the profile; a child locks the app, so grown-ups need the code to get back. Give
   * the family when it has just changed and is not saved yet.
   */
  choose: (profile: Profile, family?: Family) => void;
  /** Plays as a grown-up once the code is given, unlocking the app. */
  unlock: (profile: Profile, family?: Family) => void;
  /** Goes back to "Hvem spiller?". */
  leave: () => void;
}

const FamilyContext = createContext<FamilyApi | undefined>(undefined);

/** Where the family is saved on the phone. */
export const familySaveKey = 'familie';

/** The family on this phone and who is playing; "Hvem spiller?" is asked at every start. */
export function FamilyProvider({ children }: { children: ReactNode }) {
  const [family, save] = useSaved(familySaveKey, reviveFamily);
  const [current, setCurrent] = useState<Profile>();
  if (!family) return null;

  const api: FamilyApi = {
    family,
    current,
    save,
    choose(profile, from = family) {
      if (profile.role === 'barn') save({ ...from, locked: true });
      setCurrent(profile);
    },
    unlock(profile, from = family) {
      save({ ...from, locked: false });
      setCurrent(profile);
    },
    leave() {
      setCurrent(undefined);
    },
  };
  return <FamilyContext value={api}>{children}</FamilyContext>;
}

/** The family and who is playing, inside a FamilyProvider. */
export function useFamily(): FamilyApi {
  const api = use(FamilyContext);
  if (!api) throw new Error('useFamily is used outside a FamilyProvider.');
  return api;
}

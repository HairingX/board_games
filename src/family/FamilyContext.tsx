import { createContext, use, useState, type ReactNode } from 'react';
import { useSaved } from '../lib/useSaved';
import { reviveFamily, type Family, type Profile } from './family';

interface FamilyApi {
  family: Family;
  /** Who is playing now, as the family has them; undefined while "Hvem spiller?" is shown. */
  current: Profile | undefined;
  save: (family: Family) => void;
  /** Shows the home screen for the profile, once its code, if it has one, is given. */
  choose: (profile: Profile) => void;
  /** Goes back to "Hvem spiller?". */
  leave: () => void;
}

const FamilyContext = createContext<FamilyApi | undefined>(undefined);

/** Where the family is saved on the phone. */
export const familySaveKey = 'familie';

/**
 * The family on this phone and who is on the home screen; "Hvem spiller?" is asked at every
 * start. Who is on the home screen decides which games are offered.
 */
export function FamilyProvider({ children }: { children: ReactNode }) {
  const [family, save] = useSaved(familySaveKey, reviveFamily);
  const [currentId, setCurrentId] = useState<string>();
  if (!family) return null;

  const api: FamilyApi = {
    family,
    current: family.profiles.find((profile) => profile.id === currentId),
    save,
    choose(profile) {
      setCurrentId(profile.id);
    },
    leave() {
      setCurrentId(undefined);
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

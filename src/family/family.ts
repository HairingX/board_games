/** Whether a profile is a grown-up, who may see every game, or a child, who sees their own. */
export type Role = 'voksen' | 'barn';

/** The colours a profile can have; each is a token in src/app.css named --profile-<colour>. */
export const profileColors = ['plum', 'teal', 'terracotta', 'olive', 'ochre', 'slate'] as const;
export type ProfileColor = (typeof profileColors)[number];

/** A four-digit code, kept only as a salted SHA-256 hash, both in hexadecimal. */
export interface PinHash {
  salt: string;
  hash: string;
}

export interface Profile {
  id: string;
  name: string;
  role: Role;
  color: ProfileColor;
}

/** What is chosen about a profile in its form. */
export type ProfileValues = Omit<Profile, 'id'>;

/** The family on this phone, saved on it. Who is playing right now is not saved. */
export interface Family {
  profiles: Profile[];
  /**
   * The grown-ups' lock: when set, this code is asked for before a grown-up is chosen, which
   * keeps the grown-ups' games and settings from the children. Null when it is off, as it is
   * until a grown-up turns it on in the settings.
   */
  lock: PinHash | null;
}

/** Who may play a game: grown-ups only, children, or everyone. */
export type Audience = 'voksne' | 'børn' | 'alle';

export function newFamily(): Family {
  return { profiles: [], lock: null };
}

/** Whether a profile may open a game for this audience: children never see grown-ups' games. */
export function mayPlay(role: Role, audience: Audience): boolean {
  return role === 'voksen' || audience !== 'voksne';
}

/** A new profile. */
export function newProfile(values: ProfileValues): Profile {
  return { id: crypto.randomUUID(), ...values };
}

/** The family with the profile added at the end. */
export function addProfile(family: Family, profile: Profile): Family {
  return { ...family, profiles: [...family.profiles, profile] };
}

/** The family with the profile of the same id changed to this one. */
export function updateProfile(family: Family, changed: Profile): Family {
  return {
    ...family,
    profiles: family.profiles.map((profile) => (profile.id === changed.id ? changed : profile)),
  };
}

/** The family with the grown-ups' lock set to the code, or turned off with null. */
export function setLock(family: Family, lock: PinHash | null): Family {
  return { ...family, lock };
}

/** Whether choosing the profile asks for the grown-ups' code first. */
export function isLocked(family: Family, profile: Profile): boolean {
  return family.lock !== null && profile.role === 'voksen';
}

/**
 * The family without the profile. The last grown-up stays while there are children, as only a
 * grown-up can look after the family.
 */
export function removeProfile(family: Family, id: string): Family {
  const profiles = family.profiles.filter((profile) => profile.id !== id);
  const keepsGrownUp =
    profiles.some((profile) => profile.role === 'voksen') ||
    !profiles.some((profile) => profile.role === 'barn');
  return keepsGrownUp ? { ...family, profiles } : family;
}

/** The colour the next profile gets: the first that no one has, or the first again. */
export function nextColor(family: Family): ProfileColor {
  const taken = new Set(family.profiles.map((profile) => profile.color));
  return profileColors.find((color) => !taken.has(color)) ?? profileColors[0];
}

/**
 * The family from a saved value, or a new family when the value is no family. Earlier versions
 * kept codes otherwise: the first one code for the family, used by the grown-ups, the next a
 * code on each profile. The family's code, or else the first grown-up's, becomes the
 * grown-ups' lock, so a code that worked still does; children's codes and anything else an
 * earlier version kept on a profile are left behind.
 */
export function reviveFamily(value: unknown): Family {
  if (typeof value !== 'object' || value === null) return newFamily();
  const { profiles, lock, pin: familyPin } = value as Record<string, unknown>;
  if (!Array.isArray(profiles)) return newFamily();
  const revived = profiles.map(reviveProfile);
  if (!revived.every((profile) => profile !== undefined)) return newFamily();
  const grownUpPin = profiles
    .map((profile) => profile as Record<string, unknown>)
    .find((profile) => profile.role === 'voksen' && isPinHash(profile.pin))?.pin;
  const kept = [lock, familyPin, grownUpPin].find(isPinHash) ?? null;
  const malformed = [lock, familyPin].some(
    (code) => code !== undefined && code !== null && !isPinHash(code),
  );
  return malformed ? newFamily() : { profiles: revived, lock: kept };
}

function reviveProfile(value: unknown): Profile | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { id, name, role, color } = value as Record<string, unknown>;
  const valid =
    typeof id === 'string' &&
    typeof name === 'string' &&
    (role === 'voksen' || role === 'barn') &&
    profileColors.includes(color as ProfileColor);
  return valid ? { id, name, role, color: color as ProfileColor } : undefined;
}

function isPinHash(value: unknown): value is PinHash {
  if (typeof value !== 'object' || value === null) return false;
  const pin = value as Record<string, unknown>;
  return typeof pin.salt === 'string' && typeof pin.hash === 'string';
}

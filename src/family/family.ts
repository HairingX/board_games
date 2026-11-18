/** Whether a profile is a grown-up, who may see every game, or a child, who sees their own. */
export type Role = 'voksen' | 'barn';

/** The colours a profile can have; each is a token in src/app.css named --profile-<colour>. */
export const profileColors = ['plum', 'teal', 'terracotta', 'olive', 'ochre', 'slate'] as const;
export type ProfileColor = (typeof profileColors)[number];

/** Each colour's name, as a screen reader says it. */
export const colorNames: Readonly<Record<ProfileColor, string>> = {
  plum: 'Blomme',
  teal: 'Petrol',
  terracotta: 'Terrakotta',
  olive: 'Oliven',
  ochre: 'Okker',
  slate: 'Skifer',
};

export interface Profile {
  id: string;
  name: string;
  role: Role;
  color: ProfileColor;
}

/** A four-digit code, kept only as a salted SHA-256 hash, both in hexadecimal. */
export interface PinHash {
  salt: string;
  hash: string;
}

/** The family on this phone, saved on it. Who is playing right now is not saved. */
export interface Family {
  profiles: Profile[];
  /** Whether a child was chosen last: grown-ups then need the code to get back in. */
  locked: boolean;
  /** The code that unlocks; null until one is chosen, which is when the first child is added. */
  pin: PinHash | null;
}

/** Who may play a game: grown-ups only, children, or everyone. */
export type Audience = 'voksne' | 'børn' | 'alle';

export function newFamily(): Family {
  return { profiles: [], locked: false, pin: null };
}

/** Whether a profile may open a game for this audience: children never see grown-ups' games. */
export function mayPlay(role: Role, audience: Audience): boolean {
  return role === 'voksen' || audience !== 'voksne';
}

/** The family with the profile added at the end. */
export function addProfile(family: Family, profile: Profile): Family {
  return { ...family, profiles: [...family.profiles, profile] };
}

/**
 * The family without the profile. The last grown-up stays while there are children, so that
 * someone can always unlock.
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

/** The family from a saved value, or a new family when the value is no family. */
export function reviveFamily(value: unknown): Family {
  if (typeof value !== 'object' || value === null) return newFamily();
  const saved = value as Record<string, unknown>;
  const { profiles, locked, pin } = saved;
  const valid =
    Array.isArray(profiles) &&
    profiles.every(isProfile) &&
    typeof locked === 'boolean' &&
    (pin === null || isPinHash(pin));
  return valid ? { profiles, locked, pin } : newFamily();
}

function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false;
  const profile = value as Record<string, unknown>;
  return (
    typeof profile.id === 'string' &&
    typeof profile.name === 'string' &&
    (profile.role === 'voksen' || profile.role === 'barn') &&
    profileColors.includes(profile.color as ProfileColor)
  );
}

function isPinHash(value: unknown): value is PinHash {
  if (typeof value !== 'object' || value === null) return false;
  const pin = value as Record<string, unknown>;
  return typeof pin.salt === 'string' && typeof pin.hash === 'string';
}

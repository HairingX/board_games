import { bestLocale, isLocale, type Locale } from '../i18n/locales';

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
  /** Asked for when the profile is chosen on "Hvem spiller?"; null for none. */
  pin: PinHash | null;
  /** The language the app speaks while the profile is on the home screen. */
  language: Locale;
}

/** What is chosen about a profile in its form. */
export type ProfileValues = Pick<Profile, 'name' | 'role' | 'color' | 'language'>;

/** The family on this phone, saved on it. Who is playing right now is not saved. */
export interface Family {
  profiles: Profile[];
}

/** Who may play a game: grown-ups only, children, or everyone. */
export type Audience = 'voksne' | 'børn' | 'alle';

export function newFamily(): Family {
  return { profiles: [] };
}

/** Whether a profile may open a game for this audience: children never see grown-ups' games. */
export function mayPlay(role: Role, audience: Audience): boolean {
  return role === 'voksen' || audience !== 'voksne';
}

/** A new profile, without a code. */
export function newProfile(values: ProfileValues): Profile {
  return { id: crypto.randomUUID(), pin: null, ...values };
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

/** The family with the profile's code set, or taken away with null. */
export function setPin(family: Family, id: string, pin: PinHash | null): Family {
  return {
    ...family,
    profiles: family.profiles.map((profile) => (profile.id === id ? { ...profile, pin } : profile)),
  };
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
 * The family from a saved value, or a new family when the value is no family. The first
 * version kept one code for the family, used by the grown-ups; it becomes each grown-up's own.
 * A profile saved before profiles had a language, or with one the app no longer speaks, gets
 * the phone's.
 */
export function reviveFamily(value: unknown): Family {
  if (typeof value !== 'object' || value === null) return newFamily();
  const { profiles, pin: familyPin } = value as Record<string, unknown>;
  if (
    !Array.isArray(profiles) ||
    !(familyPin === undefined || familyPin === null || isPinHash(familyPin))
  ) {
    return newFamily();
  }
  const revived = profiles.map((profile) => reviveProfile(profile, familyPin ?? null));
  return revived.every((profile) => profile !== undefined) ? { profiles: revived } : newFamily();
}

function reviveProfile(value: unknown, familyPin: PinHash | null): Profile | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const profile = value as Record<string, unknown>;
  const { id, name, role, color, language } = profile;
  const pin = 'pin' in profile ? profile.pin : role === 'voksen' ? familyPin : null;
  const valid =
    typeof id === 'string' &&
    typeof name === 'string' &&
    (role === 'voksen' || role === 'barn') &&
    profileColors.includes(color as ProfileColor) &&
    (pin === null || isPinHash(pin));
  if (!valid) return undefined;
  return {
    id,
    name,
    role,
    color: color as ProfileColor,
    pin,
    language: isLocale(language) ? language : bestLocale(navigator.languages),
  };
}

function isPinHash(value: unknown): value is PinHash {
  if (typeof value !== 'object' || value === null) return false;
  const pin = value as Record<string, unknown>;
  return typeof pin.salt === 'string' && typeof pin.hash === 'string';
}

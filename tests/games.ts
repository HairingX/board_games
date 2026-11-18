import type { Translations } from '../src/i18n/locales';
import type { GameAbout } from '../src/lib/games';

/** A test game's name and description, the same in every language. */
export function about(title: string, description = ''): Translations<GameAbout> {
  return { da: { title, description }, en: { title, description } };
}

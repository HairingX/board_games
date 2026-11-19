import { useMessages } from '../i18n/I18n';
import type { Translations } from '../i18n/locales';
import type { GameAbout } from '../lib/games';

/**
 * A game's name as it is shown: where the name joins two words, as Parkort joins "par" and
 * "kort", the first is set a little heavier, so the name reads as the two words it is made of.
 */
export function GameName({ about }: { about: Translations<GameAbout> }) {
  const { title, stress } = useMessages(about);
  if (!stress) return title;
  return (
    <>
      <b className="game-name-stress">{stress}</b>
      <span className="game-name-rest">{title.slice(stress.length)}</span>
    </>
  );
}

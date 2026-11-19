import { Avatar } from '../family/Avatar';
import type { Profile } from '../family/family';
import { useMessages } from '../i18n/I18n';
import { common } from './text';
import './TurnBanner.css';

/**
 * Whose turn it is, in a game played in the open, where the phone passes round the table
 * without anything to hide: the player's picture and a light "Nu er det Idas tur".
 */
export function TurnBanner({ player }: { player: Profile }) {
  const t = useMessages(common);
  return (
    <p className="turn-banner" role="status">
      <Avatar profile={player} size="small" />
      <span>{t.turn(player.name)}</span>
    </p>
  );
}

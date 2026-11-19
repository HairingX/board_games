import type { GameProps } from '../../lib/games';
import { takeLegacy } from '../../lib/storage';
import { useSaved } from '../../lib/useSaved';
import { cards } from './cards';
import { newDeck, reconcile, upgradeDeck, type DeckState } from './deck';
import { Play } from './Play';
import { Setup } from './Setup';
import './Parkort.css';

/** Where the first version kept the deck, in localStorage. */
export const legacyKey = 'parkort/v1';

/** The deck from what was saved, with cards added or removed since; a new deck without one. */
export function reviveDeck(saved: unknown): DeckState {
  const deck = upgradeDeck(saved ?? takeLegacy(legacyKey));
  return deck ? reconcile(deck, cards) : newDeck(cards);
}

/** The game's place while the cards are on the table; its start is choosing them. */
export const tablePlace = 'kort';

/**
 * Question cards for couples, remembering which cards the two players have talked about: each
 * couple has its own deck. The cards on the table have their own address, so a reload stays.
 */
export default function Parkort({ saveKey, place, go }: GameProps) {
  const [deck, setDeck] = useSaved(saveKey, reviveDeck);
  const playing = place[0] === tablePlace;

  if (!deck) return null;

  return (
    <div className="parkort">
      {playing ? (
        <Play
          deck={deck}
          onChange={setDeck}
          onBack={() => {
            go([]);
          }}
        />
      ) : (
        <Setup
          deck={deck}
          onChange={setDeck}
          onStart={() => {
            go([tablePlace]);
          }}
        />
      )}
    </div>
  );
}

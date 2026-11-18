import { useState } from 'react';
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

/**
 * Question cards for couples, remembering which cards the two players have talked about: each
 * couple has its own deck.
 */
export default function Parkort({ saveKey }: GameProps) {
  const [deck, setDeck] = useSaved(saveKey, reviveDeck);
  const [playing, setPlaying] = useState(false);

  if (!deck) return null;

  return (
    <div className="parkort">
      {playing ? (
        <Play
          deck={deck}
          onChange={setDeck}
          onBack={() => {
            setPlaying(false);
          }}
        />
      ) : (
        <Setup
          deck={deck}
          onChange={setDeck}
          onStart={() => {
            setPlaying(true);
          }}
        />
      )}
    </div>
  );
}

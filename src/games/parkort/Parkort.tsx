import { useEffect, useState, type CSSProperties } from 'react';
import { readStored, writeStored } from '../../lib/storage';
import { cards } from './cards';
import { isDeckState, newDeck, reconcile, type DeckState } from './deck';
import { Play } from './Play';
import { Setup } from './Setup';
import './Parkort.css';

/** Where the deck is saved; a new shape of DeckState needs a new key. */
export const storageKey = 'parkort/v1';

const theme = { '--from': '#f43f5e', '--to': '#f59e0b' } as CSSProperties;

function loadDeck(): DeckState {
  const saved = readStored(storageKey, isDeckState);
  return saved ? reconcile(saved, cards) : newDeck(cards);
}

/** Question cards for couples, remembering which cards have been talked about. */
export default function Parkort() {
  const [deck, setDeck] = useState(loadDeck);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    writeStored(storageKey, deck);
  }, [deck]);

  return (
    <div className="parkort" style={theme}>
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

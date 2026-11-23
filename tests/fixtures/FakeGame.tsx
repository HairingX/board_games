import type { GameProps } from '../../src/lib/games';
import { GameHeader } from '../../src/ui/GameHeader';

/** A game for the app's tests: says who plays and where, and can go further in. */
export default function FakeGame({ players, saveKey, place, go }: GameProps) {
  return (
    <>
      <GameHeader title="Testbanen" />
      <p>Et testspil</p>
      <p>
        Spillere: {players.map((player) => player.name).join(', ')} · {saveKey} · {place.join('/')}
      </p>
      <button
        type="button"
        onClick={() => {
          go(['videre']);
        }}
      >
        Videre
      </button>
    </>
  );
}

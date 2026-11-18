import { useState } from 'react';
import type { GameInfo } from '../lib/games';
import { GameHeader } from '../ui/GameHeader';
import { Avatar } from './Avatar';
import { addProfile, mayPlay, nextColor, type Family, type Profile } from './family';
import { ProfileForm } from './ProfileForm';
import './family.css';

interface Props {
  game: GameInfo;
  family: Family;
  /** Who is on the home screen; chosen to begin with. */
  current: Profile;
  onChange: (family: Family) => void;
  onStart: (players: Profile[]) => void;
}

/** How many players the game wants, in words: "Vælg 2" or "Vælg 1–6". */
function howMany({ min, max }: GameInfo['players']): string {
  return min === max
    ? `Vælg ${String(min)} spillere.`
    : `Vælg ${String(min)}–${String(max)} spillere.`;
}

/**
 * "Hvem er med?" before a game: the players are chosen from the family, without codes, and
 * someone new can be added to the family here. A child can add only children, so no one gets
 * a grown-up's profile this way.
 */
export function ChoosePlayers({ game, family, current, onChange, onStart }: Props) {
  const [chosen, setChosen] = useState<string[]>([current.id]);
  const [adding, setAdding] = useState(false);
  const { min, max } = game.players;
  const candidates = family.profiles.filter((profile) => mayPlay(profile.role, game.audience));
  const players = candidates.filter((profile) => chosen.includes(profile.id));
  const full = players.length >= max;
  const newRole =
    current.role === 'barn' ? 'barn' : game.audience === 'voksne' ? 'voksen' : undefined;

  function toggle(id: string): void {
    setChosen(chosen.includes(id) ? chosen.filter((other) => other !== id) : [...chosen, id]);
  }

  return (
    <section className="family">
      <GameHeader title={game.title} />
      {adding ? (
        <>
          <h2 className="players-title">Ny spiller</h2>
          <ProfileForm
            color={nextColor(family)}
            {...(newRole ? { role: newRole } : {})}
            onSave={(profile) => {
              onChange(addProfile(family, profile));
              if (!full) setChosen([...chosen, profile.id]);
              setAdding(false);
            }}
            onCancel={() => {
              setAdding(false);
            }}
          />
        </>
      ) : (
        <>
          <h2 className="players-title">Hvem er med?</h2>
          <p className="family-intro">{howMany(game.players)}</p>
          <ul className="family-grid">
            {candidates.map((profile) => {
              const on = chosen.includes(profile.id);
              return (
                <li key={profile.id}>
                  <button
                    type="button"
                    className="family-pick"
                    aria-pressed={on}
                    disabled={!on && full}
                    onClick={() => {
                      toggle(profile.id);
                    }}
                  >
                    <Avatar profile={profile} />
                    <span className="family-pick-name">{profile.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="family-footer">
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                setAdding(true);
              }}
            >
              Tilføj en ny spiller
            </button>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={players.length < min || players.length > max}
              onClick={() => {
                onStart(players);
              }}
            >
              Start
            </button>
          </div>
        </>
      )}
    </section>
  );
}

import { useState } from 'react';
import { useMessages } from '../i18n/I18n';
import type { GameInfo } from '../lib/games';
import { GameHeader } from '../ui/GameHeader';
import { common } from '../ui/text';
import { Avatar } from './Avatar';
import { addProfile, mayPlay, newProfile, nextColor, type Family, type Profile } from './family';
import { ProfileForm } from './ProfileForm';
import { familyText } from './text';
import './family.css';

interface Props {
  game: GameInfo;
  family: Family;
  /** Who is on the home screen; chosen to begin with. */
  current: Profile;
  onChange: (family: Family) => void;
  onStart: (players: Profile[]) => void;
}

/**
 * "Hvem er med?" before a game: the players are chosen from the family, without codes, and
 * someone new can be added to the family here. A child can add only children, so no one gets
 * a grown-up's profile this way.
 */
export function ChoosePlayers({ game, family, current, onChange, onStart }: Props) {
  const t = useMessages(familyText);
  const { start } = useMessages(common);
  const { title } = useMessages(game.about);
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
      <GameHeader title={title} />
      {adding ? (
        <>
          <h2 className="players-title">{t.newPlayer}</h2>
          <ProfileForm
            start={{ name: '', role: newRole ?? 'barn', color: nextColor(family) }}
            chooseRole={newRole === undefined}
            onSave={(values) => {
              const profile = newProfile(values);
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
          <h2 className="players-title">{t.whoIsIn}</h2>
          <p className="family-intro">{t.howMany(min, max)}</p>
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
              {t.addPlayer}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={players.length < min || players.length > max}
              onClick={() => {
                onStart(players);
              }}
            >
              {start}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

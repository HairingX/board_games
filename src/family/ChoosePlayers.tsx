import { useEffect, useEffectEvent, useState } from 'react';
import { formatList } from '../i18n/format';
import { useLocale, useMessages } from '../i18n/I18n';
import type { GameInfo } from '../lib/games';
import { GameHeader } from '../ui/GameHeader';
import { GameName } from '../ui/GameName';
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
  /** Who is chosen to begin with, as the players who just played; else whoever is on the home screen. */
  chosen?: readonly string[];
  /** Whether these players have a game going, so it is plain whether they go on or begin anew. */
  going?: (players: readonly Profile[]) => Promise<boolean>;
}

/**
 * "Hvem er med?" before a game: the players are chosen from the family, without codes, and
 * someone new can be added to the family here. A child can add only children, so no one gets
 * a grown-up's profile this way. Once they are chosen, it says whether they have a game going,
 * which goes on where it left off, or a new one begins, and the button says which.
 */
export function ChoosePlayers({
  game,
  family,
  current,
  onChange,
  onStart,
  chosen: first = [current.id],
  going,
}: Props) {
  const t = useMessages(familyText);
  const { start } = useMessages(common);
  const locale = useLocale();
  const [chosen, setChosen] = useState<readonly string[]>(first);
  const [adding, setAdding] = useState(false);
  const { min, max } = game.players;
  const candidates = family.profiles.filter((profile) => mayPlay(profile.role, game.audience));
  const players = candidates.filter((profile) => chosen.includes(profile.id));
  const full = players.length >= max;
  const ready = players.length >= min && players.length <= max;
  const group = players.map((player) => player.id).join('+');
  /** Whether the group chosen has a game going, once it is known, for that group. */
  const [found, setFound] = useState<{ group: string; going: boolean }>();
  const goingFor = useEffectEvent(() => (ready && going ? going(players) : undefined));
  useEffect(() => {
    const asked = goingFor();
    if (!asked) return;
    let current = true;
    void asked
      .then((answer) => {
        if (current) setFound({ group, going: answer });
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [group]);
  const known = ready && found?.group === group ? found.going : undefined;
  const names = formatList(
    locale,
    players.map((player) => player.name),
  );
  const newRole =
    current.role === 'barn' ? 'barn' : game.audience === 'voksne' ? 'voksen' : undefined;

  function toggle(id: string): void {
    setChosen(chosen.includes(id) ? chosen.filter((other) => other !== id) : [...chosen, id]);
  }

  return (
    <section className="family">
      <GameHeader title={<GameName about={game.about} />} />
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
                    {on && (
                      <span className="family-pick-check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                    <Avatar profile={profile} />
                    <span className="family-pick-name">{profile.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="family-going" aria-live="polite">
            {known === undefined ? '' : known ? t.going(names) : t.fresh(names)}
          </p>
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
              disabled={!ready}
              onClick={() => {
                onStart(players);
              }}
            >
              {known === undefined ? start : known ? t.carryOn : t.startNew}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

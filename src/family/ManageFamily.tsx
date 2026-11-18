import { useState } from 'react';
import { Avatar } from './Avatar';
import { removeProfile, type Family, type Profile } from './family';

interface Props {
  family: Family;
  onChange: (family: Family) => void;
  onChangePin: () => void;
  onDone: () => void;
}

/** Taking someone out of the family, and changing the code. */
export function ManageFamily({ family, onChange, onChangePin, onDone }: Props) {
  const [leaving, setLeaving] = useState<Profile>();

  return (
    <section className="family">
      <h1>Familien</h1>
      <ul className="family-list">
        {family.profiles.map((profile) => {
          const remaining = removeProfile(family, profile.id);
          return (
            <li key={profile.id} className="family-row">
              <Avatar profile={profile} size="small" />
              <span className="family-row-name">{profile.name}</span>
              <button
                type="button"
                className="btn btn-quiet"
                disabled={remaining === family}
                aria-label={`Fjern ${profile.name}`}
                onClick={() => {
                  setLeaving(profile);
                }}
              >
                Fjern
              </button>
            </li>
          );
        })}
      </ul>
      <p className="family-note">
        Den sidste voksne kan ikke fjernes, så længe der er børn, for nogen skal kunne låse op.
      </p>

      {leaving && (
        <div className="family-confirm" role="alertdialog" aria-label={`Fjern ${leaving.name}`}>
          <p>Vil du fjerne {leaving.name} fra familien?</p>
          <div className="family-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setLeaving(undefined);
              }}
            >
              Annullér
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onChange(removeProfile(family, leaving.id));
                setLeaving(undefined);
              }}
            >
              Ja, fjern
            </button>
          </div>
        </div>
      )}

      <div className="family-footer">
        {family.pin && (
          <button type="button" className="btn btn-ghost btn-block" onClick={onChangePin}>
            Skift kode
          </button>
        )}
        <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
          Færdig
        </button>
      </div>
    </section>
  );
}

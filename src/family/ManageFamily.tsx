import { useState } from 'react';
import { Avatar } from './Avatar';
import { addProfile, nextColor, removeProfile, setPin, type Family, type Profile } from './family';
import { PinSetup } from './PinSetup';
import { ProfileForm } from './ProfileForm';
import './family.css';

interface Props {
  family: Family;
  /** The grown-up looking after the family, who cannot take themselves out. */
  current: Profile;
  onChange: (family: Family) => void;
  onDone: () => void;
}

type View = { name: 'list' } | { name: 'add' } | { name: 'pin'; profile: Profile };

/** Adding and taking out the family's profiles, and their codes; for grown-ups. */
export function ManageFamily({ family, current, onChange, onDone }: Props) {
  const [view, setView] = useState<View>({ name: 'list' });
  const [leaving, setLeaving] = useState<Profile>();
  const back = () => {
    setView({ name: 'list' });
  };

  if (view.name === 'add') {
    return (
      <section className="family">
        <h1>Ny i familien</h1>
        <ProfileForm
          color={nextColor(family)}
          onSave={(profile) => {
            const added = addProfile(family, profile);
            if (profile.role === 'barn') {
              onChange(added);
              back();
            } else {
              setView({ name: 'pin', profile });
            }
          }}
          onCancel={back}
        />
      </section>
    );
  }

  if (view.name === 'pin') {
    return (
      <PinSetup
        name={view.profile.name}
        onDone={(pin) => {
          const withProfile = family.profiles.some((p) => p.id === view.profile.id)
            ? family
            : addProfile(family, view.profile);
          onChange(setPin(withProfile, view.profile.id, pin));
          back();
        }}
        onCancel={back}
      />
    );
  }

  return (
    <section className="family">
      <h1>Familien</h1>
      <ul className="family-list">
        {family.profiles.map((profile) => {
          const mayLeave =
            profile.id !== current.id && removeProfile(family, profile.id) !== family;
          return (
            <li key={profile.id} className="family-row">
              <Avatar profile={profile} size="small" />
              <span className="family-row-name">
                {profile.name}
                <small>{profile.role === 'voksen' ? 'Voksen' : 'Barn'}</small>
              </span>
              <button
                type="button"
                className="btn btn-quiet"
                aria-label={`Kode til ${profile.name}`}
                onClick={() => {
                  setView({ name: 'pin', profile });
                }}
              >
                {profile.pin ? 'Skift kode' : 'Kode'}
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                disabled={!mayLeave}
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
        En voksen med kode kan ikke vælges af børnene. Den sidste voksne bliver i familien, så længe
        der er børn.
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
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => {
            setView({ name: 'add' });
          }}
        >
          Tilføj en i familien
        </button>
        <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
          Færdig
        </button>
      </div>
    </section>
  );
}

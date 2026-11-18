import { useState } from 'react';
import { appMeta } from '../appMeta';
import { Avatar } from './Avatar';
import { addProfile, nextColor, type Family, type PinHash, type Profile } from './family';
import { useFamily } from './FamilyContext';
import { ForgotPin } from './ForgotPin';
import { ManageFamily } from './ManageFamily';
import { pinMatches } from './pin';
import { PinPad } from './PinPad';
import { PinSetup } from './PinSetup';
import { ProfileForm } from './ProfileForm';
import './family.css';

type View =
  | { name: 'list' }
  | { name: 'add' }
  | { name: 'manage' }
  | { name: 'set-pin'; then: (pin: PinHash) => void }
  | { name: 'enter-pin'; profile: Profile; pin: PinHash }
  | { name: 'forgot'; profile: Profile };

const list: View = { name: 'list' };

/**
 * "Hvem spiller?", asked at every start. A child goes straight in and locks the app; while it
 * is locked, a grown-up needs the code. The family is set up and changed here, unlocked only.
 */
export function WhoIsPlaying() {
  const { family, save, choose, unlock } = useFamily();
  const [view, setView] = useState<View>(list);
  const back = () => {
    setView(list);
  };

  function pick(profile: Profile): void {
    if (profile.role === 'voksen' && family.locked && family.pin) {
      setView({ name: 'enter-pin', profile, pin: family.pin });
    } else if (profile.role === 'barn' && !family.pin) {
      setView({
        name: 'set-pin',
        then: (pin) => {
          choose(profile, { ...family, pin });
        },
      });
    } else {
      choose(profile);
    }
  }

  function add(profile: Profile): void {
    if (profile.role === 'barn' && !family.pin) {
      setView({
        name: 'set-pin',
        then: (pin) => {
          save(addProfile({ ...family, pin }, profile));
          back();
        },
      });
    } else {
      save(addProfile(family, profile));
      back();
    }
  }

  switch (view.name) {
    case 'set-pin':
      return <PinSetup onDone={view.then} onCancel={back} />;
    case 'enter-pin':
      return (
        <PinPad
          title="Skriv koden"
          text={`Koden skal til for at spille som ${view.profile.name}.`}
          onEnter={async (pin) => {
            const right = await pinMatches(pin, view.pin);
            if (right) unlock(view.profile);
            return right;
          }}
          onCancel={back}
          footer={
            <button
              type="button"
              className="btn btn-quiet btn-block"
              onClick={() => {
                setView({ name: 'forgot', profile: view.profile });
              }}
            >
              Glemt koden?
            </button>
          }
        />
      );
    case 'forgot':
      return (
        <ForgotPin
          onCorrect={() => {
            unlock(view.profile, { ...family, pin: null });
          }}
          onCancel={back}
        />
      );
    case 'manage':
      return (
        <ManageFamily
          family={family}
          onChange={save}
          onChangePin={() => {
            setView({
              name: 'set-pin',
              then: (pin) => {
                save({ ...family, pin });
                setView({ name: 'manage' });
              },
            });
          }}
          onDone={back}
        />
      );
    case 'add':
      return (
        <section className="family">
          <h1>Ny i familien</h1>
          <ProfileForm color={nextColor(family)} onSave={add} onCancel={back} />
        </section>
      );
    case 'list':
      return family.profiles.length === 0 ? (
        <section className="family">
          <h1>Velkommen til {appMeta.name}</h1>
          <p className="family-intro">
            Først et par ord om dig. Bagefter kan du tilføje resten af familien, også børnene.
          </p>
          <ProfileForm color={nextColor(family)} role="voksen" onSave={add} />
        </section>
      ) : (
        <PickProfile
          family={family}
          onPick={pick}
          onAdd={() => {
            setView({ name: 'add' });
          }}
          onManage={() => {
            setView({ name: 'manage' });
          }}
        />
      );
  }
}

interface PickProps {
  family: Family;
  onPick: (profile: Profile) => void;
  onAdd: () => void;
  onManage: () => void;
}

function PickProfile({ family, onPick, onAdd, onManage }: PickProps) {
  return (
    <section className="family">
      <h1>Hvem spiller?</h1>
      <ul className="family-grid">
        {family.profiles.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              className="family-pick"
              onClick={() => {
                onPick(profile);
              }}
            >
              <Avatar profile={profile} />
              <span className="family-pick-name">{profile.name}</span>
              {profile.role === 'voksen' && family.locked && family.pin && (
                <span className="family-pick-lock">Kode</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {!family.locked && (
        <div className="family-footer">
          <button type="button" className="btn btn-ghost btn-block" onClick={onAdd}>
            Tilføj en i familien
          </button>
          <button type="button" className="btn btn-quiet btn-block" onClick={onManage}>
            Rediger familien
          </button>
        </div>
      )}
    </section>
  );
}

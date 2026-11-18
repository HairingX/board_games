import { useState } from 'react';
import { appMeta } from '../appMeta';
import { Avatar } from './Avatar';
import { addProfile, nextColor, setPin, type Family, type PinHash, type Profile } from './family';
import { useFamily } from './FamilyContext';
import { ForgotPin } from './ForgotPin';
import { pinMatches } from './pin';
import { PinPad } from './PinPad';
import { PinSetup } from './PinSetup';
import { ProfileForm } from './ProfileForm';
import './family.css';

type View =
  | { name: 'list' }
  | { name: 'enter-pin'; profile: Profile; pin: PinHash }
  | { name: 'forgot'; profile: Profile }
  | { name: 'new-pin'; profile: Profile; family: Family };

const list: View = { name: 'list' };

/**
 * "Hvem spiller?", asked at every start. A profile with a code needs it, so children cannot
 * choose a grown-up. The first time, the first grown-up is made here; the rest of the family is
 * added by a grown-up from the home screen.
 */
export function WhoIsPlaying() {
  const { family, save, choose } = useFamily();
  const [view, setView] = useState<View>(list);
  const back = () => {
    setView(list);
  };

  /** Saves the family with the profile's new code, or none, and goes in as the profile. */
  function enterWith(profile: Profile, from: Family, pin: PinHash | null): void {
    save(setPin(from, profile.id, pin));
    choose({ ...profile, pin });
  }

  switch (view.name) {
    case 'enter-pin':
      return (
        <PinPad
          title={`Hej, ${view.profile.name}`}
          text="Skriv din kode."
          onEnter={async (pin) => {
            const right = await pinMatches(pin, view.pin);
            if (right) choose(view.profile);
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
            setView({ name: 'new-pin', profile: view.profile, family });
          }}
          onCancel={back}
        />
      );
    case 'new-pin':
      return (
        <PinSetup
          name={view.profile.name}
          onDone={(pin) => {
            enterWith(view.profile, view.family, pin);
          }}
          onCancel={back}
        />
      );
    case 'list':
      return family.profiles.length === 0 ? (
        <FirstGrownUp
          family={family}
          onDone={(profile, from) => {
            enterWith(profile, from, profile.pin);
          }}
        />
      ) : (
        <section className="family">
          <h1>Hvem spiller?</h1>
          <ul className="family-grid">
            {family.profiles.map((profile) => (
              <li key={profile.id}>
                <button
                  type="button"
                  className="family-pick"
                  onClick={() => {
                    if (profile.pin) setView({ name: 'enter-pin', profile, pin: profile.pin });
                    else choose(profile);
                  }}
                >
                  <Avatar profile={profile} />
                  <span className="family-pick-name">{profile.name}</span>
                  {profile.pin && <span className="family-pick-lock">Kode</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      );
  }
}

/** The first time: the first grown-up, and their code. */
function FirstGrownUp({
  family,
  onDone,
}: {
  family: Family;
  onDone: (profile: Profile, family: Family) => void;
}) {
  const [made, setMade] = useState<Profile>();

  return made ? (
    <PinSetup
      name={made.name}
      onDone={(pin) => {
        const profile = { ...made, pin };
        onDone(profile, addProfile(family, profile));
      }}
      onCancel={() => {
        setMade(undefined);
      }}
    />
  ) : (
    <section className="family">
      <h1>Velkommen til {appMeta.name}</h1>
      <p className="family-intro">
        Først et par ord om dig. Bagefter kan du tilføje resten af familien, også børnene.
      </p>
      <ProfileForm color={nextColor(family)} role="voksen" onSave={setMade} />
    </section>
  );
}

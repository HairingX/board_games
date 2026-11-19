import { useState, type ReactNode } from 'react';
import { appMeta } from '../appMeta';
import { useMessages } from '../i18n/I18n';
import { Avatar } from './Avatar';
import {
  addProfile,
  isLocked,
  newProfile,
  nextColor,
  setLock,
  type Family,
  type PinHash,
  type Profile,
} from './family';
import { useFamily } from './FamilyContext';
import { ForgotPin } from './ForgotPin';
import { pinMatches } from './pin';
import { PinPad } from './PinPad';
import { PinSetup } from './PinSetup';
import { ProfileForm } from './ProfileForm';
import { familyText } from './text';
import './family.css';

type View =
  | { name: 'list' }
  | { name: 'enter-lock'; profile: Profile; lock: PinHash }
  | { name: 'forgot'; profile: Profile }
  | { name: 'new-lock'; profile: Profile };

const list: View = { name: 'list' };

/**
 * "Hvem spiller?", under the start screen's header. Anyone may be chosen, unless the grown-ups'
 * lock is on: then choosing a grown-up asks for its code, on a screen of its own. The first
 * time, the first grown-up is made here; the rest of the family is added in the settings.
 */
export function WhoIsPlaying({ header }: { header?: ReactNode }) {
  const t = useMessages(familyText);
  const { family, save, choose } = useFamily();
  const [view, setView] = useState<View>(list);
  const back = () => {
    setView(list);
  };

  /** Saves the family with the lock changed, and goes in as the profile. */
  function enterWith(profile: Profile, lock: PinHash | null): void {
    save(setLock(family, lock));
    choose(profile);
  }

  switch (view.name) {
    case 'enter-lock':
      return (
        <PinPad
          title={view.profile.name}
          text={t.enterLock}
          onEnter={async (pin) => {
            const right = await pinMatches(pin, view.lock);
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
              {t.forgotPin}
            </button>
          }
        />
      );
    case 'forgot':
      return (
        <ForgotPin
          onCorrect={() => {
            setView({ name: 'new-lock', profile: view.profile });
          }}
          onCancel={back}
        />
      );
    case 'new-lock':
      return (
        <PinSetup
          onDone={(pin) => {
            enterWith(view.profile, pin);
          }}
          onCancel={back}
          footer={
            <button
              type="button"
              className="btn btn-quiet btn-block"
              onClick={() => {
                enterWith(view.profile, null);
              }}
            >
              {t.turnLockOff}
            </button>
          }
        />
      );
    case 'list':
      return family.profiles.length === 0 ? (
        <FirstGrownUp
          header={header}
          family={family}
          onDone={(profile) => {
            save(addProfile(family, profile));
            choose(profile);
          }}
        />
      ) : (
        <section className="family">
          {header}
          <h2 className="family-question">{t.whoIsPlaying}</h2>
          <ul className="family-grid">
            {family.profiles.map((profile) => {
              const locked = isLocked(family, profile);
              return (
                <li key={profile.id}>
                  <button
                    type="button"
                    className="family-pick"
                    onClick={() => {
                      if (family.lock && locked) {
                        setView({ name: 'enter-lock', profile, lock: family.lock });
                      } else {
                        choose(profile);
                      }
                    }}
                  >
                    <Avatar profile={profile} />
                    <span className="family-pick-name">{profile.name}</span>
                    {locked && <span className="family-pick-lock">{t.locked}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      );
  }
}

/** The first time: the first grown-up. */
function FirstGrownUp({
  header,
  family,
  onDone,
}: {
  header: ReactNode;
  family: Family;
  onDone: (profile: Profile) => void;
}) {
  const t = useMessages(familyText);
  return (
    <section className="family">
      {header}
      <h2 className="family-question">{t.welcome(appMeta.name)}</h2>
      <p className="family-intro">{t.firstIntro}</p>
      <ProfileForm
        start={{ name: '', role: 'voksen', color: nextColor(family) }}
        chooseRole={false}
        onSave={(values) => {
          onDone(newProfile(values));
        }}
      />
    </section>
  );
}

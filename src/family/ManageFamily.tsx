import { useState } from 'react';
import { formatLanguages } from '../i18n/format';
import { useLocale, useMessages } from '../i18n/I18n';
import { common } from '../ui/text';
import { Avatar } from './Avatar';
import {
  addProfile,
  newProfile,
  nextColor,
  removeProfile,
  setPin,
  updateProfile,
  type Family,
  type Profile,
} from './family';
import { PinSetup } from './PinSetup';
import { ProfileForm } from './ProfileForm';
import { familyText } from './text';
import './family.css';

interface Props {
  family: Family;
  /** The grown-up looking after the family, who cannot take themselves out. */
  current: Profile;
  onChange: (family: Family) => void;
  onDone: () => void;
}

type View =
  | { name: 'list' }
  | { name: 'add' }
  | { name: 'edit'; profile: Profile }
  | { name: 'pin'; profile: Profile };

/** Adding, changing and taking out the family's profiles, and their codes; for grown-ups. */
export function ManageFamily({ family, current, onChange, onDone }: Props) {
  const t = useMessages(familyText);
  const { cancel } = useMessages(common);
  const locale = useLocale();
  const [view, setView] = useState<View>({ name: 'list' });
  /** Whether the profile shown is about to be taken out, once confirmed. */
  const [leaving, setLeaving] = useState(false);
  const back = () => {
    setLeaving(false);
    setView({ name: 'list' });
  };

  if (view.name === 'add') {
    return (
      <section className="family">
        <h1>{t.newInFamily}</h1>
        <ProfileForm
          start={{ name: '', role: 'barn', color: nextColor(family), language: locale }}
          chooseRole
          onSave={(values) => {
            const profile = newProfile(values);
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

  if (view.name === 'edit') {
    const { profile } = view;
    const mayLeave = profile.id !== current.id && removeProfile(family, profile.id) !== family;
    return (
      <section className="family">
        <h1>{t.editProfile(profile.name)}</h1>
        <ProfileForm
          start={profile}
          chooseRole={false}
          onSave={(values) => {
            onChange(updateProfile(family, { ...profile, ...values }));
            back();
          }}
          onCancel={back}
        />
        <div className="family-footer">
          <button
            type="button"
            className="btn btn-ghost btn-block"
            aria-label={t.pinFor(profile.name)}
            onClick={() => {
              setView({ name: 'pin', profile });
            }}
          >
            {profile.pin ? t.changePin : t.pin}
          </button>
          {leaving ? (
            <div className="family-confirm" role="alertdialog" aria-label={t.remove(profile.name)}>
              <p>{t.removeQuestion(profile.name)}</p>
              <div className="family-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setLeaving(false);
                  }}
                >
                  {cancel}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onChange(removeProfile(family, profile.id));
                    back();
                  }}
                >
                  {t.yesRemove}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-quiet btn-block"
              disabled={!mayLeave}
              onClick={() => {
                setLeaving(true);
              }}
            >
              {t.remove(profile.name)}
            </button>
          )}
        </div>
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
      <h1>{t.family}</h1>
      <ul className="family-list">
        {family.profiles.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              className="family-row"
              onClick={() => {
                setView({ name: 'edit', profile });
              }}
            >
              <Avatar profile={profile} size="small" />
              <span className="family-row-name">
                {profile.name}{' '}
                <small>
                  {t.roles[profile.role]} · {formatLanguages(locale, [profile.language])}
                </small>
              </span>
              <span className="family-row-open" aria-hidden="true">
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="family-note">{t.familyNote}</p>

      <div className="family-footer">
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => {
            setView({ name: 'add' });
          }}
        >
          {t.addToFamily}
        </button>
        <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
          {t.done}
        </button>
      </div>
    </section>
  );
}

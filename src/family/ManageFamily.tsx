import { useState } from 'react';
import { useMessages } from '../i18n/I18n';
import { GameHeader } from '../ui/GameHeader';
import { common } from '../ui/text';
import { Avatar } from './Avatar';
import {
  addProfile,
  newProfile,
  nextColor,
  removeProfile,
  updateProfile,
  type Family,
  type Profile,
} from './family';
import { ProfileForm } from './ProfileForm';
import { familyText } from './text';
import './family.css';

interface Props {
  family: Family;
  /** The grown-up looking after the family, who cannot take themselves out. */
  current: Profile;
  onChange: (family: Family) => void;
  /** Goes back to the settings. */
  onBack: () => void;
}

type View = { name: 'list' } | { name: 'add' } | { name: 'edit'; profile: Profile };

/** The family's profiles: each opens to change its name and colour, or to take it out. */
export function ManageFamily({ family, current, onChange, onBack }: Props) {
  const t = useMessages(familyText);
  const { cancel } = useMessages(common);
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
        <GameHeader title={t.newInFamily} onBack={back} />
        <ProfileForm
          start={{ name: '', role: 'barn', color: nextColor(family) }}
          chooseRole
          onSave={(values) => {
            onChange(addProfile(family, newProfile(values)));
            back();
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
        <GameHeader title={t.editProfile(profile.name)} onBack={back} />
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

  return (
    <section className="family">
      <GameHeader title={t.family} onBack={onBack} />
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
                {profile.name} <small>{t.roles[profile.role]}</small>
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
      </div>
    </section>
  );
}

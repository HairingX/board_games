import { useState } from 'react';
import type { SettingsPage } from '../lib/router';
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
  /** Which of the family's pages is shown: the list, a new person, or one person. */
  page: Extract<SettingsPage, { name: 'family' | 'family-new' | 'person' }>;
  /** Goes to another page of the settings. */
  go: (page: SettingsPage) => void;
}

const list: SettingsPage = { name: 'family' };

/** The family's profiles: each opens to change its name and colour, or to take it out. */
export function ManageFamily({ family, current, onChange, page, go }: Props) {
  const t = useMessages(familyText);
  const back = () => {
    go(list);
  };

  if (page.name === 'family-new') {
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

  const person =
    page.name === 'person' ? family.profiles.find((profile) => profile.id === page.id) : undefined;
  if (person) {
    return (
      <Person
        key={person.id}
        profile={person}
        family={family}
        current={current}
        onChange={onChange}
        onBack={back}
      />
    );
  }

  return (
    <section className="family">
      <GameHeader
        title={t.family}
        onBack={() => {
          go({ name: 'main' });
        }}
      />
      <ul className="family-list">
        {family.profiles.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              className="family-row"
              onClick={() => {
                go({ name: 'person', id: profile.id });
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
            go({ name: 'family-new' });
          }}
        >
          {t.addToFamily}
        </button>
      </div>
    </section>
  );
}

/** One person: their name and colour to change, or a way to take them out of the family. */
function Person({
  profile,
  family,
  current,
  onChange,
  onBack,
}: {
  profile: Profile;
  family: Family;
  current: Profile;
  onChange: (family: Family) => void;
  onBack: () => void;
}) {
  const t = useMessages(familyText);
  const { cancel } = useMessages(common);
  /** Whether the person is about to be taken out, once confirmed. */
  const [leaving, setLeaving] = useState(false);
  const mayLeave = profile.id !== current.id && removeProfile(family, profile.id) !== family;

  return (
    <section className="family">
      <GameHeader title={t.editProfile(profile.name)} onBack={onBack} />
      <ProfileForm
        start={profile}
        chooseRole={false}
        onSave={(values) => {
          onChange(updateProfile(family, { id: profile.id, ...values }));
          onBack();
        }}
        onCancel={onBack}
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
                  onBack();
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

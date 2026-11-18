import { useId, useState } from 'react';
import { useMessages } from '../i18n/I18n';
import { common } from '../ui/text';
import { profileColors, type Profile, type ProfileColor, type Role } from './family';
import { familyText } from './text';

interface Props {
  /** The colour suggested for the new profile. */
  color: ProfileColor;
  /** The role, when the form may not change it; otherwise it is chosen in the form. */
  role?: Role;
  onSave: (profile: Profile) => void;
  onCancel?: () => void;
}

/** A new profile: a name, grown-up or child, and a colour. */
export function ProfileForm({ color: suggested, role: fixedRole, onSave, onCancel }: Props) {
  const t = useMessages(familyText);
  const { cancel } = useMessages(common);
  const nameId = useId();
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(fixedRole ?? 'barn');
  const [color, setColor] = useState(suggested);
  const trimmed = name.trim();

  return (
    <form
      className="profile-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ id: crypto.randomUUID(), name: trimmed, role, color, pin: null });
      }}
    >
      <label htmlFor={nameId}>{t.name}</label>
      <input
        id={nameId}
        className="profile-name"
        value={name}
        maxLength={20}
        autoComplete="off"
        onChange={(event) => {
          setName(event.target.value);
        }}
      />

      {!fixedRole && (
        <div className="profile-roles" role="radiogroup" aria-label={t.roleChoice}>
          {(['voksen', 'barn'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={role === option}
              onClick={() => {
                setRole(option);
              }}
            >
              {t.roles[option]}
            </button>
          ))}
        </div>
      )}

      <div className="profile-colors" role="radiogroup" aria-label={t.color}>
        {profileColors.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={color === option}
            aria-label={t.colors[option]}
            className="profile-color"
            style={{ background: `var(--profile-${option})` }}
            onClick={() => {
              setColor(option);
            }}
          />
        ))}
      </div>

      <div className="family-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancel}
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={trimmed === ''}>
          {t.save}
        </button>
      </div>
    </form>
  );
}

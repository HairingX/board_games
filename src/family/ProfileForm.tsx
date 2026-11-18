import { useId, useState } from 'react';
import { colorNames, profileColors, type Profile, type ProfileColor, type Role } from './family';

interface Props {
  /** The colour suggested for the new profile. */
  color: ProfileColor;
  /** The role, when the form may not change it; otherwise it is chosen in the form. */
  role?: Role;
  onSave: (profile: Profile) => void;
  onCancel?: () => void;
}

const roleNames: Readonly<Record<Role, string>> = { voksen: 'Voksen', barn: 'Barn' };

/** A new profile: a name, grown-up or child, and a colour. */
export function ProfileForm({ color: suggested, role: fixedRole, onSave, onCancel }: Props) {
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
      <label htmlFor={nameId}>Navn</label>
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
        <div className="profile-roles" role="radiogroup" aria-label="Voksen eller barn">
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
              {roleNames[option]}
            </button>
          ))}
        </div>
      )}

      <div className="profile-colors" role="radiogroup" aria-label="Farve">
        {profileColors.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={color === option}
            aria-label={colorNames[option]}
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
            Annullér
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={trimmed === ''}>
          Gem
        </button>
      </div>
    </form>
  );
}

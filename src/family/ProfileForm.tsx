import { useId, useState } from 'react';
import { useMessages } from '../i18n/I18n';
import { common } from '../ui/text';
import { isBirthday } from './age';
import { profileColors, type Picture, type ProfileValues, type Role } from './family';
import { PicturePicker } from './PicturePicker';
import { familyText } from './text';

interface Props {
  /** What the form starts with: a new profile's suggestions, or the profile being changed. */
  start: ProfileValues;
  /** Whether the role is chosen in the form; otherwise it stays as it starts. */
  chooseRole: boolean;
  onSave: (values: ProfileValues) => void;
  onCancel?: () => void;
}

/** A profile's name, whether it is a grown-up or a child, its colour and its picture. */
export function ProfileForm({ start, chooseRole, onSave, onCancel }: Props) {
  const t = useMessages(familyText);
  const { cancel } = useMessages(common);
  const nameId = useId();
  const bornId = useId();
  const bornNoteId = useId();
  const [name, setName] = useState(start.name);
  const [role, setRole] = useState<Role>(start.role);
  const [color, setColor] = useState(start.color);
  const [picture, setPicture] = useState<Picture | undefined>(start.picture);
  const [born, setBorn] = useState(start.born ?? '');
  const trimmed = name.trim();

  return (
    <form
      className="profile-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          name: trimmed,
          role,
          color,
          ...(picture ? { picture } : {}),
          ...(isBirthday(born) ? { born } : {}),
        });
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

      {chooseRole && (
        <div className="segmented" role="radiogroup" aria-label={t.roleChoice}>
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

      <PicturePicker name={name} color={color} picture={picture} onChange={setPicture} />

      <label htmlFor={bornId} className="profile-born-label">
        {t.born}
      </label>
      <input
        id={bornId}
        className="profile-name profile-born"
        type="date"
        value={born}
        max={today()}
        aria-describedby={bornNoteId}
        onChange={(event) => {
          setBorn(event.target.value);
        }}
      />
      <p id={bornNoteId} className="profile-note">
        {t.bornNote}
      </p>

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

/** Today as a day the date field takes: "2026-11-19", in the phone's own time. */
function today(): string {
  const now = new Date();
  const two = (value: number) => String(value).padStart(2, '0');
  return `${String(now.getFullYear())}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

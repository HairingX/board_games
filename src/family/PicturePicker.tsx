import { useId, useRef } from 'react';
import { useMessages } from '../i18n/I18n';
import { faces } from './faces';
import type { Picture, ProfileColor } from './family';
import { squarePhoto } from './photo';
import { familyText } from './text';

interface Props {
  /** The profile's name, whose initial is one choice. */
  name: string;
  color: ProfileColor;
  picture: Picture | undefined;
  onChange: (picture: Picture | undefined) => void;
}

/**
 * The profile's picture: its initial, one of the app's faces, or a photo from the phone, in a
 * row that scrolls sideways.
 */
export function PicturePicker({ name, color, picture, onChange }: Props) {
  const t = useMessages(familyText);
  const labelId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const background = { background: `var(--profile-${color})` };

  return (
    <div className="picture-picker">
      <span id={labelId} className="picture-label">
        {t.picture}
      </span>
      <div className="picture-row" role="radiogroup" aria-labelledby={labelId}>
        <button
          type="button"
          className="picture-option picture-upload"
          onClick={() => {
            fileInput.current?.click();
          }}
        >
          <CameraIcon />
          <span className="visually-hidden">{t.ownPhoto}</span>
        </button>
        {picture?.kind === 'photo' && (
          <button
            type="button"
            role="radio"
            aria-checked="true"
            aria-label={t.yourPhoto}
            className="picture-option"
          >
            <img src={picture.src} alt="" />
          </button>
        )}
        <button
          type="button"
          role="radio"
          aria-checked={picture === undefined}
          aria-label={t.initial}
          className="picture-option picture-initial"
          style={background}
          onClick={() => {
            onChange(undefined);
          }}
        >
          {name.trim().slice(0, 1).toUpperCase() || '?'}
        </button>
        {[...faces].map(([face, src], index) => (
          <button
            key={face}
            type="button"
            role="radio"
            aria-checked={picture?.kind === 'face' && picture.face === face}
            aria-label={t.face(index + 1)}
            className="picture-option picture-face"
            onClick={() => {
              onChange({ kind: 'face', face });
            }}
          >
            <img src={src} alt="" />
          </button>
        ))}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        aria-label={t.ownPhoto}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) {
            void squarePhoto(file)
              .then((src) => {
                onChange({ kind: 'photo', src });
              })
              .catch(() => undefined);
          }
        }}
      />
    </div>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.2" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

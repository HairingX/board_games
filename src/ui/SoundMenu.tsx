import { useId, useState } from 'react';
import { formatPercent } from '../i18n/format';
import { useLocale, useMessages } from '../i18n/I18n';
import type { SoundSettings } from '../lib/sound/engine';
import { common } from './text';
import './SoundMenu.css';

interface Props {
  settings: SoundSettings;
  onChange: (settings: SoundSettings) => void;
}

/**
 * A speaker in a game's header that opens how loud the music and the sound effects play, each
 * on its own slider, as games offer, so either can be turned down or off in the middle of
 * playing. Each sound already has its place in the mix; these turn the whole up or down.
 */
export function SoundMenu({ settings, onChange }: Props) {
  const t = useMessages(common);
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <div className="sound-menu">
      <button
        type="button"
        className="game-header-button"
        aria-label={t.sound}
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => {
          setOpen(!open);
        }}
      >
        <Speaker />
      </button>
      {open && (
        <div id={panel} className="sound-menu-panel" role="group" aria-label={t.sound}>
          <Level
            label={t.music}
            value={settings.music}
            onChange={(music) => {
              onChange({ ...settings, music });
            }}
          />
          <Level
            label={t.effects}
            value={settings.effects}
            onChange={(effects) => {
              onChange({ ...settings, effects });
            }}
          />
        </div>
      )}
    </div>
  );
}

/** One level, from off to as mixed, in steps of a tenth. */
function Level({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const locale = useLocale();
  const id = useId();
  const shown = formatPercent(locale, Math.round(value * 100));
  return (
    <div className="sound-level">
      <label htmlFor={id}>
        {label} <span>{shown}</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={10}
        value={Math.round(value * 100)}
        aria-valuetext={shown}
        onChange={(event) => {
          onChange(Number(event.target.value) / 100);
        }}
      />
    </div>
  );
}

/** A speaker with sound coming out of it. */
function Speaker() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z M15.5 9a4 4 0 0 1 0 6 M18 6.5a7.5 7.5 0 0 1 0 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

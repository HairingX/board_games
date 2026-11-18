import { useState } from 'react';
import { useMessages } from '../i18n/I18n';
import { GameHeader } from '../ui/GameHeader';
import { setLock, type Family } from './family';
import { PinSetup } from './PinSetup';
import { familyText } from './text';
import './family.css';

interface Props {
  family: Family;
  onChange: (family: Family) => void;
  /** Goes back to the settings. */
  onBack: () => void;
}

/** The grown-ups' lock: off until a grown-up turns it on with a code of their choosing. */
export function AdultLock({ family, onChange, onBack }: Props) {
  const t = useMessages(familyText);
  const [choosing, setChoosing] = useState(false);
  const stop = () => {
    setChoosing(false);
  };

  if (choosing) {
    return (
      <PinSetup
        onDone={(pin) => {
          onChange(setLock(family, pin));
          stop();
        }}
        onCancel={stop}
      />
    );
  }

  const on = family.lock !== null;
  return (
    <section className="family">
      <GameHeader title={t.lock} onBack={onBack} aside={on ? t.lockOn : t.lockOff} />
      <p className="family-intro">{t.lockWhy(t.whoIsPlaying)}</p>
      <div className="family-footer">
        <button
          type="button"
          className={on ? 'btn btn-ghost btn-block' : 'btn btn-primary btn-block'}
          onClick={() => {
            setChoosing(true);
          }}
        >
          {on ? t.changeLock : t.turnLockOn}
        </button>
        {on && (
          <button
            type="button"
            className="btn btn-quiet btn-block"
            onClick={() => {
              onChange(setLock(family, null));
            }}
          >
            {t.turnLockOff}
          </button>
        )}
      </div>
    </section>
  );
}

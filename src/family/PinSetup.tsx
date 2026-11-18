import { useState } from 'react';
import { useMessages } from '../i18n/I18n';
import type { PinHash } from './family';
import { hashPin } from './pin';
import { PinPad } from './PinPad';
import { familyText } from './text';

interface Props {
  /** Whose code it is, said in the explanation. */
  name: string;
  /** Called with the new code, or with null when the profile is to have none. */
  onDone: (pin: PinHash | null) => void;
  onCancel: () => void;
}

/** Choosing a profile's code: typed twice, so a slip of the finger is caught; or none. */
export function PinSetup({ name, onDone, onCancel }: Props) {
  const t = useMessages(familyText);
  const [first, setFirst] = useState<string>();
  const [mismatch, setMismatch] = useState(false);

  return first === undefined ? (
    <PinPad
      key="first"
      title={t.pinFor(name)}
      text={mismatch ? t.pinMismatch : t.pinWhy(name, t.whoIsPlaying)}
      onEnter={(pin) => {
        setFirst(pin);
        return true;
      }}
      onCancel={onCancel}
      footer={
        <button
          type="button"
          className="btn btn-quiet btn-block"
          onClick={() => {
            onDone(null);
          }}
        >
          {t.noPin}
        </button>
      }
    />
  ) : (
    <PinPad
      key="again"
      title={t.pinAgain}
      text={t.pinTip}
      onEnter={async (pin) => {
        if (pin !== first) {
          setFirst(undefined);
          setMismatch(true);
          return true;
        }
        onDone(await hashPin(pin));
        return true;
      }}
      onCancel={onCancel}
    />
  );
}

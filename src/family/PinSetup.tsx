import { useState, type ReactNode } from 'react';
import { useMessages } from '../i18n/I18n';
import type { PinHash } from './family';
import { hashPin } from './pin';
import { PinPad } from './PinPad';
import { familyText } from './text';

interface Props {
  /** Called with the new code, kept only as a salted hash. */
  onDone: (pin: PinHash) => void;
  onCancel: () => void;
  /** Shown under the keys the first time, such as a way to turn the lock off. */
  footer?: ReactNode;
}

/** Choosing the grown-ups' code: typed twice, so a slip of the finger is caught. */
export function PinSetup({ onDone, onCancel, footer }: Props) {
  const t = useMessages(familyText);
  const [first, setFirst] = useState<string>();
  const [mismatch, setMismatch] = useState(false);

  return first === undefined ? (
    <PinPad
      key="first"
      title={t.chooseLock}
      text={mismatch ? t.pinMismatch : t.chooseLockWhy}
      onEnter={(pin) => {
        setFirst(pin);
        return true;
      }}
      onCancel={onCancel}
      footer={footer}
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

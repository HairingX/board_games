import { useState } from 'react';
import type { PinHash } from './family';
import { hashPin } from './pin';
import { PinPad } from './PinPad';

interface Props {
  onDone: (pin: PinHash) => void;
  onCancel: () => void;
}

/** Choosing the code: typed twice, so a slip of the finger is caught. */
export function PinSetup({ onDone, onCancel }: Props) {
  const [first, setFirst] = useState<string>();
  const [mismatch, setMismatch] = useState(false);

  return first === undefined ? (
    <PinPad
      key="first"
      title="Vælg en kode"
      text={
        mismatch
          ? 'Koderne var ikke ens. Vælg koden igen.'
          : 'Når et barn spiller, skal de voksne bruge koden for at komme tilbage. Vælg fire cifre, som børnene ikke kender.'
      }
      onEnter={(pin) => {
        setFirst(pin);
        return true;
      }}
      onCancel={onCancel}
    />
  ) : (
    <PinPad
      key="again"
      title="Skriv koden igen"
      text="Tip: Med »Guidet adgang« på iPhone eller »Fastgør app« på Android kan børnene heller ikke forlade appen."
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

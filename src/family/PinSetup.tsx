import { useState } from 'react';
import type { PinHash } from './family';
import { hashPin } from './pin';
import { PinPad } from './PinPad';

interface Props {
  /** Whose code it is, said in the explanation. */
  name: string;
  /** Called with the new code, or with null when the profile is to have none. */
  onDone: (pin: PinHash | null) => void;
  onCancel: () => void;
}

/** Choosing a profile's code: typed twice, so a slip of the finger is caught; or none. */
export function PinSetup({ name, onDone, onCancel }: Props) {
  const [first, setFirst] = useState<string>();
  const [mismatch, setMismatch] = useState(false);

  return first === undefined ? (
    <PinPad
      key="first"
      title={`Kode til ${name}`}
      text={
        mismatch
          ? 'Koderne var ikke ens. Vælg koden igen.'
          : `Koden skal tastes, når ${name} vælges på »Hvem spiller?«. Vælg fire cifre, som børnene ikke kender.`
      }
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
          Ingen kode
        </button>
      }
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

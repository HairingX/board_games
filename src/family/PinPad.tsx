import { useState, type ReactNode } from 'react';
import { useMessages } from '../i18n/I18n';
import { common } from '../ui/text';
import { pinLength } from './pin';
import { familyText } from './text';

interface Props {
  title: string;
  /** Said under the title, such as why the code is asked for. */
  text?: string;
  /** Called with the four digits; resolves to false to say they were wrong and start again. */
  onEnter: (pin: string) => Promise<boolean> | boolean;
  onCancel: () => void;
  /** Shown under the keys, such as "Glemt koden?". */
  footer?: ReactNode;
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const;

/** A keypad for a four-digit code, as a phone's lock screen has. */
export function PinPad({ title, text, onEnter, onCancel, footer }: Props) {
  const t = useMessages(familyText);
  const { cancel } = useMessages(common);
  const [digits, setDigits] = useState('');
  const [wrong, setWrong] = useState(false);

  async function press(key: string): Promise<void> {
    if (key === '⌫') {
      setDigits(digits.slice(0, -1));
      return;
    }
    const next = digits + key;
    setWrong(false);
    if (next.length < pinLength) {
      setDigits(next);
      return;
    }
    setDigits('');
    if (!(await onEnter(next))) setWrong(true);
  }

  return (
    <section className="pin" aria-labelledby="pin-title">
      <h1 id="pin-title">{title}</h1>
      {text && <p className="pin-text">{text}</p>}
      <div className="pin-dots" aria-label={t.pinTyped(digits.length, pinLength)}>
        {Array.from({ length: pinLength }, (_, index) => (
          <span key={index} className={index < digits.length ? 'on' : ''} />
        ))}
      </div>
      <p className="pin-wrong" role="alert">
        {wrong ? t.wrongPin : ''}
      </p>
      <div className="pin-keys">
        {keys.map((key, index) =>
          key === '' ? (
            <span key={index} />
          ) : (
            <button
              key={key}
              type="button"
              className="pin-key"
              aria-label={key === '⌫' ? t.deleteDigit : key}
              disabled={key === '⌫' && digits.length === 0}
              onClick={() => void press(key)}
            >
              {key}
            </button>
          ),
        )}
      </div>
      {footer}
      <button type="button" className="btn btn-quiet btn-block" onClick={onCancel}>
        {cancel}
      </button>
    </section>
  );
}

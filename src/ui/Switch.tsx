import './Switch.css';

interface Props {
  label: string;
  /** Said under the label, such as what the switch does. */
  note?: string;
  on: boolean;
  onChange: (on: boolean) => void;
}

/** A setting that is on or off, as a phone's own switch: the whole row can be tapped. */
export function Switch({ label, note, on, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className="switch"
      onClick={() => {
        onChange(!on);
      }}
    >
      <span className="switch-text">
        {label}
        {note && <small>{note}</small>}
      </span>
      <span className="switch-track" aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  );
}

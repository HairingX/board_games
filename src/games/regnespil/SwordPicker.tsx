import { useMessages } from '../../i18n/I18n';
import { swordPictures } from './art';
import { swordRules, swords, type Sword } from './swords';
import { text } from './text';
import './regnespil.css';

/** How hard a player's fights are, chosen as one of three swords with one to three stars. */
export function SwordPicker({
  name,
  sword,
  onChange,
}: {
  /** Whose sword it is. */
  name: string;
  sword: Sword;
  onChange: (sword: Sword) => void;
}) {
  const t = useMessages(text);
  return (
    <div className="sword-picker" role="radiogroup" aria-label={t.swordOf(name)}>
      {swords.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={sword === option}
          onClick={() => {
            onChange(option);
          }}
        >
          <img src={swordPictures[option]} alt="" className="sword-picture" />
          <span className="sword-stars" aria-hidden="true">
            {'★'.repeat(swordRules[option].stars)}
          </span>
          <span>{t.swords[option]}</span>
        </button>
      ))}
    </div>
  );
}

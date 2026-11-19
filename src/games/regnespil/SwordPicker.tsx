import wood from '../../../assets/ninja-adventure/Items/Weapons/Club/Sprite.png';
import flame from '../../../assets/ninja-adventure/Items/Weapons/Sword/Sprite.png';
import iron from '../../../assets/ninja-adventure/Items/Weapons/Sword2/Sprite.png';
import { useMessages } from '../../i18n/I18n';
import { swordRules, swords, type Sword } from './swords';
import { text } from './text';
import './regnespil.css';

/** Each sword's picture from the pack: a wooden club, an iron sword, and a red flame sword. */
const pictures: Readonly<Record<Sword, string>> = { træ: wood, jern: iron, flamme: flame };

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
          <img src={pictures[option]} alt="" className="sword-picture" />
          <span className="sword-stars" aria-hidden="true">
            {'★'.repeat(swordRules[option].stars)}
          </span>
          <span>{t.swords[option]}</span>
        </button>
      ))}
    </div>
  );
}

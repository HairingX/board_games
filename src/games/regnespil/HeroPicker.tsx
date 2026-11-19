import { useEffect, useRef } from 'react';
import { useMessages } from '../../i18n/I18n';
import { heroes, heroFaces, type Hero } from './heroes';
import { text } from './text';
import './regnespil.css';

/** Which hero a player is in the adventure, chosen by their portraits, in a row to scroll. */
export function HeroPicker({
  name,
  hero,
  onChange,
}: {
  /** Whose hero it is. */
  name: string;
  hero: Hero;
  onChange: (hero: Hero) => void;
}) {
  const t = useMessages(text);
  const row = useRef<HTMLDivElement>(null);
  // The hero chosen is scrolled into sight when the row first shows, wherever it is in it.
  useEffect(() => {
    // The row is drawn by now, and always holds the hero chosen.
    const box = row.current as HTMLDivElement;
    const chosen = box.querySelector('[aria-checked="true"]') as HTMLElement;
    box.scrollLeft = chosen.offsetLeft - box.offsetLeft;
  }, []);
  return (
    <div ref={row} className="hero-picker" role="radiogroup" aria-label={t.heroOf(name)}>
      {heroes.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={hero === option}
          aria-label={t.heroes[option]}
          onClick={() => {
            onChange(option);
          }}
        >
          <img src={heroFaces[option]} alt="" className="hero-face" />
        </button>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { AdultLock } from '../family/AdultLock';
import type { Family, Profile } from '../family/family';
import { ManageFamily } from '../family/ManageFamily';
import { familyText } from '../family/text';
import { useMessages } from '../i18n/I18n';
import { betaSaveKey, reviveBeta } from '../lib/beta';
import { useSaved } from '../lib/useSaved';
import { GameHeader } from '../ui/GameHeader';
import { LanguageSelect } from '../ui/LanguageSelect';
import { Switch } from '../ui/Switch';
import { SoundLab } from './beta/SoundLab';
import { labText } from './beta/text';
import { SavedGames } from './SavedGames';
import { appText } from './text';
import '../family/family.css';
import './Settings.css';

interface Props {
  family: Family;
  /** The grown-up in the settings. */
  current: Profile;
  onChange: (family: Family) => void;
  /** Goes back to the home screen. */
  onBack: () => void;
}

/**
 * Everything for grown-ups in one place, away from the home screen: the app's language, the
 * family, the grown-ups' lock, how the games are saved, and beta, which shows test pages for
 * the parts still being built.
 */
export function Settings({ family, current, onChange, onBack }: Props) {
  const t = useMessages(appText);
  const f = useMessages(familyText);
  const lab = useMessages(labText);
  const [beta, setBeta] = useSaved(betaSaveKey, reviveBeta);
  const [page, setPage] = useState<'main' | 'family' | 'lock' | 'sound'>('main');
  const toMain = () => {
    setPage('main');
  };

  if (page === 'family') {
    return <ManageFamily family={family} current={current} onChange={onChange} onBack={toMain} />;
  }
  if (page === 'lock') {
    return <AdultLock family={family} onChange={onChange} onBack={toMain} />;
  }
  if (page === 'sound') {
    return <SoundLab onBack={toMain} />;
  }

  return (
    <section className="family">
      <GameHeader title={t.settings} onBack={onBack} />
      <div className="panel">
        <LanguageSelect />
      </div>
      <ul className="family-list">
        <li>
          <button
            type="button"
            className="family-row"
            onClick={() => {
              setPage('family');
            }}
          >
            <span className="family-row-name">
              {f.family} <small>{f.people(family.profiles.length)}</small>
            </span>
            <span className="family-row-open" aria-hidden="true">
              ›
            </span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="family-row"
            onClick={() => {
              setPage('lock');
            }}
          >
            <span className="family-row-name">
              {f.lock} <small>{family.lock ? f.lockOn : f.lockOff}</small>
            </span>
            <span className="family-row-open" aria-hidden="true">
              ›
            </span>
          </button>
        </li>
      </ul>
      <SavedGames />
      <div className="settings-beta">
        <Switch label={t.beta} note={t.betaNote} on={beta === true} onChange={setBeta} />
        {beta && (
          <ul className="family-list">
            <li>
              <button
                type="button"
                className="family-row"
                onClick={() => {
                  setPage('sound');
                }}
              >
                <span className="family-row-name">
                  {lab.title} <small>{t.testPage}</small>
                </span>
                <span className="family-row-open" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}

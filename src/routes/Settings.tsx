import { AdultLock } from '../family/AdultLock';
import type { Family, Profile } from '../family/family';
import { ManageFamily } from '../family/ManageFamily';
import { familyText } from '../family/text';
import { useMessages } from '../i18n/I18n';
import { betaSaveKey, reviveBeta } from '../lib/beta';
import type { SettingsPage } from '../lib/router';
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
  /** The page of the settings shown. */
  page: SettingsPage;
  /** Goes to another page of the settings. */
  go: (page: SettingsPage) => void;
  /** Goes back to the home screen. */
  onBack: () => void;
}

/**
 * Everything for grown-ups in one place, away from the home screen: the app's language, the
 * family, the grown-ups' lock, how the games are saved, and beta, which shows test pages for
 * the parts still being built.
 */
export function Settings({ family, current, onChange, page, go, onBack }: Props) {
  const t = useMessages(appText);
  const f = useMessages(familyText);
  const lab = useMessages(labText);
  const [beta, setBeta] = useSaved(betaSaveKey, reviveBeta);
  const toMain = () => {
    go({ name: 'main' });
  };

  switch (page.name) {
    case 'family':
    case 'family-new':
    case 'person':
      return (
        <ManageFamily family={family} current={current} onChange={onChange} page={page} go={go} />
      );
    case 'lock':
      return <AdultLock family={family} onChange={onChange} onBack={toMain} />;
    case 'sound':
      return <SoundLab onBack={toMain} />;
    case 'main':
      break;
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
              go({ name: 'family' });
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
              go({ name: 'lock' });
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
                  go({ name: 'sound' });
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

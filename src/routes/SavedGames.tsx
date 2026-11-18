import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { appMeta } from '../appMeta';
import { useMessages } from '../i18n/I18n';
import { backupFileName, makeBackup, readBackup, restoreBackup, type Backup } from '../lib/backup';
import { useInstall } from '../lib/install';
import { isInstalled, savesAreKept } from '../lib/persistence';
import { saves as defaultSaves, type Saves } from '../lib/saves';
import { common } from '../ui/text';
import { appText } from './text';
import './SavedGames.css';

/** How long a backup's download link lives: Safari cancels a download whose link goes too soon. */
const downloadLinkLifetime = 60_000;

function download(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, downloadLinkLifetime);
}

/**
 * How safely the games are saved on this device, how to save them more safely, and a backup
 * to keep elsewhere or move the games to another browser or phone.
 */
export function SavedGames({ saves = defaultSaves }: { saves?: Saves }) {
  const t = useMessages(appText);
  const { cancel } = useMessages(common);
  const install = useInstall();
  const [installed] = useState(isInstalled);
  const [kept, setKept] = useState(false);
  const [pending, setPending] = useState<Backup>();
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let current = true;
    void savesAreKept().then((value) => {
      if (current) setKept(value);
    });
    return () => {
      current = false;
    };
  }, []);

  async function saveBackup(): Promise<void> {
    const now = new Date();
    download(backupFileName(now), JSON.stringify(await makeBackup(saves, now), null, 2));
    setMessage(t.backupSaved);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const backup = readBackup(await file.text());
    setPending(backup);
    setMessage(backup ? '' : t.notBackup(appMeta.name));
  }

  async function restore(backup: Backup): Promise<void> {
    await restoreBackup(saves, backup);
    setPending(undefined);
    setMessage(t.restored(new Date(backup.madeAt)));
  }

  return (
    <section className="panel saved" aria-labelledby="saved-title">
      <h2 id="saved-title">{t.savedTitle}</h2>

      {kept ? (
        <p>{t.kept}</p>
      ) : installed ? (
        <p>{t.installed}</p>
      ) : (
        <>
          <p>{t.inBrowser(appMeta.name)}</p>
          {install ? (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => void install()}
            >
              {t.install}
            </button>
          ) : (
            <p className="saved-steps">{t.installSteps}</p>
          )}
        </>
      )}

      <div className="saved-backup">
        <button type="button" className="btn btn-ghost" onClick={() => void saveBackup()}>
          {t.saveBackup}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            fileInput.current?.click();
          }}
        >
          {t.restoreBackup}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label={t.chooseBackup}
          onChange={(event) => void chooseFile(event)}
        />
      </div>

      {pending && (
        <div className="saved-confirm" role="alertdialog" aria-label={t.restoreBackup}>
          <p>{t.restoreQuestion(new Date(pending.madeAt))}</p>
          <div className="saved-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setPending(undefined);
              }}
            >
              {cancel}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void restore(pending)}>
              {t.yesRestore}
            </button>
          </div>
        </div>
      )}

      <p className="saved-message" role="status">
        {message}
      </p>
    </section>
  );
}

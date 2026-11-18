import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { appMeta } from '../appMeta';
import { backupFileName, makeBackup, readBackup, restoreBackup, type Backup } from '../lib/backup';
import { useInstall } from '../lib/install';
import { isInstalled, savesAreKept } from '../lib/persistence';
import { saves as defaultSaves, type Saves } from '../lib/saves';
import './SavedGames.css';

/** How long a backup's download link lives: Safari cancels a download whose link goes too soon. */
const downloadLinkLifetime = 60_000;

const longDate = new Intl.DateTimeFormat('da', { dateStyle: 'long' });

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
    setMessage('Sikkerhedskopien er gemt som en fil.');
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const backup = readBackup(await file.text());
    setPending(backup);
    setMessage(backup ? '' : `Filen er ikke en sikkerhedskopi fra ${appMeta.name}.`);
  }

  async function restore(backup: Backup): Promise<void> {
    await restoreBackup(saves, backup);
    setPending(undefined);
    setMessage(`Sikkerhedskopien fra ${longDate.format(new Date(backup.madeAt))} er hentet.`);
  }

  return (
    <section className="saved" aria-labelledby="saved-title">
      <h2 id="saved-title">Jeres gemte spil</h2>

      {kept ? (
        <p>✓ Telefonen gemmer jeres spil sikkert, også når der bliver trangt om pladsen.</p>
      ) : installed ? (
        <p>Jeres spil gemmes på telefonen, hver gang I vender et kort.</p>
      ) : (
        <>
          <p>
            Jeres spil gemmes i browseren. Føj {appMeta.name} til hjemmeskærmen, så gemmes de mere
            sikkert, og alt virker uden internet.
          </p>
          {install ? (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => void install()}
            >
              Føj til hjemmeskærmen
            </button>
          ) : (
            <p className="saved-steps">
              På iPhone og iPad: Tryk på Del-knappen, og vælg »Føj til hjemmeskærm«. I andre
              browsere finder du det i menuen. På iPhone har appen sine egne gemte spil, så tag en
              sikkerhedskopi her, og hent den i appen.
            </p>
          )}
        </>
      )}

      <div className="saved-backup">
        <button type="button" className="btn btn-ghost" onClick={() => void saveBackup()}>
          Gem sikkerhedskopi
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            fileInput.current?.click();
          }}
        >
          Hent sikkerhedskopi
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Vælg sikkerhedskopi"
          onChange={(event) => void chooseFile(event)}
        />
      </div>

      {pending && (
        <div className="saved-confirm" role="alertdialog" aria-label="Hent sikkerhedskopi">
          <p>
            Kopien fra {longDate.format(new Date(pending.madeAt))} erstatter de spil, der er gemt
            her nu. Er I sikre?
          </p>
          <div className="saved-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setPending(undefined);
              }}
            >
              Annullér
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void restore(pending)}>
              Ja, hent kopien
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

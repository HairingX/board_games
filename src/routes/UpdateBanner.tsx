import { appMeta } from '../appMeta';
import { useMessages } from '../i18n/I18n';
import { appText } from './text';
import './UpdateBanner.css';

/** A note that a new version of the app is ready, with the button that loads it. */
export function UpdateBanner({ onUpdate }: { onUpdate: () => void }) {
  const t = useMessages(appText);
  return (
    <div className="update" role="status">
      <span>{t.newVersion(appMeta.name)}</span>
      <button type="button" className="btn btn-primary" onClick={onUpdate}>
        {t.update}
      </button>
    </div>
  );
}

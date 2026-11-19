import { motion } from 'motion/react';
import { useMessages } from '../i18n/I18n';
import { motionTokens } from '../ui/motion';
import { appText } from './text';
import './UpdateToast.css';

/**
 * A note that a new version of the app is ready, with the button that loads it. It rises from
 * the bottom of the screen over the page, as phones show such notes, so nothing on the page
 * moves when it comes; the page keeps room for it at its end.
 */
export function UpdateToast({ onUpdate }: { onUpdate: () => void }) {
  const t = useMessages(appText);
  return (
    <>
      {/* Room at the end of the page, so the note never hides the last thing on it. */}
      <div className="update-toast-room" aria-hidden="true" />
      <motion.div
        className="update-toast"
        role="status"
        initial={{ opacity: 0, y: motionTokens.toast.rise }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTokens.arrive}
      >
        <span>{t.newVersion}</span>
        <button type="button" className="btn update-toast-button" onClick={onUpdate}>
          {t.update}
        </button>
      </motion.div>
    </>
  );
}

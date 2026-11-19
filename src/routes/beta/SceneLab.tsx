import { useMessages } from '../../i18n/I18n';
import { GameHeader } from '../../ui/GameHeader';
import { SceneCanvas } from '../../ui/SceneCanvas';
import { forest, forestSheets } from './forest';
import { labText } from './text';
import './beta.css';

/** The puppet theatre's first scene to try: a forest clearing, with the hero breathing. */
export function SceneLab({ onBack }: { onBack: () => void }) {
  const t = useMessages(labText);
  return (
    <section className="family lab">
      <GameHeader title={t.sceneTitle} onBack={onBack} />
      <p className="family-intro">{t.sceneIntro}</p>
      <SceneCanvas scene={forest} sheets={forestSheets} label={t.sceneLabel} />
    </section>
  );
}

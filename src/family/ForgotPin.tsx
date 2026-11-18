import { useId, useState } from 'react';
import { useMessages } from '../i18n/I18n';
import { common } from '../ui/text';
import { answers, grownUpQuestion } from './pin';
import { familyText } from './text';

interface Props {
  onCorrect: () => void;
  onCancel: () => void;
}

/** For a grown-up who has forgotten the code: a sum too hard for the children. */
export function ForgotPin({ onCorrect, onCancel }: Props) {
  const t = useMessages(familyText);
  const { cancel } = useMessages(common);
  const answerId = useId();
  const [question] = useState(() => grownUpQuestion());
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  return (
    <form
      className="pin"
      onSubmit={(event) => {
        event.preventDefault();
        if (answers(question, answer)) onCorrect();
        else setWrong(true);
      }}
    >
      <h1>{t.forgotPin}</h1>
      <p className="pin-text">{t.forgotWhy}</p>
      <label htmlFor={answerId} className="forgot-question">
        {t.forgotSum(question.a, question.b)}
      </label>
      <input
        id={answerId}
        className="profile-name"
        inputMode="numeric"
        autoComplete="off"
        value={answer}
        onChange={(event) => {
          setAnswer(event.target.value);
          setWrong(false);
        }}
      />
      <p className="pin-wrong" role="alert">
        {wrong ? t.wrongAnswer : ''}
      </p>
      <div className="family-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {cancel}
        </button>
        <button type="submit" className="btn btn-primary">
          {t.answer}
        </button>
      </div>
    </form>
  );
}

import { useId, useState } from 'react';
import { answers, grownUpQuestion } from './pin';

interface Props {
  onCorrect: () => void;
  onCancel: () => void;
}

/** For a grown-up who has forgotten the code: a sum too hard for the children. */
export function ForgotPin({ onCorrect, onCancel }: Props) {
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
      <h1>Glemt koden?</h1>
      <p className="pin-text">
        Svar på regnestykket, så kan du komme ind og vælge en ny kode, næste gang et barn skal
        spille.
      </p>
      <label htmlFor={answerId} className="forgot-question">
        Hvad er {question.a} × {question.b}?
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
        {wrong ? 'Det var ikke rigtigt. Prøv igen.' : ''}
      </p>
      <div className="family-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Annullér
        </button>
        <button type="submit" className="btn btn-primary">
          Svar
        </button>
      </div>
    </form>
  );
}

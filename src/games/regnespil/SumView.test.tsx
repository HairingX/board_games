import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18n';
import { SumView } from './SumView';

describe('SumView', () => {
  it('writes brackets and division the Danish way, and reads them in words', () => {
    render(<SumView sum={['(', 1200, '÷', 4, ')', '−', 3]} />);
    const sum = screen.getByRole('img', {
      name: 'parentes 1.200 divideret med 4 parentes slut minus 3',
    });
    expect(sum).toHaveTextContent('(1.200 : 4) − 3 = ?');
  });

  it('writes them the English way', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['en-GB'], configurable: true });
    render(
      <I18nProvider>
        <SumView sum={[6, '×', '(', 2, '+', 1, ')']} />
      </I18nProvider>,
    );
    expect(
      await screen.findByRole('img', { name: '6 times bracket 2 plus 1 close bracket' }),
    ).toHaveTextContent('6 × (2 + 1) = ?');
    Object.defineProperty(navigator, 'languages', { value: ['da-DK', 'da'], configurable: true });
  });
});

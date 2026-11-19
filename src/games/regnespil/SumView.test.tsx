import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18n';
import type { Token } from './sums';
import { SumView } from './SumView';

/** Shows the sum in English, as a phone set to English would. */
async function inEnglish(sum: readonly Token[], name: string) {
  Object.defineProperty(navigator, 'languages', { value: ['en-GB'], configurable: true });
  render(
    <I18nProvider>
      <SumView sum={sum} />
    </I18nProvider>,
  );
  return screen.findByRole('img', { name });
}

afterEach(() => {
  Object.defineProperty(navigator, 'languages', { value: ['da-DK', 'da'], configurable: true });
});

describe('SumView', () => {
  it('writes brackets and division the Danish way, and reads them in words', () => {
    render(<SumView sum={['(', 1200, '÷', 4, ')', '−', 3]} />);
    const sum = screen.getByRole('img', {
      name: 'parentes 1.200 divideret med 4 parentes slut minus 3',
    });
    expect(sum).toHaveTextContent('(1.200 : 4) − 3 = ?');
  });

  it('writes them the English way', async () => {
    expect(
      await inEnglish([6, '×', '(', 2, '+', 1, ')'], '6 times bracket 2 plus 1 close bracket'),
    ).toHaveTextContent('6 × (2 + 1) = ?');
  });

  it('puts a negative number after an operator in brackets, with a true minus sign', () => {
    render(<SumView sum={[-3, '−', -5]} />);
    expect(screen.getByRole('img', { name: '−3 minus −5' })).toHaveTextContent('−3 − (−5) = ?');
  });

  it('stacks a fraction, its top over its bottom, and reads it', () => {
    const { container } = render(<SumView sum={[{ n: 3, d: 4 }, 'of', 20]} />);
    expect(screen.getByRole('img', { name: '3 over 4 af 20' })).toHaveTextContent('34 af 20 = ?');
    expect(container.querySelector('.fraction')?.children).toHaveLength(2);
  });

  it('raises powers, and reads them the Danish way', () => {
    const { container } = render(
      <SumView
        sum={['(', 7, { power: 2 }, '+', '(', -3, ')', { power: 3 }, ')', '×', 10, { power: 6 }]}
      />,
    );
    expect(
      screen.getByRole('img', {
        name: 'parentes 7 i anden plus parentes −3 parentes slut i tredje parentes slut gange 10 i 6. potens',
      }),
    ).toHaveTextContent('(72 + (−3)3) · 106 = ?');
    expect(container.querySelectorAll('sup.power')).toHaveLength(3);
  });

  it('writes roots and percents the Danish way', () => {
    render(<SumView sum={['√', 1849, '+', { percent: 37.5 }, 'of', 64]} />);
    expect(
      screen.getByRole('img', { name: 'kvadratroden af 1.849 plus 37,5 procent af 64' }),
    ).toHaveTextContent('√1.849 + 37,5 % af 64 = ?');
  });

  it('writes and reads powers, roots and percents the English way', async () => {
    expect(
      await inEnglish(
        [7, { power: 2 }, '+', 2, { power: 3 }, '+', 2, { power: 10 }, '−', '√', 49],
        '7 squared plus 2 cubed plus 2 to the power of 10 minus the square root of 49',
      ),
    ).toHaveTextContent('72 + 23 + 210 − √49 = ?');
  });

  it('writes a percent and a fraction the English way', async () => {
    expect(
      await inEnglish(
        [{ percent: 12.5 }, 'of', 1000, '+', { n: 1, d: 2 }],
        '12.5 percent of 1,000 plus 1 over 2',
      ),
    ).toHaveTextContent('12.5% of 1,000 + 12 = ?');
  });
});

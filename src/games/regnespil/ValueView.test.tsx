import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { formatSigned, formatValue, ValueView } from './ValueView';

describe('formatValue', () => {
  it('writes numbers the language’s way, with a true minus sign, and fractions in a line', () => {
    expect(formatSigned('da', -3.5)).toBe('−3,5');
    expect(formatValue('da', 1234.5)).toBe('1.234,5');
    expect(formatValue('en', { n: -3, d: 4 })).toBe('−3/4');
  });
});

describe('ValueView', () => {
  it('shows a number as it is written', () => {
    const { container } = render(<ValueView value={-12} />);
    expect(container).toHaveTextContent('−12');
  });

  it('stacks a fraction, with its minus before it', () => {
    const { container } = render(<ValueView value={{ n: -3, d: 4 }} />);
    expect(container).toHaveTextContent('−34');
    const parts = container.querySelectorAll('.fraction > span');
    expect([...parts].map((part) => part.textContent)).toEqual(['3', '4']);
  });

  it('shows a positive fraction without a sign', () => {
    const { container } = render(<ValueView value={{ n: 5, d: 8 }} />);
    expect(container.textContent).toBe('58');
  });
});

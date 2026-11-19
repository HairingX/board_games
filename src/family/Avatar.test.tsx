import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mille } from '../../tests/family';
import { Avatar } from './Avatar';
import { faces } from './faces';

describe('Avatar', () => {
  it('shows the initial in the profile’s colour when it has no picture', () => {
    const { container } = render(<Avatar profile={mille} />);
    expect(container.textContent).toBe('M');
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows a face, drawn pixelated', () => {
    const [face = '', src] = [...faces][0] ?? [];
    const { container } = render(
      <Avatar profile={{ ...mille, picture: { kind: 'face', face } }} size="small" />,
    );
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', src);
    expect(image).toHaveClass('avatar-face');
  });

  it('shows a photo', () => {
    const src = 'data:image/jpeg;base64,AAA';
    const { container } = render(
      <Avatar profile={{ ...mille, picture: { kind: 'photo', src } }} />,
    );
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', src);
    expect(image).not.toHaveClass('avatar-face');
  });

  it('shows the initial for a face the app no longer has', () => {
    const { container } = render(
      <Avatar profile={{ ...mille, picture: { kind: 'face', face: 'Gone' } }} />,
    );
    expect(container.textContent).toBe('M');
  });
});

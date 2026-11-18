import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { listenForInstall, useInstall } from './install';

function InstallButton() {
  const install = useInstall();
  return install ? (
    <button type="button" onClick={() => void install()}>
      Installér
    </button>
  ) : (
    <p>Ingen knap</p>
  );
}

function offer(target: EventTarget): { prompt: ReturnType<typeof vi.fn> } {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(() => Promise.resolve()),
  });
  act(() => {
    target.dispatchEvent(event);
  });
  expect(event.defaultPrevented).toBe(true);
  return event;
}

describe('install', () => {
  const target = new EventTarget() as Window;
  listenForInstall(target);

  it('offers a button once the browser offers to install, and shows its dialog', async () => {
    render(<InstallButton />);
    expect(screen.getByText('Ingen knap')).toBeInTheDocument();

    const event = offer(target);
    await act(async () => {
      screen.getByRole('button', { name: 'Installér' }).click();
      await Promise.resolve();
    });
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(screen.getByText('Ingen knap')).toBeInTheDocument();
  });

  it('takes the button away once the app is installed', () => {
    render(<InstallButton />);
    offer(target);
    expect(screen.getByRole('button', { name: 'Installér' })).toBeInTheDocument();
    act(() => {
      target.dispatchEvent(new Event('appinstalled'));
    });
    expect(screen.getByText('Ingen knap')).toBeInTheDocument();
  });
});

import { fireEvent, screen } from '@testing-library/react';
import { newFamily, type Family, type Profile } from '../src/family/family';
import { familySaveKey } from '../src/family/FamilyContext';
import { saves } from '../src/lib/saves';

export const far: Profile = { id: 'far', name: 'Far', role: 'voksen', color: 'plum', pin: null };
export const mor: Profile = { id: 'mor', name: 'Mor', role: 'voksen', color: 'teal', pin: null };
export const mille: Profile = {
  id: 'mille',
  name: 'Mille',
  role: 'barn',
  color: 'ochre',
  pin: null,
};

/** Saves the family the app finds when it starts. */
export async function seedFamily(family: Partial<Family>): Promise<void> {
  await saves.write(familySaveKey, { ...newFamily(), ...family });
}

/** The family as it is saved now. */
export async function savedFamily(): Promise<Family> {
  return (await saves.read(familySaveKey)) as Family;
}

/** Answers "Hvem spiller?" with the profile of that name. */
export async function playAs(name: string): Promise<void> {
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(`^${name}`) }));
}

/** Presses the digits on the keypad shown. */
export function typePin(pin: string): void {
  for (const digit of pin) fireEvent.click(screen.getByRole('button', { name: digit }));
}

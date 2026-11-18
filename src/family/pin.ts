import type { PinHash } from './family';

/** How many digits a code has. */
export const pinLength = 4;

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function digest(salt: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

/**
 * The code as a salted hash, so the digits themselves are never saved. Four digits are easily
 * found from a hash by trying all ten thousand; the hash only keeps them out of plain sight in
 * a backup file, which is all a lock against children needs.
 */
export async function hashPin(pin: string): Promise<PinHash> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await digest(salt, pin) };
}

/** Whether the code is the one the hash was made from. */
export async function pinMatches(pin: string, saved: PinHash): Promise<boolean> {
  return (await digest(saved.salt, pin)) === saved.hash;
}

/** A question for a grown-up who has forgotten the code: two two-digit numbers to multiply. */
export interface GrownUpQuestion {
  a: number;
  b: number;
}

/** A new question, from numbers between 13 and 29 so the answer takes more than times tables. */
export function grownUpQuestion(random: () => number = Math.random): GrownUpQuestion {
  const pick = () => 13 + Math.floor(random() * 17);
  return { a: pick(), b: pick() };
}

export function answers(question: GrownUpQuestion, answer: string): boolean {
  return answer.trim() === String(question.a * question.b);
}

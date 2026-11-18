/**
 * Reads a value saved under the key, or undefined when there is none, it is not valid JSON, it
 * fails the check, or storage is unavailable (private browsing, blocked site data).
 */
export function readStored<T>(key: string, isValid: (value: unknown) => value is T): T | undefined {
  try {
    const text = localStorage.getItem(key);
    if (text === null) return undefined;
    const value: unknown = JSON.parse(text);
    return isValid(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Saves the value under the key; it is silently lost when storage is unavailable. */
export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Without storage the game still plays; it only forgets on reload.
  }
}

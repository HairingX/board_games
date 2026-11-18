/**
 * Takes the value an earlier version saved in localStorage under the key, removing it, so it
 * can move to the saves. Undefined when there is none, it is not JSON, or storage is blocked.
 */
export function takeLegacy(key: string): unknown {
  try {
    const text = localStorage.getItem(key);
    if (text === null) return undefined;
    localStorage.removeItem(key);
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

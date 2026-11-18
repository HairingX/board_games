/** A source of numbers in [0, 1), as Math.random gives them. */
export type Random = () => number;

/** A shuffled copy of the items (Fisher–Yates). */
export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/*
 * How long a monster takes to walk up to the hero while a sum is thought over: at the child's
 * own pace, and never less than a quarter of a minute, so it urges without rushing. Each
 * player's pace is how long they took over their last few sums.
 */

/** The least time a walk takes, in seconds; how many times a player's usual time it takes; and how many of their times are kept. */
export const approach = { least: 15, times: 3, kept: 5 } as const;

/** How long the monster takes to reach the hero, in seconds, for a player who took these times. */
export function approachSeconds(times: readonly number[] = []): number {
  const sorted = [...times].sort((a, b) => a - b);
  const usual = sorted[Math.floor(sorted.length / 2)] ?? 0;
  return Math.max(approach.least, usual * approach.times);
}

/** A player's times with one more, only the latest kept. */
export function withTime(times: readonly number[] = [], seconds: number): readonly number[] {
  return [...times, seconds].slice(-approach.kept);
}

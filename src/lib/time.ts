const relative = new Intl.RelativeTimeFormat('da', { numeric: 'auto' });

const units: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

/** How long ago `then` was, in Danish: "lige nu", "for 5 minutter siden", "i går". */
export function timeAgo(then: number, now: number): string {
  const elapsed = Math.max(0, now - then);
  for (const [unit, length] of units) {
    if (elapsed >= length) return relative.format(-Math.floor(elapsed / length), unit);
  }
  return 'lige nu';
}

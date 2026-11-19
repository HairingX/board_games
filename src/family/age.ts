/*
 * A person's age from their birthday, kept on the phone as a day such as "2018-04-23", so the
 * games can suggest where to start: which level, how hard. Only a suggestion; it is always
 * changed by hand.
 */

/** Whether the value is a day of a birthday as the form gives it: "2018-04-23". */
export function isBirthday(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day;
}

/** How old someone born on the day is, in whole years, on `today`. */
export function age(born: string, today: Date): number {
  const [year, month, day] = born.split('-').map(Number) as [number, number, number];
  const hadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
}

/** August, when the Danish school year starts, counted from 0 for January. */
const schoolYearStarts = 7;

/**
 * The Danish school grade a child born on the day is in on `today`: 0 for børnehaveklassen,
 * begun in August of the year the child turns six; below 0 before school, and 10 and up
 * after the ninth grade.
 */
export function schoolGrade(born: string, today: Date): number {
  const schoolYear = today.getFullYear() - (today.getMonth() >= schoolYearStarts ? 0 : 1);
  return schoolYear - Number(born.slice(0, 4)) - 6;
}

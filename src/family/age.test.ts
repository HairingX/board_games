import { describe, expect, it } from 'vitest';
import { age, isBirthday, schoolGrade } from './age';

describe('isBirthday', () => {
  it('takes a real day written as the form writes it', () => {
    expect(isBirthday('2018-04-23')).toBe(true);
    expect(isBirthday('2020-02-29')).toBe(true);
  });

  it.each([undefined, 20180423, '2018-4-23', '2019-02-29', '2018-13-01', '23-04-2018', ''])(
    'refuses %j',
    (value) => {
      expect(isBirthday(value)).toBe(false);
    },
  );
});

describe('age', () => {
  it('counts whole years, turning a year older on the birthday', () => {
    expect(age('2018-04-23', new Date(2026, 3, 22))).toBe(7);
    expect(age('2018-04-23', new Date(2026, 3, 23))).toBe(8);
    expect(age('2018-04-23', new Date(2026, 2, 30))).toBe(7);
    expect(age('2018-04-23', new Date(2026, 10, 19))).toBe(8);
  });
});

describe('schoolGrade', () => {
  it('starts børnehaveklassen in August of the year a child turns six', () => {
    expect(schoolGrade('2020-11-02', new Date(2026, 6, 31))).toBe(-1);
    expect(schoolGrade('2020-11-02', new Date(2026, 7, 1))).toBe(0);
    expect(schoolGrade('2018-04-23', new Date(2026, 10, 19))).toBe(2);
    expect(schoolGrade('2018-04-23', new Date(2027, 1, 1))).toBe(2);
    expect(schoolGrade('1985-06-01', new Date(2026, 10, 19))).toBe(35);
  });
});

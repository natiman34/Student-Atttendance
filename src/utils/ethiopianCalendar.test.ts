import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isEthiopianLeapYear,
  getDaysInEthiopianMonth,
  gregorianToEthiopian,
  ethiopianToGregorian,
  isoToEthiopian,
  ethiopianToIso,
  formatEthiopianDisplay,
  formatIsoToEthiopianDisplay,
  ETHIOPIAN_MONTHS,
} from './ethiopianCalendar.ts';

test('isEthiopianLeapYear correctly detects leap years where year % 4 === 3', () => {
  assert.equal(isEthiopianLeapYear(2015), true); // 2015 % 4 = 3 (Leap year)
  assert.equal(isEthiopianLeapYear(2016), false); // 2016 % 4 = 0
  assert.equal(isEthiopianLeapYear(2017), false); // 2017 % 4 = 1
  assert.equal(isEthiopianLeapYear(2018), false); // 2018 % 4 = 2
  assert.equal(isEthiopianLeapYear(2019), true); // 2019 % 4 = 3 (Leap year)
});

test('getDaysInEthiopianMonth handles months 1..12 as 30 and Pagume leap vs common', () => {
  for (let m = 1; m <= 12; m++) {
    assert.equal(getDaysInEthiopianMonth(2016, m), 30);
    assert.equal(getDaysInEthiopianMonth(2015, m), 30);
  }
  // Month 13 (Pagume)
  assert.equal(getDaysInEthiopianMonth(2015, 13), 6); // leap year
  assert.equal(getDaysInEthiopianMonth(2016, 13), 5); // common year
  assert.equal(getDaysInEthiopianMonth(2017, 13), 5); // common year
  assert.equal(getDaysInEthiopianMonth(2019, 13), 6); // leap year
});

test('gregorianToEthiopian correctly converts known historical, leap, and new year dates', () => {
  // Ethiopian New Year 2016 (following 2015 leap year where Pagume had 6 days)
  assert.deepEqual(gregorianToEthiopian(2023, 9, 10), { year: 2015, month: 13, day: 5 });
  assert.deepEqual(gregorianToEthiopian(2023, 9, 11), { year: 2015, month: 13, day: 6 });
  assert.deepEqual(gregorianToEthiopian(2023, 9, 12), { year: 2016, month: 1, day: 1 });

  // Ethiopian New Year 2017 (following 2016 common year)
  assert.deepEqual(gregorianToEthiopian(2024, 9, 10), { year: 2016, month: 13, day: 5 });
  assert.deepEqual(gregorianToEthiopian(2024, 9, 11), { year: 2017, month: 1, day: 1 });

  // Genna / Christmas 2017 (Tahsas 29)
  assert.deepEqual(gregorianToEthiopian(2025, 1, 7), { year: 2017, month: 4, day: 29 });

  // Current environment date: Oct 24, 2026 => Tikimt 14, 2019
  assert.deepEqual(gregorianToEthiopian(2026, 10, 24), { year: 2019, month: 2, day: 14 });
});

test('ethiopianToGregorian and ethiopianToIso perform exact inverse conversions', () => {
  assert.deepEqual(ethiopianToGregorian(2015, 13, 6), { year: 2023, month: 9, day: 11 });
  assert.deepEqual(ethiopianToGregorian(2016, 1, 1), { year: 2023, month: 9, day: 12 });
  assert.deepEqual(ethiopianToGregorian(2017, 1, 1), { year: 2024, month: 9, day: 11 });
  assert.deepEqual(ethiopianToGregorian(2019, 2, 14), { year: 2026, month: 10, day: 24 });

  assert.equal(ethiopianToIso(2019, 2, 14), '2026-10-24');
  assert.deepEqual(isoToEthiopian('2026-10-24'), { year: 2019, month: 2, day: 14 });
});

test('formatEthiopianDisplay renders correct Amharic month names and year markers', () => {
  const ethDate = { year: 2019, month: 2, day: 14 };
  assert.equal(formatEthiopianDisplay(ethDate), 'ጥቅምት 14 ቀን 2019 ዓ.ም');
  assert.equal(formatEthiopianDisplay(ethDate, { compact: true }), 'ጥቅምት 14, 2019');

  const formattedIso = formatIsoToEthiopianDisplay('2026-10-24');
  assert.equal(formattedIso, 'ጥቅምት 14 ቀን 2019 ዓ.ም');
});

test('ETHIOPIAN_MONTHS contains all 13 Ethiopian months with correct Amharic spelling', () => {
  assert.equal(ETHIOPIAN_MONTHS.length, 13);
  assert.equal(ETHIOPIAN_MONTHS[0].amharicName, 'መስከረም');
  assert.equal(ETHIOPIAN_MONTHS[1].amharicName, 'ጥቅምት');
  assert.equal(ETHIOPIAN_MONTHS[2].amharicName, 'ኅዳር');
  assert.equal(ETHIOPIAN_MONTHS[3].amharicName, 'ታኅሣሥ');
  assert.equal(ETHIOPIAN_MONTHS[4].amharicName, 'ጥር');
  assert.equal(ETHIOPIAN_MONTHS[5].amharicName, 'የካቲት');
  assert.equal(ETHIOPIAN_MONTHS[6].amharicName, 'መጋቢት');
  assert.equal(ETHIOPIAN_MONTHS[7].amharicName, 'ሚያዝያ');
  assert.equal(ETHIOPIAN_MONTHS[8].amharicName, 'ግንቦት');
  assert.equal(ETHIOPIAN_MONTHS[9].amharicName, 'ሰኔ');
  assert.equal(ETHIOPIAN_MONTHS[10].amharicName, 'ሐምሌ');
  assert.equal(ETHIOPIAN_MONTHS[11].amharicName, 'ነሐሴ');
  assert.equal(ETHIOPIAN_MONTHS[12].amharicName, 'ጳጉሜ');
});

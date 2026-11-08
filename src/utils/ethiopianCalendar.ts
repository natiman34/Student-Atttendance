/**
 * High-accuracy Bidirectional Ethiopian Calendar (ዓመተ ምሕረት) Engine.
 * Grounded in astronomical Julian Day Number (JDN) conversions.
 * Supports all 13 Ethiopian months including Pagume leap-year transitions.
 */

export interface EthiopianDate {
  year: number; // e.g. 2019
  month: number; // 1 to 13
  day: number; // 1 to 30 (or 1 to 5/6 for Pagume)
}

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

export interface EthiopianMonthInfo {
  number: number;
  amharicName: string;
  englishName: string;
}

export const ETHIOPIAN_MONTHS: EthiopianMonthInfo[] = [
  { number: 1, amharicName: 'መስከረም', englishName: 'Meskerem' },
  { number: 2, amharicName: 'ጥቅምት', englishName: 'Tikimt' },
  { number: 3, amharicName: 'ኅዳር', englishName: 'Hidar' },
  { number: 4, amharicName: 'ታኅሣሥ', englishName: 'Tahsas' },
  { number: 5, amharicName: 'ጥር', englishName: 'Tir' },
  { number: 6, amharicName: 'የካቲት', englishName: 'Yekatit' },
  { number: 7, amharicName: 'መጋቢት', englishName: 'Megabit' },
  { number: 8, amharicName: 'ሚያዝያ', englishName: 'Miazia' },
  { number: 9, amharicName: 'ግንቦት', englishName: 'Ginbot' },
  { number: 10, amharicName: 'ሰኔ', englishName: 'Sene' },
  { number: 11, amharicName: 'ሐምሌ', englishName: 'Hamle' },
  { number: 12, amharicName: 'ነሐሴ', englishName: 'Nehase' },
  { number: 13, amharicName: 'ጳጉሜ', englishName: 'Pagume' },
];

export const ETHIOPIAN_WEEKDAYS = [
  { dayIndex: 0, amharic: 'እሑድ', short: 'እ', english: 'Sunday' },
  { dayIndex: 1, amharic: 'ሰኞ', short: 'ሰ', english: 'Monday' },
  { dayIndex: 2, amharic: 'ማክሰኞ', short: 'ማ', english: 'Tuesday' },
  { dayIndex: 3, amharic: 'ረቡዕ', short: 'ረ', english: 'Wednesday' },
  { dayIndex: 4, amharic: 'ሐሙስ', short: 'ሐ', english: 'Thursday' },
  { dayIndex: 5, amharic: 'ዓርብ', short: 'ዓ', english: 'Friday' },
  { dayIndex: 6, amharic: 'ቅዳሜ', short: 'ቅ', english: 'Saturday' },
];

const JD_EPOCH_OFFSET = 1723856;

/**
 * Checks if an Ethiopian year is a leap year (ዓመተ ዮሐንስ).
 * In the Ethiopian calendar, a leap year occurs every 4 years when year % 4 === 3.
 * During leap years, Pagume (Month 13) has 6 days instead of 5.
 */
export function isEthiopianLeapYear(year: number): boolean {
  return (year % 4 + 4) % 4 === 3;
}

/**
 * Returns number of days in a given Ethiopian year and month.
 */
export function getDaysInEthiopianMonth(year: number, month: number): number {
  if (month >= 1 && month <= 12) {
    return 30;
  }
  if (month === 13) {
    return isEthiopianLeapYear(year) ? 6 : 5;
  }
  return 30;
}

/**
 * Converts Ethiopian Date to Julian Day Number (JDN).
 */
export function ethiopianToJDN(year: number, month: number, day: number): number {
  return (
    JD_EPOCH_OFFSET +
    365 +
    365 * (year - 1) +
    Math.floor(year / 4) +
    30 * (month - 1) +
    day -
    1
  );
}

/**
 * Converts Julian Day Number (JDN) to Ethiopian Date.
 */
export function jdnToEthiopian(jdn: number): EthiopianDate {
  const r = (jdn - JD_EPOCH_OFFSET) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);

  const year =
    4 * Math.floor((jdn - JD_EPOCH_OFFSET) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;

  return { year, month, day };
}

/**
 * Converts Gregorian Date to Julian Day Number (JDN).
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Converts Julian Day Number (JDN) to Gregorian Date.
 */
export function jdnToGregorian(jdn: number): GregorianDate {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/**
 * Converts Gregorian Date (year, month, day) to Ethiopian Date.
 */
export function gregorianToEthiopian(
  year: number,
  month: number,
  day: number
): EthiopianDate {
  const jdn = gregorianToJDN(year, month, day);
  return jdnToEthiopian(jdn);
}

/**
 * Converts Ethiopian Date to Gregorian Date.
 */
export function ethiopianToGregorian(
  year: number,
  month: number,
  day: number
): GregorianDate {
  const jdn = ethiopianToJDN(year, month, day);
  return jdnToGregorian(jdn);
}

/**
 * Converts an ISO string YYYY-MM-DD (Gregorian) to EthiopianDate.
 */
export function isoToEthiopian(isoDateStr: string): EthiopianDate {
  if (!isoDateStr || typeof isoDateStr !== 'string') {
    return getTodayEthiopian();
  }
  const parts = isoDateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return getTodayEthiopian();
  }
  return gregorianToEthiopian(parts[0], parts[1], parts[2]);
}

/**
 * Converts Ethiopian Date to an ISO string YYYY-MM-DD (Gregorian).
 * This ensures 100% interoperability with saved database records and sort order.
 */
export function ethiopianToIso(year: number, month: number, day: number): string {
  const g = ethiopianToGregorian(year, month, day);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${g.year}-${pad(g.month)}-${pad(g.day)}`;
}

/**
 * Returns today's Ethiopian date based on local system time.
 */
export function getTodayEthiopian(): EthiopianDate {
  const now = new Date();
  return gregorianToEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Gets day of week for an Ethiopian date (0 = Sunday, 1 = Monday ... 6 = Saturday).
 */
export function getEthiopianDayOfWeek(year: number, month: number, day: number): number {
  const jdn = ethiopianToJDN(year, month, day);
  return (jdn + 1) % 7;
}

/**
 * Formats Ethiopian Date with Amharic month name and year.
 * Examples:
 * - 'ጥቅምት 14 ቀን 2019 ዓ.ም'
 * - 'ጥቅምት 14, 2019'
 */
export function formatEthiopianDisplay(
  ethDate: EthiopianDate,
  options: {
    includeWeekday?: boolean;
    includeEra?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { includeWeekday = false, includeEra = true, compact = false } = options;
  const monthInfo =
    ETHIOPIAN_MONTHS[ethDate.month - 1] || ETHIOPIAN_MONTHS[0];

  const weekdayStr = includeWeekday
    ? `${ETHIOPIAN_WEEKDAYS[getEthiopianDayOfWeek(ethDate.year, ethDate.month, ethDate.day)].amharic} `
    : '';

  if (compact) {
    return `${monthInfo.amharicName} ${ethDate.day}, ${ethDate.year}`;
  }

  const eraStr = includeEra ? ' ዓ.ም' : '';
  return `${weekdayStr}${monthInfo.amharicName} ${ethDate.day} ቀን ${ethDate.year}${eraStr}`;
}

/**
 * Formats an ISO string (YYYY-MM-DD) into user-facing Ethiopian calendar text.
 */
export function formatIsoToEthiopianDisplay(
  isoDateStr: string,
  options: {
    includeWeekday?: boolean;
    includeEra?: boolean;
    includeGregorianReference?: boolean;
    compact?: boolean;
  } = {}
): string {
  if (!isoDateStr) return '';
  const eth = isoToEthiopian(isoDateStr);
  const ethStr = formatEthiopianDisplay(eth, options);

  if (options.includeGregorianReference) {
    return `${ethStr} (${isoDateStr})`;
  }
  return ethStr;
}

/**
 * Formats an Ethiopian date with both Amharic and phonetic Latin representation for bilingual export headers.
 */
export function formatEthiopianBilingual(isoDateStr: string): string {
  if (!isoDateStr) return '';
  const eth = isoToEthiopian(isoDateStr);
  const monthInfo = ETHIOPIAN_MONTHS[eth.month - 1] || ETHIOPIAN_MONTHS[0];
  const weekday = ETHIOPIAN_WEEKDAYS[getEthiopianDayOfWeek(eth.year, eth.month, eth.day)];

  return `${weekday.amharic} ${monthInfo.amharicName} ${eth.day} ቀን ${eth.year} ዓ.ም (${monthInfo.englishName} ${eth.day}, ${eth.year} EC • ${isoDateStr} GC)`;
}

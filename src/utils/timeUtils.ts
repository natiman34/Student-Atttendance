/**
 * Utility functions for time entry, duration calculation, and validation
 * for RollCall activity schedules.
 */

/**
 * Parses a time string (e.g. "09:30", "9:30", "14:15", "2:30 PM") into minutes from midnight.
 * Returns null if the format is invalid.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const clean = timeStr.trim();
  if (!clean) return null;

  // Check 12-hour format with AM/PM
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const isPM = ampmMatch[3].toLowerCase() === 'pm';

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Check 24-hour format "HH:MM"
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight to "HH:MM" standard 24-hour time.
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Adds minutes to an existing time string and returns the new "HH:MM" string.
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const current = parseTimeToMinutes(timeStr);
  if (current === null) return '';
  return formatMinutesToTime(current + minutesToAdd);
}

export interface ActivityDurationResult {
  durationMinutes: number;
  formattedAm: string;
  formattedEn: string;
  isValid: boolean;
  crossesMidnight: boolean;
  warning?: {
    am: string;
    en: string;
  };
}

/**
 * Calculates duration between start time and end time.
 * Validates whether end time is earlier than start time.
 */
export function calculateActivityDuration(
  startTime: string,
  endTime: string
): ActivityDurationResult {
  const startMins = parseTimeToMinutes(startTime);
  const endMins = parseTimeToMinutes(endTime);

  if (startMins === null || endMins === null) {
    return {
      durationMinutes: 0,
      formattedAm: '',
      formattedEn: '',
      isValid: true,
      crossesMidnight: false,
    };
  }

  let duration = endMins - startMins;
  let crossesMidnight = false;

  if (duration < 0) {
    // If start is late evening (>= 18:00) and end is early morning (<= 06:00), legitimate overnight
    if (startMins >= 18 * 60 && endMins <= 6 * 60) {
      duration += 1440;
      crossesMidnight = true;
    } else {
      // Invalid order
      return {
        durationMinutes: 0,
        formattedAm: 'ያልተገባ ሰዓት (Invalid)',
        formattedEn: 'Invalid Time Order',
        isValid: false,
        crossesMidnight: false,
        warning: {
          am: 'የማብቂያ ሰዓት ከመጀመሪያ ሰዓት ቀድሟል',
          en: 'End time is earlier than start time',
        },
      };
    }
  }

  if (duration === 0) {
    return {
      durationMinutes: 0,
      formattedAm: '0 ደቂቃ',
      formattedEn: '0 min',
      isValid: true,
      crossesMidnight: false,
    };
  }

  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  let formattedAm = '';
  let formattedEn = '';

  if (hours > 0 && mins > 0) {
    formattedAm = `${hours} ሰዓት ${mins} ደቂቃ`;
    formattedEn = `${hours}h ${mins}m`;
  } else if (hours > 0) {
    formattedAm = `${hours} ሰዓት`;
    formattedEn = `${hours}h`;
  } else {
    formattedAm = `${mins} ደቂቃ`;
    formattedEn = `${mins} min`;
  }

  return {
    durationMinutes: duration,
    formattedAm,
    formattedEn,
    isValid: true,
    crossesMidnight,
  };
}

/**
 * Common quick-time presets for Ethiopian school and feeding programs.
 */
export const QUICK_TIME_PRESETS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
];

export interface ManualTimeValidationResult {
  isValid: boolean;
  timeString: string; // "HH:MM"
  hours: number;
  minutes: number;
  error?: {
    am: string;
    en: string;
  };
}

/**
 * Validates and formats manual hours and minutes into "HH:MM".
 * Disallows negative values, out-of-range hours (>23), and out-of-range minutes (>59).
 */
export function validateManualTimeInput(
  hoursInput: number | string,
  minutesInput: number | string
): ManualTimeValidationResult {
  const hStr = String(hoursInput).trim();
  const mStr = String(minutesInput).trim();

  if (!hStr && !mStr) {
    return {
      isValid: true,
      timeString: '',
      hours: 0,
      minutes: 0,
    };
  }

  const h = Number(hStr);
  const m = Number(mStr);

  if (isNaN(h) || !Number.isInteger(h) || h < 0 || h > 23) {
    return {
      isValid: false,
      timeString: '',
      hours: 0,
      minutes: 0,
      error: {
        am: 'ሰዓቱ ከ 0 እስከ 23 ባለው ውስጥ መሆን አለበት',
        en: 'Hours must be an integer between 0 and 23',
      },
    };
  }

  if (isNaN(m) || !Number.isInteger(m) || m < 0 || m > 59) {
    return {
      isValid: false,
      timeString: '',
      hours: h,
      minutes: 0,
      error: {
        am: 'ደቂቃው ከ 0 እስከ 59 ባለው ውስጥ መሆን አለበት',
        en: 'Minutes must be an integer between 0 and 59',
      },
    };
  }

  const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return {
    isValid: true,
    timeString,
    hours: h,
    minutes: m,
  };
}

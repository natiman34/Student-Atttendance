import type {
  Student,
  DayAttendance,
  DailyFeedingReport,
  SavedWeeklyReport,
  SavedMonthlyReport,
  AppSettings,
} from '../types.ts';
import {
  isoToEthiopian,
  ethiopianToIso,
  formatEthiopianDisplay,
  ETHIOPIAN_MONTHS,
  getDaysInEthiopianMonth,
} from './ethiopianCalendar.ts';
import { calculateDayStats, formatDisplayDate } from './attendance.ts';
import { validateFeedingReport } from './feeding.ts';

export interface ReportValidationResult {
  isValid: boolean;
  errorType?: 'no_students' | 'no_report_data' | 'no_period_reports' | 'partial_fields';
  missingFields?: string[];
  messageAm?: string;
  messageEn?: string;
}

/**
 * Validates report data before exporting as PDF, Word, or Excel.
 */
export function validateReportBeforeExport(options: {
  students: Student[];
  attendance?: DayAttendance;
  feeding?: DailyFeedingReport;
  checkType?: 'attendance' | 'feeding' | 'combined';
}): ReportValidationResult {
  const { students, attendance, feeding, checkType = 'combined' } = options;

  // 1. Check student registration
  if (!students || students.length === 0) {
    return {
      isValid: false,
      errorType: 'no_students',
      messageAm: 'እባክዎ መጀመሪያ ተማሪዎችን ይመዝግቡ።',
      messageEn: 'Please register students first before exporting reports.',
    };
  }

  // 2. Check report data presence
  const hasAttendance = !!attendance && Object.keys(attendance.records || {}).length > 0;
  const hasFeeding = !!feeding;

  if (checkType === 'attendance' && !hasAttendance) {
    return {
      isValid: false,
      errorType: 'no_report_data',
      messageAm: 'የተማሪዎች አቴንዳንስ አልተመዘገበም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት አቴንዳንሱን ይሙሉ።',
      messageEn: 'Attendance has not been recorded. Please take attendance before exporting.',
    };
  }

  if (checkType === 'feeding' && !hasFeeding) {
    return {
      isValid: false,
      errorType: 'no_report_data',
      messageAm: 'የዕለት ምገባ ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።',
      messageEn: 'The feeding report has not been completed. Please fill in the report before exporting.',
    };
  }

  if (checkType === 'combined' && !hasAttendance && !hasFeeding) {
    return {
      isValid: false,
      errorType: 'no_report_data',
      messageAm: 'ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።',
      messageEn: 'The report has not been completed. Please fill in the report before exporting or downloading it.',
    };
  }

  // 3. Check for partially completed feeding report if feeding exists
  if (feeding) {
    const feedingVal = validateFeedingReport(feeding);
    if (!feedingVal.isValid) {
      return {
        isValid: false,
        errorType: 'partial_fields',
        missingFields: Object.values(feedingVal.errors),
        messageAm: 'የምገባ ሪፖርቱ በከፊል ብቻ ነው የተሞላው። እባክዎ አስፈላጊ የሆኑትን መረጃዎች አሟልተው ያስገቡ።',
        messageEn: 'The feeding report is partially completed. Please fill all required fields before exporting.',
      };
    }
  }

  return { isValid: true };
}

/**
 * Calculates a complete weekly summary over an arbitrary 7-day reporting period.
 */
export function calculateWeeklySummary(
  startDate: string, // YYYY-MM-DD
  endDate: string, // YYYY-MM-DD
  students: Student[],
  attendanceHistory: DayAttendance[],
  feedingReports: DailyFeedingReport[]
): {
  startDate: string;
  endDate: string;
  ethiopianLabel: string;
  totalStudents: number;
  totalDays: number;
  totalPresent: number;
  totalAbsent: number;
  totalPermission: number;
  attendanceRate: number;
  includedReportDates: string[];
  feedingSummary: {
    totalChildrenFed: number;
    totalVolunteers: number;
    totalFoodKg: number;
    lessonCount: number;
    gameCount: number;
    nothingCount: number;
  };
  dailyBreakdowns: Array<{
    date: string;
    ethDateStr: string;
    present: number;
    absent: number;
    permission: number;
    rate: number;
    feeding?: DailyFeedingReport;
  }>;
  gapsAndChallenges: Array<{
    date: string;
    ethDateStr: string;
    coordinator: string;
    notes: string;
  }>;
} {
  // Filter days between start and end date inclusive
  const daysInPeriod = attendanceHistory
    .filter((a) => a.date >= startDate && a.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  const feedingsInPeriod = feedingReports
    .filter((f) => f.date >= startDate && f.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Collect all unique active dates
  const dateSet = new Set<string>();
  daysInPeriod.forEach((d) => dateSet.add(d.date));
  feedingsInPeriod.forEach((f) => dateSet.add(f.date));
  const sortedDates = Array.from(dateSet).sort();

  let totalPresent = 0;
  let totalAbsent = 0;
  let totalPermission = 0;

  const dailyBreakdowns = sortedDates.map((d) => {
    const att = daysInPeriod.find((a) => a.date === d);
    const feed = feedingsInPeriod.find((f) => f.date === d);
    const stats = calculateDayStats(students, att?.records);

    totalPresent += stats.present;
    totalAbsent += stats.absent;
    totalPermission += stats.permission;

    const eth = isoToEthiopian(d);
    const ethDateStr = formatEthiopianDisplay(eth, { includeWeekday: true, compact: true });

    return {
      date: d,
      ethDateStr,
      present: stats.present,
      absent: stats.absent,
      permission: stats.permission,
      rate: stats.attendanceRate,
      feeding: feed,
    };
  });

  const totalPossible = totalPresent + totalAbsent + totalPermission;
  const attendanceRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

  let totalChildrenFed = 0;
  let totalVolunteers = 0;
  let totalFoodKg = 0;
  let lessonCount = 0;
  let gameCount = 0;
  let nothingCount = 0;
  const gapsAndChallenges: Array<{ date: string; ethDateStr: string; coordinator: string; notes: string }> = [];

  for (const f of feedingsInPeriod) {
    totalChildrenFed += f.childrenCount || 0;
    totalVolunteers += f.volunteersCount || 0;
    totalFoodKg += f.foodQuantityKg || 0;
    if (f.activityType === 'lesson') lessonCount++;
    else if (f.activityType === 'game') gameCount++;
    else if (f.activityType === 'none') nothingCount++;

    if (f.generalNotes && f.generalNotes.trim().length > 0) {
      const eth = isoToEthiopian(f.date);
      gapsAndChallenges.push({
        date: f.date,
        ethDateStr: formatEthiopianDisplay(eth, { compact: true }),
        coordinator: f.coordinatorName,
        notes: f.generalNotes.trim(),
      });
    }
  }

  const startEth = isoToEthiopian(startDate);
  const endEth = isoToEthiopian(endDate);
  const ethiopianLabel = `${formatEthiopianDisplay(startEth, { compact: true })} - ${formatEthiopianDisplay(endEth, { compact: true })}`;

  return {
    startDate,
    endDate,
    ethiopianLabel,
    totalStudents: students.length,
    totalDays: sortedDates.length,
    totalPresent,
    totalAbsent,
    totalPermission,
    attendanceRate,
    includedReportDates: sortedDates,
    feedingSummary: {
      totalChildrenFed,
      totalVolunteers,
      totalFoodKg: Math.round(totalFoodKg * 10) / 10,
      lessonCount,
      gameCount,
      nothingCount,
    },
    dailyBreakdowns,
    gapsAndChallenges,
  };
}

/**
 * Calculates a complete Ethiopian monthly summary for a specific Ethiopian year and month (1 to 13).
 */
export function calculateMonthlySummary(
  ethYear: number,
  ethMonth: number, // 1 to 13
  students: Student[],
  attendanceHistory: DayAttendance[],
  feedingReports: DailyFeedingReport[]
): {
  ethYear: number;
  ethMonth: number;
  ethMonthName: string;
  startDate: string;
  endDate: string;
  label: string;
  totalStudents: number;
  totalDays: number;
  totalPresent: number;
  totalAbsent: number;
  totalPermission: number;
  attendanceRate: number;
  includedReportDates: string[];
  feedingSummary: {
    totalChildrenFed: number;
    totalVolunteers: number;
    totalFoodKg: number;
    lessonCount: number;
    gameCount: number;
    nothingCount: number;
  };
  dailyBreakdowns: Array<{
    date: string;
    ethDateStr: string;
    present: number;
    absent: number;
    permission: number;
    rate: number;
    feeding?: DailyFeedingReport;
  }>;
  gapsAndChallenges: Array<{
    date: string;
    ethDateStr: string;
    coordinator: string;
    notes: string;
  }>;
} {
  const monthInfo = ETHIOPIAN_MONTHS.find((m) => m.number === ethMonth) || ETHIOPIAN_MONTHS[0];
  const ethMonthName = monthInfo.amharicName;
  const daysInMonth = getDaysInEthiopianMonth(ethYear, ethMonth);

  const startDate = ethiopianToIso(ethYear, ethMonth, 1);
  const endDate = ethiopianToIso(ethYear, ethMonth, daysInMonth);

  const weeklyResult = calculateWeeklySummary(
    startDate,
    endDate,
    students,
    attendanceHistory,
    feedingReports
  );

  const label = `${ethMonthName} ${ethYear} ዓ.ም`;

  return {
    ethYear,
    ethMonth,
    ethMonthName,
    startDate,
    endDate,
    label,
    totalStudents: weeklyResult.totalStudents,
    totalDays: weeklyResult.totalDays,
    totalPresent: weeklyResult.totalPresent,
    totalAbsent: weeklyResult.totalAbsent,
    totalPermission: weeklyResult.totalPermission,
    attendanceRate: weeklyResult.attendanceRate,
    includedReportDates: weeklyResult.includedReportDates,
    feedingSummary: weeklyResult.feedingSummary,
    dailyBreakdowns: weeklyResult.dailyBreakdowns,
    gapsAndChallenges: weeklyResult.gapsAndChallenges,
  };
}

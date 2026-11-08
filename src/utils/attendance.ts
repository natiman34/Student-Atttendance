import type { AttendanceStatus, DayAttendance, Student, BackupData } from '../types.ts';

import {
  formatIsoToEthiopianDisplay,
  isoToEthiopian,
  ETHIOPIAN_MONTHS,
} from './ethiopianCalendar.ts';

export function formatRollNumber(num: number): string {
  if (num < 10) return `00${num}`;
  if (num < 100) return `0${num}`;
  return `${num}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  return formatIsoToEthiopianDisplay(dateStr, { includeEra: true });
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const eth = isoToEthiopian(dateStr);
  const m = ETHIOPIAN_MONTHS[eth.month - 1] || ETHIOPIAN_MONTHS[0];
  return `${m.amharicName} ${eth.day}`;
}

export function getGreeting(lang: 'en' | 'am' = 'en'): string {
  const hour = new Date().getHours();
  if (lang === 'am') {
    if (hour < 12) return 'እንደምን አደሩ 👋';
    if (hour < 17) return 'እንደምን ዋሉ 👋';
    return 'እንደምን አመሹ 👋';
  }
  if (hour < 12) return 'Good Morning 👋';
  if (hour < 17) return 'Good Afternoon 👋';
  return 'Good Evening 👋';
}

export interface DayStats {
  present: number;
  absent: number;
  permission: number;
  late: number;
  unrecorded: number;
  totalStudents: number;
  attendanceRate: number; // percentage (0 - 100)
}

export function calculateDayStats(
  students: Student[],
  records: Record<string, AttendanceStatus> | undefined,
  options?: { treatBlankAsAbsent?: boolean }
): DayStats {
  const totalStudents = students.length;
  if (!records || totalStudents === 0) {
    const isTreatBlank = options?.treatBlankAsAbsent ?? false;
    return {
      present: 0,
      absent: isTreatBlank ? totalStudents : 0,
      permission: 0,
      late: 0,
      unrecorded: isTreatBlank ? 0 : totalStudents,
      totalStudents,
      attendanceRate: 0,
    };
  }

  let present = 0;
  let absent = 0;
  let permission = 0;
  let late = 0;
  let recordedCount = 0;

  for (const student of students) {
    const status = records[student.id];
    if (status === 'present') {
      present++;
      recordedCount++;
    } else if (status === 'absent') {
      absent++;
      recordedCount++;
    } else if (status === 'permission') {
      permission++;
      recordedCount++;
    } else if (status === 'late') {
      late++;
      recordedCount++;
    } else if (options?.treatBlankAsAbsent) {
      absent++;
      recordedCount++;
    }
  }

  const unrecorded = totalStudents - recordedCount;
  const attendanceRate =
    totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;

  return {
    present,
    absent,
    permission,
    late,
    unrecorded,
    totalStudents,
    attendanceRate,
  };
}

export interface StudentStats {
  present: number;
  absent: number;
  permission: number;
  late: number;
  totalDays: number;
  rate: number; // percentage
  recentHistory: { date: string; status: AttendanceStatus; note?: string }[];
}

export function calculateStudentStats(
  studentId: string,
  history: DayAttendance[]
): StudentStats {
  let present = 0;
  let absent = 0;
  let permission = 0;
  let late = 0;
  const recentHistory: { date: string; status: AttendanceStatus; note?: string }[] = [];

  // Sort history newest first
  const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

  for (const day of sortedHistory) {
    const status = day.records[studentId];
    if (status) {
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'permission') permission++;
      else if (status === 'late') late++;

      recentHistory.push({
        date: day.date,
        status,
        note: day.notes?.[studentId],
      });
    }
  }

  const totalDays = present + absent + permission + late;
  const rate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

  return {
    present,
    absent,
    permission,
    late,
    totalDays,
    rate,
    recentHistory,
  };
}

export function exportAttendanceToCSV(
  students: Student[],
  history: DayAttendance[]
): string {
  const rows: string[] = ['Date,Student Number,Student Name,Status'];
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  // Sort history chronologically descending
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));

  for (const day of sorted) {
    for (const student of students) {
      const status = day.records[student.id];
      if (status) {
        const statusLabel =
          status === 'present'
            ? 'Present'
            : status === 'absent'
            ? 'Absent'
            : status === 'permission'
            ? 'Permission'
            : 'Late';
        // Escape quotes if student name has commas
        const escapedName = student.name.includes(',')
          ? `"${student.name.replace(/"/g, '""')}"`
          : student.name;
        rows.push(
          `${day.date},${student.rollNumber},${escapedName},${statusLabel}`
        );
      }
    }
  }

  return rows.join('\r\n');
}

export function exportStudentsToCSV(students: Student[]): string {
  const rows: string[] = ['Student Number,Name'];
  for (const s of students) {
    const escapedName = s.name.includes(',')
      ? `"${s.name.replace(/"/g, '""')}"`
      : s.name;
    rows.push(`${s.rollNumber},${escapedName}`);
  }
  return rows.join('\r\n');
}

export function parseStudentsFromCSV(
  csvText: string
): { rollNumber: number; name: string }[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const result: { rollNumber: number; name: string }[] = [];
  let autoRoll = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Check if header line
    if (i === 0 && line.toLowerCase().includes('student') && line.toLowerCase().includes('name')) {
      continue;
    }

    // Split handling quotes
    const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex === 0) break;
    }

    if (matches.length >= 2) {
      const rollNum = parseInt(matches[0], 10);
      const name = matches[1];
      if (name) {
        result.push({
          rollNumber: isNaN(rollNum) ? autoRoll++ : rollNum,
          name,
        });
      }
    } else if (matches.length === 1 && matches[0]) {
      // Just a name
      result.push({
        rollNumber: autoRoll++,
        name: matches[0],
      });
    }
  }

  return result;
}

export function validateBackupData(data: unknown): BackupData | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Partial<BackupData>;

  if (!Array.isArray(obj.students)) return null;
  if (!Array.isArray(obj.attendance)) return null;

  // Validate students
  const validStudents: Student[] = [];
  for (const s of obj.students) {
    if (
      s &&
      typeof s.id === 'string' &&
      typeof s.name === 'string' &&
      typeof s.rollNumber === 'number'
    ) {
      validStudents.push({
        id: s.id,
        name: s.name.trim(),
        rollNumber: s.rollNumber,
      });
    }
  }

  // Validate attendance
  const validAttendance: DayAttendance[] = [];
  for (const a of obj.attendance) {
    if (a && typeof a.date === 'string' && typeof a.records === 'object') {
      const records: Record<string, AttendanceStatus> = {};
      for (const [sId, st] of Object.entries(a.records)) {
        if (st === 'present' || st === 'absent' || st === 'permission' || st === 'late') {
          records[sId] = st;
        }
      }
      validAttendance.push({
        date: a.date,
        records,
        updatedAt: typeof a.updatedAt === 'number' ? a.updatedAt : Date.now(),
      });
    }
  }

  return {
    version: obj.version || 1,
    students: validStudents,
    attendance: validAttendance,
    exportedAt: obj.exportedAt || new Date().toISOString(),
  };
}

export function getISOWeekNumber(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

export function groupAttendanceByWeeks(
  attendanceHistory: DayAttendance[]
): import('../types.ts').WeekGroup[] {
  const groupsMap = new Map<string, { weekNumber: number; year: number; dates: Set<string>; days: import('../types.ts').DayAttendance[] }>();

  // Sort chronologically ascending to calculate week order
  const sorted = [...attendanceHistory].sort((a, b) => a.date.localeCompare(b.date));

  for (const day of sorted) {
    const parts = day.date.split('-');
    if (parts.length !== 3) continue;
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const { year, week } = getISOWeekNumber(dateObj);
    const weekKey = `${year}-W${String(week).padStart(2, '0')}`;

    if (!groupsMap.has(weekKey)) {
      groupsMap.set(weekKey, {
        weekNumber: week,
        year,
        dates: new Set<string>(),
        days: [],
      });
    }

    const group = groupsMap.get(weekKey)!;
    group.dates.add(day.date);
    group.days.push(day);
  }

  const result: import('../types.ts').WeekGroup[] = [];
  const entries = Array.from(groupsMap.entries());

  entries.forEach(([weekKey, data], index) => {
    const sortedDates = Array.from(data.dates).sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    const label = `Week ${index + 1} (${formatShortDate(startDate)} - ${formatShortDate(endDate)})`;

    result.push({
      weekKey,
      weekNumber: index + 1,
      year: data.year,
      label,
      startDate,
      endDate,
      dates: sortedDates,
      days: data.days.sort((a, b) => b.date.localeCompare(a.date)),
    });
  });

  // Return newest week first for UI display
  return result.reverse();
}

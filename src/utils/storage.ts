import {
  Student,
  DayAttendance,
  BackupData,
  AppSettings,
  DailyFeedingReport,
  SavedWeeklyReport,
  SavedMonthlyReport,
  SavedTermlyReport,
  SavedAnnualReport,
  BackupHistoryEntry,
  SchoolHoliday,
  SchoolTerm,
} from '../types.ts';
import { validateBackupData } from './attendance.ts';

const STORAGE_KEY_STUDENTS = 'rollcall_students_v2';
const STORAGE_KEY_ATTENDANCE = 'rollcall_attendance_v2';
const STORAGE_KEY_SETTINGS = 'rollcall_settings_v2';
const STORAGE_KEY_THEME = 'rollcall_theme_v2';
const STORAGE_KEY_FEEDING = 'rollcall_feeding_reports_v2';
const STORAGE_KEY_WEEKLY_REPORTS = 'rollcall_weekly_reports_v1';
const STORAGE_KEY_MONTHLY_REPORTS = 'rollcall_monthly_reports_v1';
const STORAGE_KEY_TERMLY_REPORTS = 'rollcall_termly_reports_v1';
const STORAGE_KEY_ANNUAL_REPORTS = 'rollcall_annual_reports_v1';
const STORAGE_KEY_BACKUP_HISTORY = 'rollcall_backup_history_v1';

export const DEFAULT_ETHIOPIAN_HOLIDAYS: SchoolHoliday[] = [
  { id: 'hol-1', date: '2026-09-11', name: 'Enkutatash (Ethiopian New Year)', amharicName: 'እንቁጣጣሽ (አዲስ ዓመት)', type: 'national' },
  { id: 'hol-2', date: '2026-09-27', name: 'Meskel (Finding of True Cross)', amharicName: 'መስቀል', type: 'religious' },
  { id: 'hol-3', date: '2027-01-07', name: 'Genna (Ethiopian Christmas)', amharicName: 'ገና (የገና በዓል)', type: 'religious' },
  { id: 'hol-4', date: '2027-01-19', name: 'Timkat (Epiphany)', amharicName: 'ጥምቀት', type: 'religious' },
  { id: 'hol-5', date: '2027-03-02', name: 'Victory of Adwa', amharicName: 'የዓድዋ ድል በዓል', type: 'national' },
  { id: 'hol-6', date: '2027-04-30', name: 'Siklet (Good Friday)', amharicName: 'ስቅለት', type: 'religious' },
  { id: 'hol-7', date: '2027-05-02', name: 'Fasika (Easter)', amharicName: 'ፋሲካ', type: 'religious' },
  { id: 'hol-8', date: '2027-05-05', name: "Patriots' Day", amharicName: 'የአርበኞች ቀን', type: 'national' },
];

export const DEFAULT_SCHOOL_TERMS: SchoolTerm[] = [
  {
    id: 'term-1',
    name: 'Semester 1',
    amharicName: '1ኛ ሴሚስተር (መስከረም - ጥር)',
    startDate: '2026-09-11',
    endDate: '2027-02-07',
    academicYear: '2026 - 2027',
  },
  {
    id: 'term-2',
    name: 'Semester 2',
    amharicName: '2ኛ ሴሚስተር (የካቲት - ሰኔ)',
    startDate: '2027-02-08',
    endDate: '2027-07-07',
    academicYear: '2026 - 2027',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  schoolName: '',
  className: '',
  teacherName: 'Teacher',
  academicYear: '2026 - 2027',
  targetAttendanceRate: 75,
  defaultStatus: 'unmarked',
  enableLateStatus: false,
  theme: 'light',
  language: 'en',
  calendarPreference: 'ethiopian',
  holidays: DEFAULT_ETHIOPIAN_HOLIDAYS,
  terms: DEFAULT_SCHOOL_TERMS,
};

export function initializeStorage(): {
  students: Student[];
  attendance: DayAttendance[];
  feedingReports: DailyFeedingReport[];
  weeklyReports: SavedWeeklyReport[];
  monthlyReports: SavedMonthlyReport[];
  termlyReports: SavedTermlyReport[];
  annualReports: SavedAnnualReport[];
  settings: AppSettings;
} {
  let students: Student[] = [];
  let attendance: DayAttendance[] = [];
  let feedingReports: DailyFeedingReport[] = [];
  let weeklyReports: SavedWeeklyReport[] = [];
  let monthlyReports: SavedMonthlyReport[] = [];
  let termlyReports: SavedTermlyReport[] = [];
  let annualReports: SavedAnnualReport[] = [];
  let settings: AppSettings = { ...DEFAULT_SETTINGS };

  try {
    localStorage.removeItem('rollcall_students_v1');
    localStorage.removeItem('rollcall_attendance_v1');

    const storedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
    const storedAttendance = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const storedFeeding = localStorage.getItem(STORAGE_KEY_FEEDING);
    const storedWeekly = localStorage.getItem(STORAGE_KEY_WEEKLY_REPORTS);
    const storedMonthly = localStorage.getItem(STORAGE_KEY_MONTHLY_REPORTS);
    const storedTermly = localStorage.getItem(STORAGE_KEY_TERMLY_REPORTS);
    const storedAnnual = localStorage.getItem(STORAGE_KEY_ANNUAL_REPORTS);

    if (storedStudents) {
      const parsed = JSON.parse(storedStudents);
      if (Array.isArray(parsed)) {
        students = parsed;
      }
    }

    if (storedAttendance) {
      const parsedAtt = JSON.parse(storedAttendance);
      if (Array.isArray(parsedAtt)) {
        attendance = parsedAtt;
      }
    }

    if (storedFeeding) {
      feedingReports = JSON.parse(storedFeeding);
    }

    if (storedWeekly) {
      weeklyReports = JSON.parse(storedWeekly);
    }

    if (storedMonthly) {
      monthlyReports = JSON.parse(storedMonthly);
    }

    if (storedTermly) {
      termlyReports = JSON.parse(storedTermly);
    }

    if (storedAnnual) {
      annualReports = JSON.parse(storedAnnual);
    }

    if (storedSettings) {
      const parsedSett = JSON.parse(storedSettings);
      if (parsedSett.className === 'Grade 10 - Class A' || parsedSett.className?.includes('Grade 10')) {
        parsedSett.className = '';
      }
      settings = { ...DEFAULT_SETTINGS, ...parsedSett };
    }
  } catch (e) {
    console.error('Failed to parse stored data:', e);
  }

  return {
    students,
    attendance,
    feedingReports,
    weeklyReports,
    monthlyReports,
    termlyReports,
    annualReports,
    settings,
  };
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students:', e);
  }
}

export function saveAttendance(attendance: DayAttendance[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendance));
  } catch (e) {
    console.error('Failed to save attendance:', e);
  }
}

export function saveFeedingReports(reports: DailyFeedingReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FEEDING, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save feeding reports:', e);
  }
}

export function loadFeedingReports(): DailyFeedingReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEEDING);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load feeding reports:', e);
  }
  return [];
}

export function saveFeedingReport(report: DailyFeedingReport): DailyFeedingReport[] {
  const current = loadFeedingReports();
  // Check if report with same id OR same date already exists to prevent duplicate entries
  const index = current.findIndex((r) => r.id === report.id || r.date === report.date);
  let updated: DailyFeedingReport[];
  if (index >= 0) {
    const existing = current[index];
    updated = [...current];
    updated[index] = {
      ...existing,
      ...report,
      id: existing.id || report.id,
      createdAt: existing.createdAt || report.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  } else {
    updated = [{ ...report, createdAt: report.createdAt || Date.now() }, ...current];
  }
  // Sort descending by date
  updated.sort((a, b) => b.date.localeCompare(a.date));
  saveFeedingReports(updated);
  return updated;
}

export function deleteFeedingReport(id: string): DailyFeedingReport[] {
  const current = loadFeedingReports();
  const updated = current.filter((r) => r.id !== id);
  saveFeedingReports(updated);
  return updated;
}

export function saveWeeklyReports(reports: SavedWeeklyReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_WEEKLY_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save weekly reports:', e);
  }
}

export function loadWeeklyReports(): SavedWeeklyReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WEEKLY_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load weekly reports:', e);
  }
  return [];
}

export function saveWeeklyReport(report: SavedWeeklyReport): SavedWeeklyReport[] {
  const current = loadWeeklyReports();
  const index = current.findIndex((r) => r.id === report.id || r.periodKey === report.periodKey);
  let updated: SavedWeeklyReport[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...report, updatedAt: Date.now() };
  } else {
    updated = [{ ...report, createdAt: report.createdAt || Date.now() }, ...current];
  }
  updated.sort((a, b) => b.startDate.localeCompare(a.startDate));
  saveWeeklyReports(updated);
  return updated;
}

export function deleteWeeklyReport(id: string): SavedWeeklyReport[] {
  const current = loadWeeklyReports();
  const updated = current.filter((r) => r.id !== id);
  saveWeeklyReports(updated);
  return updated;
}

export function saveMonthlyReports(reports: SavedMonthlyReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MONTHLY_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save monthly reports:', e);
  }
}

export function loadMonthlyReports(): SavedMonthlyReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MONTHLY_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load monthly reports:', e);
  }
  return [];
}

export function saveMonthlyReport(report: SavedMonthlyReport): SavedMonthlyReport[] {
  const current = loadMonthlyReports();
  const index = current.findIndex((r) => r.id === report.id || r.periodKey === report.periodKey);
  let updated: SavedMonthlyReport[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...report, updatedAt: Date.now() };
  } else {
    updated = [{ ...report, createdAt: report.createdAt || Date.now() }, ...current];
  }
  updated.sort((a, b) => b.startDate.localeCompare(a.startDate));
  saveMonthlyReports(updated);
  return updated;
}

export function deleteMonthlyReport(id: string): SavedMonthlyReport[] {
  const current = loadMonthlyReports();
  const updated = current.filter((r) => r.id !== id);
  saveMonthlyReports(updated);
  return updated;
}

export function saveTermlyReports(reports: SavedTermlyReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TERMLY_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save termly reports:', e);
  }
}

export function loadTermlyReports(): SavedTermlyReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TERMLY_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load termly reports:', e);
  }
  return [];
}

export function saveTermlyReport(report: SavedTermlyReport): SavedTermlyReport[] {
  const current = loadTermlyReports();
  const index = current.findIndex((r) => r.id === report.id || (r.termId === report.termId && r.academicYear === report.academicYear));
  let updated: SavedTermlyReport[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...report, updatedAt: Date.now() };
  } else {
    updated = [{ ...report, createdAt: report.createdAt || Date.now() }, ...current];
  }
  updated.sort((a, b) => b.startDate.localeCompare(a.startDate));
  saveTermlyReports(updated);
  return updated;
}

export function deleteTermlyReport(id: string): SavedTermlyReport[] {
  const current = loadTermlyReports();
  const updated = current.filter((r) => r.id !== id);
  saveTermlyReports(updated);
  return updated;
}

export function saveAnnualReports(reports: SavedAnnualReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ANNUAL_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save annual reports:', e);
  }
}

export function loadAnnualReports(): SavedAnnualReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANNUAL_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load annual reports:', e);
  }
  return [];
}

export function saveAnnualReport(report: SavedAnnualReport): SavedAnnualReport[] {
  const current = loadAnnualReports();
  const index = current.findIndex((r) => r.id === report.id || r.academicYear === report.academicYear);
  let updated: SavedAnnualReport[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...report, updatedAt: Date.now() };
  } else {
    updated = [{ ...report, createdAt: report.createdAt || Date.now() }, ...current];
  }
  saveAnnualReports(updated);
  return updated;
}

export function deleteAnnualReport(id: string): SavedAnnualReport[] {
  const current = loadAnnualReports();
  const updated = current.filter((r) => r.id !== id);
  saveAnnualReports(updated);
  return updated;
}

export function loadBackupHistory(): BackupHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BACKUP_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load backup history:', e);
  }
  return [];
}

export function addBackupHistoryEntry(entry: BackupHistoryEntry): BackupHistoryEntry[] {
  try {
    const history = loadBackupHistory();
    const updated = [entry, ...history].slice(0, 20); // keep last 20 entries
    localStorage.setItem(STORAGE_KEY_BACKUP_HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to add backup history:', e);
    return [];
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveDayAttendance(day: DayAttendance): DayAttendance[] {
  const current = loadAttendance();
  const index = current.findIndex((d) => d.date === day.date);
  let updated: DayAttendance[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = day;
  } else {
    updated = [day, ...current];
  }
  // Sort descending by date
  updated.sort((a, b) => b.date.localeCompare(a.date));
  saveAttendance(updated);
  return updated;
}

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load students:', e);
  }
  return [];
}

export function getActiveStudents(students?: Student[]): Student[] {
  const list = students || loadStudents();
  return list.filter((s) => !s.isArchived);
}

export function getArchivedStudents(students?: Student[]): Student[] {
  const list = students || loadStudents();
  return list.filter((s) => !!s.isArchived);
}

export function archiveStudent(studentId: string, reason?: string): Student[] {
  const current = loadStudents();
  const updated = current.map((s) => {
    if (s.id === studentId) {
      return {
        ...s,
        isArchived: true,
        archivedAt: Date.now(),
        archiveReason: reason || 'Archived',
      };
    }
    return s;
  });
  saveStudents(updated);
  return updated;
}

export function unarchiveStudent(studentId: string): Student[] {
  const current = loadStudents();
  const updated = current.map((s) => {
    if (s.id === studentId) {
      const { isArchived, archivedAt, archiveReason, ...rest } = s;
      return { ...rest, isArchived: false };
    }
    return s;
  });
  saveStudents(updated);
  return updated;
}

export function loadAttendance(): DayAttendance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load attendance:', e);
  }
  return [];
}

export function clearAllStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_STUDENTS);
    localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
    localStorage.removeItem(STORAGE_KEY_FEEDING);
    localStorage.removeItem(STORAGE_KEY_WEEKLY_REPORTS);
    localStorage.removeItem(STORAGE_KEY_MONTHLY_REPORTS);
    localStorage.removeItem(STORAGE_KEY_TERMLY_REPORTS);
    localStorage.removeItem(STORAGE_KEY_ANNUAL_REPORTS);
    localStorage.removeItem(STORAGE_KEY_BACKUP_HISTORY);
    localStorage.removeItem('rollcall_students_v1');
    localStorage.removeItem('rollcall_attendance_v1');
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // fallback
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch {
    // fallback
  }
}

export function createBackupPayload(
  students: Student[],
  attendance: DayAttendance[],
  feedingReports?: DailyFeedingReport[],
  weeklyReports?: SavedWeeklyReport[],
  monthlyReports?: SavedMonthlyReport[],
  termlyReports?: SavedTermlyReport[],
  annualReports?: SavedAnnualReport[],
  settings?: AppSettings
): BackupData {
  const backup: BackupData = {
    version: 4,
    students,
    attendance,
    feedingReports: feedingReports || loadFeedingReports(),
    weeklyReports: weeklyReports || loadWeeklyReports(),
    monthlyReports: monthlyReports || loadMonthlyReports(),
    termlyReports: termlyReports || loadTermlyReports(),
    annualReports: annualReports || loadAnnualReports(),
    settings,
    backupHistory: loadBackupHistory(),
    exportedAt: new Date().toISOString(),
  };

  // Add history record
  addBackupHistoryEntry({
    id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    fileSizeBytes: JSON.stringify(backup).length,
    recordCount: {
      students: students.length,
      attendance: attendance.length,
      feeding: (feedingReports || loadFeedingReports()).length,
      reports: (weeklyReports || []).length + (monthlyReports || []).length,
    },
  });

  return backup;
}

export function parseAndRestoreBackup(
  jsonText: string
): { success: boolean; data?: BackupData; error?: string } {
  try {
    const parsed = JSON.parse(jsonText);
    const valid = validateBackupData(parsed);
    if (!valid) {
      return {
        success: false,
        error: 'Invalid backup format or corrupted file.',
      };
    }
    saveStudents(valid.students);
    saveAttendance(valid.attendance);
    if (Array.isArray(parsed.feedingReports)) {
      saveFeedingReports(parsed.feedingReports);
    }
    if (Array.isArray(parsed.weeklyReports)) {
      saveWeeklyReports(parsed.weeklyReports);
    }
    if (Array.isArray(parsed.monthlyReports)) {
      saveMonthlyReports(parsed.monthlyReports);
    }
    if (Array.isArray(parsed.termlyReports)) {
      saveTermlyReports(parsed.termlyReports);
    }
    if (Array.isArray(parsed.annualReports)) {
      saveAnnualReports(parsed.annualReports);
    }
    if (valid.settings) {
      saveSettings({ ...DEFAULT_SETTINGS, ...valid.settings });
    }
    if (Array.isArray(parsed.backupHistory)) {
      localStorage.setItem(STORAGE_KEY_BACKUP_HISTORY, JSON.stringify(parsed.backupHistory));
    }
    return {
      success: true,
      data: {
        ...valid,
        feedingReports: Array.isArray(parsed.feedingReports) ? parsed.feedingReports : [],
        weeklyReports: Array.isArray(parsed.weeklyReports) ? parsed.weeklyReports : [],
        monthlyReports: Array.isArray(parsed.monthlyReports) ? parsed.monthlyReports : [],
        termlyReports: Array.isArray(parsed.termlyReports) ? parsed.termlyReports : [],
        annualReports: Array.isArray(parsed.annualReports) ? parsed.annualReports : [],
        backupHistory: Array.isArray(parsed.backupHistory) ? parsed.backupHistory : [],
      },
    };
  } catch (e: any) {
    return {
      success: false,
      error: `Could not parse backup file: ${e.message || 'Invalid JSON'}`,
    };
  }
}

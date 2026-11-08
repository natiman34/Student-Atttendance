export type ActiveAttendanceStatus = 'present' | 'absent' | 'permission';
export type AttendanceStatus = 'present' | 'absent' | 'permission' | 'late';

export interface Student {
  id: string;
  rollNumber: number;
  studentIdNumber?: string; // Unique student ID (e.g. STU-001)
  name: string;
  gender?: 'M' | 'F' | string;
  grade?: string;
  section?: string;
  notes?: string;
  isArchived?: boolean; // Active vs Archived student record
  archivedAt?: number;
  archiveReason?: string;
  createdAt?: number;
}

export interface StudentDraftPayload {
  name: string;
  rollNumber: number;
  studentIdNumber?: string;
  gender?: string;
  grade?: string;
  section?: string;
  notes?: string;
  isArchived?: boolean;
  archiveReason?: string;
  editingStudentId?: string | null;
  updatedAt: number;
}

export interface AttendanceAuditEntry {
  timestamp: number;
  reason: string;
  author?: string;
  teacherName?: string;
  previousCounts?: { present: number; absent: number; permission: number };
  newCounts?: { present: number; absent: number; permission: number };
  previousStats?: { present: number; absent: number; permission: number };
  newStats?: { present: number; absent: number; permission: number };
}

export interface DayAttendance {
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceStatus>; // studentId -> status
  notes?: Record<string, string>; // studentId -> quick note (e.g. 'sick', 'left early')
  auditLog?: AttendanceAuditEntry[]; // Modification history with confirmation reason
  createdAt?: number;
  updatedAt: number;
}

export interface SchoolHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  amharicName: string;
  nameAm?: string;
  nameEn?: string;
  type: 'national' | 'religious' | 'school';
}

export interface SchoolTerm {
  id: string; // e.g. "term-1", "term-2", "term-3"
  name: string;
  amharicName: string;
  nameAm?: string;
  nameEn?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  academicYear: string;
}

export interface AppSettings {
  schoolName?: string;
  className: string;
  teacherName: string;
  academicYear: string;
  targetAttendanceRate: number; // e.g., 75
  defaultStatus: 'unmarked' | 'present';
  enableLateStatus?: boolean; // Do not introduce a Late status unless explicitly enabled
  theme: 'light' | 'dark' | 'system';
  language?: 'en' | 'am';
  calendarPreference?: 'ethiopian' | 'gregorian';
  holidays?: SchoolHoliday[];
  terms?: SchoolTerm[];
}

export interface WeekGroup {
  weekKey: string; // e.g., "2026-W42"
  weekNumber: number;
  year: number;
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dates: string[];
  days: DayAttendance[];
}

export type LessonOrGameType = 'lesson' | 'game' | 'none';

export interface FeedingActivityRow {
  id: string;
  orderNumber: number; // ተ.ቁ (1, 2, 3...)
  activityName: string; // ተግባር (e.g. አጠቃላይ አገልግሎቱ, የተሰጠው ትምህርት / ጨዋታ, ምገባ, መዝሙር)
  startTime: string; // ተጀመረ (initially blank "")
  endTime: string; // አለቀ (initially blank "")
  notes?: string;
}

export interface DailyFeedingReport {
  id: string;
  date: string; // YYYY-MM-DD
  grade?: string; // Grade filter/selection
  section?: string; // Section filter/selection
  coordinatorName: string; // የዕለቱ ተረኛ አስተባባሪ
  foodType: string; // የምግቡ አይነት
  foodQuantityKg?: number; // Optional (legacy/backward compatibility)
  location: string; // ምገባው የተከናወነበት ቦታ
  childrenCount: number; // ምገባው ላይ የተሳተፉ ህፃናት ቁጥር
  volunteersCount: number; // የተሳተፉ አገልጋዮች ብዛት
  activityType: LessonOrGameType; // የተሰጠው ትምህርት ወይም ጨዋታ: 'lesson' | 'game'
  activities: FeedingActivityRow[];
  participatedStudentIds?: string[]; // Individual student feeding participation list
  generalNotes?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface SavedWeeklyReport {
  id: string; // e.g. "week-2019-W08" or uuid
  periodKey: string; // e.g. "2019-W08"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  ethiopianLabel: string; // e.g. "ጥቅምት 12 - ጥቅምት 18 ቀን 2019 ዓ.ም"
  gregorianLabel: string;
  totalStudents: number;
  totalDays: number;
  totalPresent: number;
  totalAbsent: number;
  totalPermission: number;
  attendanceRate: number;
  includedReportDates: string[];
  feedingSummary?: {
    totalChildrenFed: number;
    totalVolunteers: number;
    totalFoodKg: number;
    lessonCount: number;
    gameCount: number;
    nothingCount: number;
  };
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavedMonthlyReport {
  id: string; // e.g. "month-2019-02"
  ethYear: number;
  ethMonth: number; // 1 to 13
  ethMonthName: string; // e.g. "ጥቅምት"
  periodKey: string; // e.g. "2019-02"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string; // e.g. "ጥቅምት 2019 ዓ.ም"
  totalStudents: number;
  totalDays: number;
  totalPresent: number;
  totalAbsent: number;
  totalPermission: number;
  attendanceRate: number;
  includedReportDates: string[];
  feedingSummary?: {
    totalChildrenFed: number;
    totalVolunteers: number;
    totalFoodKg: number;
    lessonCount: number;
    gameCount: number;
    nothingCount: number;
  };
  generalNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavedTermlyReport {
  id: string; // e.g. "term-2019-1"
  termId: string;
  termName: string;
  termAmharicName: string;
  academicYear: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalStudents: number;
  totalSchoolDays: number;
  totalPresent: number;
  totalAbsent: number;
  totalPermission: number;
  attendanceRate: number;
  includedReportDates: string[];
  feedingSummary?: {
    totalChildrenFed: number;
    totalVolunteers: number;
    lessonCount: number;
    gameCount: number;
    nothingCount: number;
  };
  generalNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavedAnnualReport {
  id: string; // e.g. "annual-2019"
  academicYear: string;
  startDate: string;
  endDate: string;
  totalStudents: number;
  totalSchoolDays: number;
  totalPresent: number;
  totalAbsent: number;
  totalPermission: number;
  attendanceRate: number;
  termsBreakdown: Array<{
    termName: string;
    rate: number;
    present: number;
    absent: number;
  }>;
  feedingSummary?: {
    totalChildrenFed: number;
    totalVolunteers: number;
  };
  generalNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BackupHistoryEntry {
  id?: string;
  timestamp: number;
  summary?: string;
  fileSizeBytes?: number;
  totalStudents?: number;
  totalAttendanceDays?: number;
  totalFeedingReports?: number;
  recordCount?: {
    students: number;
    attendance: number;
    feeding: number;
    reports?: number;
  };
}

export interface BackupData {
  version: number;
  students: Student[];
  attendance: DayAttendance[];
  feedingReports?: DailyFeedingReport[];
  weeklyReports?: SavedWeeklyReport[];
  monthlyReports?: SavedMonthlyReport[];
  termlyReports?: SavedTermlyReport[];
  annualReports?: SavedAnnualReport[];
  settings?: Partial<AppSettings>;
  backupHistory?: BackupHistoryEntry[];
  exportedAt: string;
}

export type TabType =
  | 'home'
  | 'attendance'
  | 'students'
  | 'reports'
  | 'data'
  | 'history'
  | 'settings';

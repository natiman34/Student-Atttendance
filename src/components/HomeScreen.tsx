import React, { useState } from 'react';
import type { Student, DayAttendance, AppSettings, DailyFeedingReport } from '../types.ts';
import {
  calculateDayStats,
  formatDisplayDate,
  getGreeting,
  getTodayDateString,
} from '../utils/attendance.ts';
import { AppLogo } from './AppLogo.tsx';
import {
  exportCombinedReportPDF,
  exportCombinedReportWord,
  exportCombinedReportExcel,
} from '../utils/reportExports.ts';
import {
  ReportValidationModal,
  type ReportValidationErrorType,
  type ValidationAction,
} from './ReportValidationModal.tsx';
import { validateReportBeforeExport } from '../utils/reportAggregations.ts';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  UserPlus,
  CalendarDays,
  Edit3,
  FileSpreadsheet,
  Download,
  Utensils,
  FileDown,
  Sparkles,
  FileText,
  FileCheck2,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext.tsx';

interface HomeScreenProps {
  students: Student[];
  attendanceHistory: DayAttendance[];
  feedingReports?: DailyFeedingReport[];
  settings: AppSettings;
  onTakeAttendance: (date?: string) => void;
  onViewDate: (date: string) => void;
  onNavigateToStudents: () => void;
  onNavigateToReports?: (subTab?: 'feeding' | 'attendance' | 'history' | 'export') => void;
  onOpenExcelImport: () => void;
  onOpenInstallModal?: () => void;
  onLoadSampleData?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  students,
  attendanceHistory,
  feedingReports = [],
  settings,
  onTakeAttendance,
  onViewDate,
  onNavigateToStudents,
  onNavigateToReports,
  onOpenExcelImport,
  onOpenInstallModal,
  onLoadSampleData,
}) => {
  const { language, t } = useTranslation();
  const todayStr = getTodayDateString();
  const greeting = getGreeting(language);
  const activeStudents = students.filter((s) => !s.isArchived);
  const archivedStudents = students.filter((s) => s.isArchived);
  const todayRecord = attendanceHistory.find((a) => a.date === todayStr);
  const isTodayTaken = !!todayRecord && Object.keys(todayRecord.records).length > 0;
  const todayStats = calculateDayStats(activeStudents, todayRecord?.records);

  // Today's feeding report
  const todayFeeding = feedingReports.find((f) => f.date === todayStr);

  // Grade and section summaries
  const gradeMap = new Map<string, { total: number; present: number }>();
  activeStudents.forEach((s) => {
    const key = s.grade ? `Grade ${s.grade}${s.section ? `-${s.section}` : ''}` : (language === 'am' ? 'ያልተመደበ' : 'Unassigned');
    const existing = gradeMap.get(key) || { total: 0, present: 0 };
    existing.total += 1;
    if (isTodayTaken && todayRecord?.records[s.id] === 'present') {
      existing.present += 1;
    }
    gradeMap.set(key, existing);
  });
  const gradeSummaries = Array.from(gradeMap.entries()).map(([label, data]) => ({
    label,
    total: data.total,
    present: data.present,
    rate: isTodayTaken && data.total > 0 ? Math.round((data.present / data.total) * 100) : null,
  }));

  // Weekly attendance trend (last 5 sessions)
  const recentSessions = [...attendanceHistory]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .reverse();

  // Monthly comparison
  const thisMonthPrefix = todayStr.substring(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthPrefix = lastMonthDate.toISOString().substring(0, 7);

  const thisMonthDays = attendanceHistory.filter((d) => d.date.startsWith(thisMonthPrefix));
  const lastMonthDays = attendanceHistory.filter((d) => d.date.startsWith(lastMonthPrefix));

  const calcAvgRate = (days: DayAttendance[]) => {
    if (days.length === 0 || activeStudents.length === 0) return 0;
    let totalPresent = 0;
    days.forEach((d) => {
      totalPresent += Object.values(d.records).filter((st) => st === 'present').length;
    });
    return Math.round((totalPresent / (days.length * activeStudents.length)) * 100);
  };

  const thisMonthAvg = calcAvgRate(thisMonthDays);
  const lastMonthAvg = calcAvgRate(lastMonthDays);

  // Frequent absences list (active students with attendance rate < 80% across >=2 recorded sessions)
  const chronicAbsenteeStudents = activeStudents.map((s) => {
    let attended = 0;
    let recordedDays = 0;
    attendanceHistory.forEach((day) => {
      const st = day.records[s.id];
      if (st) {
        recordedDays += 1;
        if (st === 'present') attended += 1;
      }
    });
    const rate = recordedDays > 0 ? Math.round((attended / recordedDays) * 100) : 100;
    const missed = recordedDays - attended;
    return { student: s, rate, attended, recordedDays, missed };
  }).filter((item) => item.recordedDays >= 2 && item.rate < 80).sort((a, b) => a.rate - b.rate);

  // Combined recent activities feed
  interface ActivityItem {
    id: string;
    type: 'attendance' | 'feeding';
    date: string;
    timestamp: number;
    title: string;
    details: string;
    badge: string;
  }

  const activitiesList: ActivityItem[] = [
    ...attendanceHistory.map((a) => {
      const pres = Object.values(a.records).filter((st) => st === 'present').length;
      return {
        id: `att_${a.date}`,
        type: 'attendance' as const,
        date: a.date,
        timestamp: a.updatedAt || a.createdAt || new Date(a.date).getTime(),
        title: `${t.attendanceReport}: ${a.date}`,
        details: `${pres} ${t.present} / ${Object.keys(a.records).length} ${t.totalStudents}`,
        badge: `${a.records ? Math.round((pres / Math.max(1, Object.keys(a.records).length)) * 100) : 0}%`,
      };
    }),
    ...feedingReports.map((f) => ({
      id: f.id,
      type: 'feeding' as const,
      date: f.date,
      timestamp: f.updatedAt || f.createdAt || new Date(f.date).getTime(),
      title: `${t.dailyFeeding}: ${f.date}`,
      details: `${f.foodType} • ${f.childrenCount} ${t.childrenFed} (${f.location})`,
      badge: `${f.childrenCount} fed`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  // Export progress & duplicate prevention state
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'word' | 'excel' | null>(null);
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pre-export validation modal state
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    errorType: ReportValidationErrorType;
    missingFields?: string[];
    customMessage?: { amharic: string; english: string };
    actions?: ValidationAction[];
  }>({
    isOpen: false,
    errorType: 'no_students',
  });

  const handleExportTodayReport = async (format: 'pdf' | 'word' | 'excel') => {
    if (exportingFormat) return; // Prevent duplicate rapid clicks

    // Validation 1: Student registration check
    if (students.length === 0) {
      setValidationModal({
        isOpen: true,
        errorType: 'no_students',
        customMessage: {
          amharic: 'እባክዎ መጀመሪያ ተማሪዎችን ይመዝግቡ።',
          english: 'Please register students first before exporting reports.',
        },
        actions: [
          {
            label: 'ተማሪዎችን ይመዝግቡ / Register Students',
            primary: true,
            onClick: () => {
              setValidationModal((prev) => ({ ...prev, isOpen: false }));
              onNavigateToStudents();
            },
          },
        ],
      });
      return;
    }

    // Validation 2: Check if today's attendance and feeding are both empty
    if (!todayRecord && !todayFeeding) {
      setValidationModal({
        isOpen: true,
        errorType: 'no_report_data',
        customMessage: {
          amharic: 'ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።',
          english: 'The report has not been completed. Please fill in the report before exporting or downloading it.',
        },
        actions: [
          {
            label: 'አቴንዳንስ ሙላ / Take Attendance',
            primary: true,
            onClick: () => {
              setValidationModal((prev) => ({ ...prev, isOpen: false }));
              onTakeAttendance(todayStr);
            },
          },
          ...(onNavigateToReports
            ? [
                {
                  label: 'የምገባ ሪፖርት ሙላ / Fill Feeding Report',
                  onClick: () => {
                    setValidationModal((prev) => ({ ...prev, isOpen: false }));
                    onNavigateToReports('feeding');
                  },
                },
              ]
            : []),
        ],
      });
      return;
    }

    // Validation 3: If feeding exists, validate required fields
    if (todayFeeding) {
      const val = validateReportBeforeExport({
        students,
        feeding: todayFeeding,
        checkType: 'feeding',
      });
      if (!val.isValid && val.errorType === 'partial_fields') {
        setValidationModal({
          isOpen: true,
          errorType: 'partial_fields',
          missingFields: val.missingFields,
          actions: onNavigateToReports
            ? [
                {
                  label: 'ሪፖርቱን አሟላ / Complete Feeding Report',
                  primary: true,
                  onClick: () => {
                    setValidationModal((prev) => ({ ...prev, isOpen: false }));
                    onNavigateToReports('feeding');
                  },
                },
              ]
            : undefined,
        });
        return;
      }
    }

    setExportingFormat(format);
    setExportFeedback(null);

    try {
      if (format === 'pdf') {
        await exportCombinedReportPDF(
          todayStr,
          students,
          todayRecord,
          todayFeeding,
          settings
        );
        setExportFeedback({
          type: 'success',
          message: `የተሟላ ሪፖርት (Daily_Report_${todayStr}.pdf) በተሳካ ሁኔታ ወርዷል!`,
        });
      } else if (format === 'word') {
        await exportCombinedReportWord(
          todayStr,
          students,
          todayRecord,
          todayFeeding,
          settings
        );
        setExportFeedback({
          type: 'success',
          message: `የተሟላ ሪፖርት (Daily_Report_${todayStr}.docx) በተሳካ ሁኔታ ወርዷል!`,
        });
      } else if (format === 'excel') {
        exportCombinedReportExcel(
          todayStr,
          students,
          todayRecord,
          todayFeeding,
          settings
        );
        setExportFeedback({
          type: 'success',
          message: `የተሟላ ሪፖርት (Daily_Report_${todayStr}.xlsx) በተሳካ ሁኔታ ተዘጋጅቷል!`,
        });
      }
      setTimeout(() => {
        setExportFeedback(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to export today report:', err);
      setExportFeedback({
        type: 'error',
        message: 'ሪፖርቱን ማውረድ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
      });
    } finally {
      setExportingFormat(null);
    }
  };

  // Recent attendance
  const recentDays = attendanceHistory
    .filter((a) => a.date !== todayStr)
    .slice(0, 5);

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 text-center max-w-md mx-auto">
        <div className="mb-5">
          <AppLogo size="xl" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {language === 'am' ? 'ወደ ሮልኮል እንኳን በደህና መጡ' : 'Welcome to RollCall'}
        </h2>
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 mb-2">
          {t.appSubtitle}
        </p>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
          {language === 'am'
            ? 'አቴንዳንስ እና የዕለት ምገባ መመዝገብ ለመጀመር የተማሪዎችን ዝርዝር ከኤክሴል (.xlsx / .csv) ያስመጡ ወይም ተማሪዎችን በእጅ ይመዝግቡ።'
            : 'Get started by importing your student roster from an Excel (.xlsx / .csv) spreadsheet, or add students manually to record attendance and daily feeding.'}
        </p>

        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={onOpenExcelImport}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#173B65] hover:bg-[#102a4a] text-white font-bold text-sm shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0D9488]" />
            <span>{language === 'am' ? 'የተማሪዎችን መዝገብ አስገባ (Excel / CSV)' : 'Import Excel / CSV Roster'}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToStudents}
            className="w-full py-3 px-5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 font-bold text-sm transition active:scale-[0.98] cursor-pointer"
          >
            {t.addStudentManually}
          </button>

          {onLoadSampleData && (
            <button
              type="button"
              onClick={onLoadSampleData}
              className="w-full py-2.5 px-5 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.loadDemoRoster}</span>
            </button>
          )}

          {onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="w-full py-2.5 px-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer mt-2"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{language === 'am' ? 'አፕ አውርድ (Google Chrome)' : 'Download App (Google Chrome)'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Greeting & Top Overview Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {greeting}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{settings.teacherName ? `${t.teacherLabel}: ${settings.teacherName}` : settings.className || t.appSubtitle}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatDisplayDate(todayStr)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onOpenExcelImport}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title={t.importRosterBtn}
              aria-label={t.importRosterBtn}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{t.importRosterBtn}</span>
            </button>

          </div>
        </div>

        {/* 4-Metric Key Performance Indicator Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Students Enrolled */}
          <div className="bg-white dark:bg-[#151F38] rounded-2xl p-4 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              <span>{t.totalEnrolled}</span>
              <Users className="w-4 h-4 text-[#173B65] dark:text-[#38BDF8]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#172235] dark:text-[#F8FAFC] mt-1">
              {activeStudents.length}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {t.activeMembers} {archivedStudents.length > 0 ? `(${archivedStudents.length} ${t.archivedStudents})` : ''}
            </div>
          </div>

          {/* Card 2: Present Today */}
          <div className="bg-white dark:bg-[#151F38] rounded-2xl p-4 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#16A34A] dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t.presentToday}
              </span>
              {isTodayTaken && (
                <span className="text-[11px] font-mono tabular-nums font-bold">
                  {todayStats.attendanceRate}%
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#16A34A] dark:text-emerald-400 mt-1">
              {isTodayTaken ? todayStats.present : '—'}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {isTodayTaken ? `${todayStats.present} / ${activeStudents.length}` : (language === 'am' ? 'ገና አልተመዘገበም' : 'Pending roll call')}
            </div>
          </div>

          {/* Card 3: Absent Today */}
          <div className="bg-white dark:bg-[#151F38] rounded-2xl p-4 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#DC5252] dark:text-red-400">
              <span className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {t.absentToday}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#DC5252] dark:text-red-400 mt-1">
              {isTodayTaken ? todayStats.absent : '—'}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {isTodayTaken ? `${todayStats.absent} ${t.markedAbsent}` : (language === 'am' ? 'ገና አልተመዘገበም' : 'Pending roll call')}
            </div>
          </div>

          {/* Card 4: Feeding Status */}
          <div className="bg-white dark:bg-[#151F38] rounded-2xl p-4 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#F59E0B] dark:text-amber-400">
              <span className="flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5" /> {t.feedingStatus}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#F59E0B] dark:text-amber-400 mt-1">
              {todayFeeding ? todayFeeding.childrenCount : '0'}
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {todayFeeding ? `${todayFeeding.foodType} (${todayFeeding.childrenCount} ${t.childrenFed})` : (language === 'am' ? 'ዛሬ አልተመዘገበም' : 'Not logged today')}
            </div>
          </div>
        </div>
      </div>


      {/* Responsive 2-Column Core Actions: Attendance & Feeding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Today's Attendance Card */}
        <section
          aria-label={t.todayAttendance}
          className="bg-white dark:bg-[#151F38] rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs flex flex-col justify-between space-y-5"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#172235] dark:text-[#F8FAFC] tracking-tight">
                  {t.todayAttendance}
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  {t.todayAttendanceDesc}
                </p>
              </div>

              {isTodayTaken ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.recorded}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] dark:text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                  <span>{t.notRecorded}</span>
                </span>
              )}
            </div>

            {/* 3-Pillar Breakdown */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl p-3 text-center border border-emerald-200/80 dark:border-emerald-900/40">
                <span className="text-[11px] font-semibold text-[#16A34A] dark:text-emerald-300 block mb-0.5">
                  {t.present}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#16A34A] dark:text-emerald-400">
                  {todayStats.present}
                </span>
              </div>

              <div className="bg-red-50/80 dark:bg-red-950/30 rounded-2xl p-3 text-center border border-red-200/80 dark:border-red-900/40">
                <span className="text-[11px] font-semibold text-[#DC5252] dark:text-red-300 block mb-0.5">
                  {t.absent}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#DC5252] dark:text-red-400">
                  {todayStats.absent}
                </span>
              </div>

              <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl p-3 text-center border border-amber-200/80 dark:border-amber-900/40">
                <span className="text-[11px] font-semibold text-[#F59E0B] dark:text-amber-300 block mb-0.5">
                  {t.permission}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#F59E0B] dark:text-amber-400">
                  {todayStats.permission}
                </span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          {isTodayTaken ? (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onViewDate(todayStr)}
                className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs bg-[#F4F7FB] hover:bg-[#E2E8F0] text-[#172235] dark:bg-[#1D2A4D] dark:hover:bg-[#2B3A67] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#2B3A67] transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>{t.viewRecord}</span>
              </button>
              <button
                type="button"
                onClick={() => onTakeAttendance(todayStr)}
                className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-[#173B65] hover:bg-[#102a4a] text-white transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>{t.editAttendance}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onTakeAttendance(todayStr)}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#173B65] hover:bg-[#102a4a] text-white font-bold text-sm tracking-wide shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.takeAttendance}</span>
              <ChevronRight className="w-4 h-4 text-[#0D9488]" />
            </button>
          )}
        </section>

        {/* Card 2: Daily Feeding Program Card */}
        <section
          aria-label={t.dailyFeeding}
          className="bg-white dark:bg-[#151F38] rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs flex flex-col justify-between space-y-5"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#172235] dark:text-[#F8FAFC] tracking-tight">
                  {t.dailyFeeding}
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  {t.dailyFeedingDesc}
                </p>
              </div>

              {todayFeeding ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.logged}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] dark:text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                  <span>{t.notLogged}</span>
                </span>
              )}
            </div>

            {todayFeeding ? (
              <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-950 dark:text-amber-200">
                    {t.foodType}: {todayFeeding.foodType}
                  </span>
                  <span className="text-[#16A34A] dark:text-emerald-400 font-mono tabular-nums">
                    {todayFeeding.childrenCount} {t.childrenFed}
                  </span>
                </div>
                <div className="text-xs text-[#64748B] dark:text-slate-300 flex items-center gap-2">
                  <span>{t.coordinator}: <strong className="text-[#172235] dark:text-white">{todayFeeding.coordinatorName}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>{t.location}: {todayFeeding.location}</span>
                </div>

                <div className="flex items-center gap-2 pt-1.5">
                  {onNavigateToReports && (
                    <button
                      type="button"
                      onClick={() => onNavigateToReports('history')}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#173B65] hover:bg-[#102a4a] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{t.viewDetails}</span>
                    </button>
                  )}
                  {onNavigateToReports && (
                    <button
                      type="button"
                      onClick={() => onNavigateToReports('feeding')}
                      className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#1D2A4D] hover:bg-[#F4F7FB] dark:hover:bg-[#151F38] text-[#172235] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#2B3A67] font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0D9488]" />
                      <span>{t.editReport}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#F4F7FB] dark:bg-[#1D2A4D]/40 rounded-2xl p-4 border border-[#E2E8F0] dark:border-[#2B3A67] text-xs text-[#64748B] dark:text-[#94A3B8] space-y-1">
                <p className="font-semibold text-[#172235] dark:text-[#F8FAFC]">
                  {language === 'am' ? 'ለዛሬ የተመዘገበ የምገባ መረጃ የለም።' : 'No feeding record submitted for today yet.'}
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  {language === 'am' ? 'ተረኛ አስተባባሪ፣ የምግብ ዓይነት፣ የተመገቡ ህፃናት ብዛት እና መርሃ ግብር ይመዝግቡ።' : 'Log coordinator on duty, food weight in kg, children fed count, and schedule.'}
                </p>
              </div>
            )}
          </div>

          {!todayFeeding && onNavigateToReports && (
            <button
              type="button"
              onClick={() => onNavigateToReports('feeding')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold text-sm tracking-wide shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Utensils className="w-4 h-4" />
              <span>{t.logFeeding}</span>
            </button>
          )}
        </section>
      </div>

      {/* Card 3: Today's Complete Combined Report */}
      <section
        aria-label={t.combinedReportTitle}
        className="bg-white dark:bg-[#1B2730] rounded-3xl p-5 sm:p-6 border border-[#E8E0D0] dark:border-[#37474F] shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-[#24343D] text-[#006064] dark:text-[#4DD0E1] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#263238] dark:text-[#F5F7FA] tracking-tight">
                {t.combinedReportTitle}
              </h2>
              <p className="text-xs text-[#607D8B] dark:text-[#B0BEC5] mt-0.5">
                {t.combinedReportDesc}
              </p>
            </div>
          </div>

          {/* Section completeness indicators */}
          <div className="flex items-center gap-3 text-xs text-[#607D8B] dark:text-[#B0BEC5] self-start sm:self-auto">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isTodayTaken ? 'bg-[#00BCD4]' : 'bg-amber-400'}`} />
              <span>{language === 'am' ? 'አቴንዳንስ:' : 'Attendance:'} {isTodayTaken ? t.ready : (language === 'am' ? 'ይጠበቃል' : 'Pending')}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${todayFeeding ? 'bg-[#00BCD4]' : 'bg-amber-400'}`} />
              <span>{language === 'am' ? 'የዕለት ምገባ:' : 'Feeding:'} {todayFeeding ? t.ready : (language === 'am' ? 'ይጠበቃል' : 'Pending')}</span>
            </span>
          </div>
        </div>

        {/* Feedback message banner if exported */}
        {exportFeedback && (
          <div
            className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold transition-all ${
              exportFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {exportFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{exportFeedback.message}</span>
          </div>
        )}

        {/* 3 Download Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={() => handleExportTodayReport('pdf')}
            className="py-3 px-4 rounded-xl bg-[#006064] hover:bg-[#004d50] disabled:bg-teal-300 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            {exportingFormat === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <FileDown className="w-4 h-4 shrink-0" />
            )}
            <div className="text-left">
              <div>{exportingFormat === 'pdf' ? (language === 'am' ? 'ፒዲኤፍ እየተዘጋጀ ነው...' : 'Generating PDF...') : t.downloadPdf}</div>
              <div className="text-[10px] font-normal opacity-85">Daily_Report_{todayStr}.pdf</div>
            </div>
          </button>

          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={() => handleExportTodayReport('word')}
            className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            {exportingFormat === 'word' ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <FileText className="w-4 h-4 shrink-0" />
            )}
            <div className="text-left">
              <div>{exportingFormat === 'word' ? (language === 'am' ? 'ወርድ እየተዘጋጀ ነው...' : 'Generating Word...') : t.downloadWord}</div>
              <div className="text-[10px] font-normal opacity-85">Daily_Report_{todayStr}.docx</div>
            </div>
          </button>

          <button
            type="button"
            disabled={exportingFormat !== null}
            onClick={() => handleExportTodayReport('excel')}
            className="py-3 px-4 rounded-xl bg-teal-900 hover:bg-teal-950 disabled:bg-teal-700/60 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            {exportingFormat === 'excel' ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
            )}
            <div className="text-left">
              <div>{exportingFormat === 'excel' ? (language === 'am' ? 'ኤክሴል እየተዘጋጀ ነው...' : 'Generating Excel...') : t.downloadExcel}</div>
              <div className="text-[10px] font-normal opacity-85">Daily_Report_{todayStr}.xlsx</div>
            </div>
          </button>
        </div>
      </section>

      {/* Quick Access Feature Tiles */}
      {onNavigateToReports && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onNavigateToReports('feeding')}
            className="p-4 rounded-2xl bg-white dark:bg-[#1B2730] border border-[#E8E0D0] dark:border-[#37474F] hover:border-amber-400 dark:hover:border-amber-600 text-left transition shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {t.quickActionFeedingLogs}
              </span>
              <Utensils className="w-4 h-4 text-[#607D8B] dark:text-[#B0BEC5] group-hover:text-amber-500 transition-colors" />
            </div>
            <p className="text-sm font-bold text-[#263238] dark:text-[#F5F7FA]">
              {t.quickActionFeedingLogs}
            </p>
            <p className="text-xs text-[#607D8B] dark:text-[#B0BEC5] mt-0.5">
              {t.quickActionFeedingDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToReports('attendance')}
            className="p-4 rounded-2xl bg-white dark:bg-[#1B2730] border border-[#E8E0D0] dark:border-[#37474F] hover:border-[#00BCD4] dark:hover:border-[#4DD0E1] text-left transition shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#006064] dark:text-[#4DD0E1]">
                {t.quickActionAttReports}
              </span>
              <FileDown className="w-4 h-4 text-[#607D8B] dark:text-[#B0BEC5] group-hover:text-[#00BCD4] transition-colors" />
            </div>
            <p className="text-sm font-bold text-[#263238] dark:text-[#F5F7FA]">
              {t.quickActionAttReports}
            </p>
            <p className="text-xs text-[#607D8B] dark:text-[#B0BEC5] mt-0.5">
              {t.quickActionAttDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToReports('export')}
            className="p-4 rounded-2xl bg-white dark:bg-[#1B2730] border border-[#E8E0D0] dark:border-[#37474F] hover:border-cyan-400 dark:hover:border-cyan-600 text-left transition shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                {t.quickActionExportCenter}
              </span>
              <Download className="w-4 h-4 text-[#607D8B] dark:text-[#B0BEC5] group-hover:text-cyan-500 transition-colors" />
            </div>
            <p className="text-sm font-bold text-[#263238] dark:text-[#F5F7FA]">
              {t.quickActionExportCenter}
            </p>
            <p className="text-xs text-[#607D8B] dark:text-[#B0BEC5] mt-0.5">
              {t.quickActionExportDesc}
            </p>
          </button>
        </div>
      )}

      {/* Grade and Section Breakdown Card */}
      {gradeSummaries.length > 0 && (
        <div className="bg-white dark:bg-[#151F38] rounded-3xl p-5 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#172235] dark:text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0D9488]" />
              <span>{t.gradeSectionBreakdown}</span>
            </h3>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              {gradeSummaries.length} {language === 'am' ? 'ክፍሎች' : 'Sections'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {gradeSummaries.map((g) => (
              <div
                key={g.label}
                className="p-3 rounded-2xl bg-[#F4F7FB] dark:bg-[#1D2A4D]/50 border border-[#E2E8F0] dark:border-[#2B3A67]"
              >
                <div className="text-xs font-bold text-[#172235] dark:text-[#F8FAFC] truncate">
                  {g.label}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-black font-mono text-[#0D9488]">
                    {g.total} {language === 'am' ? 'ተማሪ' : 'std'}
                  </span>
                  {g.rate !== null ? (
                    <span className="text-xs font-bold font-mono text-[#16A34A]">
                      {g.rate}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </div>
                {g.rate !== null && (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#16A34A] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, g.rate))}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Trend & Monthly Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Weekly Attendance Trend Card */}
        <div className="bg-white dark:bg-[#151F38] rounded-3xl p-5 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#172235] dark:text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#173B65] dark:text-[#38BDF8]" />
              <span>{t.weeklyAttendanceTrend}</span>
            </h3>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              {recentSessions.length} {language === 'am' ? 'ቀናት' : 'days'}
            </span>
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] py-4 text-center">
              {language === 'am' ? 'ገና ምንም የተመዘገበ ክፍለ ጊዜ የለም' : 'No recorded sessions yet'}
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {recentSessions.map((s) => {
                const pres = Object.values(s.records).filter((st) => st === 'present').length;
                const total = Math.max(1, activeStudents.length || Object.keys(s.records).length);
                const rate = Math.round((pres / total) * 100);
                return (
                  <div key={s.date} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {s.date}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {pres}/{total} ({rate}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          rate >= 85
                            ? 'bg-emerald-500'
                            : rate >= 70
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Attendance Comparison Card */}
        <div className="bg-white dark:bg-[#151F38] rounded-3xl p-5 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#172235] dark:text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t.monthlyComparison}</span>
            </h3>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              {thisMonthPrefix}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                {language === 'am' ? 'የዚህ ወር አማካይ' : 'This Month Avg'}
              </div>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {thisMonthAvg}%
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                {thisMonthDays.length} {language === 'am' ? 'ቀናት ተመዝግበዋል' : 'sessions logged'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {language === 'am' ? 'ያለፈው ወር አማካይ' : 'Last Month Avg'}
              </div>
              <div className="text-2xl font-black font-mono text-slate-600 dark:text-slate-300 mt-1">
                {lastMonthAvg > 0 ? `${lastMonthAvg}%` : '—'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {lastMonthDays.length} {language === 'am' ? 'ቀናት ተመዝግበዋል' : 'sessions logged'}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] pt-1">
            {thisMonthAvg >= 85 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ {language === 'am' ? 'የአቴንዳንስ ምጣኔ ጥሩ ደረጃ ላይ ይገኛል።' : 'High attendance rate maintained.'}
              </span>
            ) : (
              <span>
                ℹ️ {language === 'am' ? 'አቴንዳንስ ከታለመው 85% በታች በሚሆንበት ጊዜ ክትትል ያድርጉ።' : 'Target is 85%+ attendance.'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chronic Absenteeism Alert Card (<80% Attendance Rate) */}
      <div className="bg-white dark:bg-[#151F38] rounded-3xl p-5 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#DC5252]" />
            <h3 className="text-xs sm:text-sm font-bold text-[#DC5252] dark:text-rose-400 uppercase tracking-wider">
              {t.frequentAbsencesAlert} (&lt; 80%)
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-black">
            {chronicAbsenteeStudents.length}
          </span>
        </div>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          {t.frequentAbsencesDesc}
        </p>

        {chronicAbsenteeStudents.length === 0 ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t.noFrequentAbsentees}</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-56 overflow-y-auto">
            {chronicAbsenteeStudents.map(({ student, rate, missed, recordedDays }) => (
              <div
                key={student.id}
                onClick={onNavigateToStudents}
                className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-rose-50/40 dark:hover:bg-rose-950/20 px-2 rounded-xl transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{student.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">#{student.rollNumber}</span>
                    {student.grade && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                        {student.grade}{student.section}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                    {missed} {t.absentDaysCount} / {recordedDays} {language === 'am' ? 'ቀናት' : 'days'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 font-black font-mono text-xs">
                    {rate}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Unified Recent Activities Feed */}
      <div className="bg-white dark:bg-[#151F38] rounded-3xl p-5 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#172235] dark:text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#0D9488]" />
            <span>{t.recentActivity}</span>
          </h3>
          <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
            {activitiesList.length} {language === 'am' ? 'ክስተቶች' : 'activities'}
          </span>
        </div>

        {activitiesList.length === 0 ? (
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] py-4 text-center">
            {t.noRecentActivity}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {activitiesList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'attendance') {
                    onViewDate(item.date);
                  } else if (onNavigateToReports) {
                    onNavigateToReports('history');
                  }
                }}
                className="py-3 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-850 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'attendance'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                    }`}
                  >
                    {item.type === 'attendance' ? (
                      <Calendar className="w-4 h-4" />
                    ) : (
                      <Utensils className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.details}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                      item.type === 'attendance'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-Export Validation Alert Modal */}
      <ReportValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal((prev) => ({ ...prev, isOpen: false }))}
        errorType={validationModal.errorType}
        missingFields={validationModal.missingFields}
        customMessage={validationModal.customMessage}
        actions={validationModal.actions}
      />
    </div>
  );
};

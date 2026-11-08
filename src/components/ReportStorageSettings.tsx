import React, { useState, useEffect, useMemo } from 'react';
import type {
  Student,
  DayAttendance,
  DailyFeedingReport,
  SavedWeeklyReport,
  SavedMonthlyReport,
  AppSettings,
} from '../types.ts';
import {
  calculateWeeklySummary,
  calculateMonthlySummary,
  validateReportBeforeExport,
} from '../utils/reportAggregations.ts';
import {
  exportWeeklyReportPDF,
  exportWeeklyReportWord,
  exportMonthlyReportPDF,
  exportMonthlyReportWord,
} from '../utils/reportExports.ts';
import {
  saveWeeklyReport,
  loadWeeklyReports,
  deleteWeeklyReport,
  saveMonthlyReport,
  loadMonthlyReports,
  deleteMonthlyReport,
} from '../utils/storage.ts';
import {
  ETHIOPIAN_MONTHS,
  getTodayEthiopian,
  formatEthiopianDisplay,
  ethiopianToIso,
  isoToEthiopian,
  getDaysInEthiopianMonth,
} from '../utils/ethiopianCalendar.ts';
import { getTodayDateString, getISOWeekNumber } from '../utils/attendance.ts';
import { ReportValidationModal } from './ReportValidationModal.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import {
  Calendar,
  CalendarDays,
  Save,
  FileDown,
  FileText,
  CheckCircle2,
  Trash2,
  Eye,
  Layers,
  Utensils,
  Users,
  Sparkles,
  AlertTriangle,
  FolderArchive,
  Download,
  X,
  Edit,
} from 'lucide-react';

interface ReportStorageSettingsProps {
  students: Student[];
  attendanceHistory: DayAttendance[];
  feedingReports: DailyFeedingReport[];
  settings: AppSettings;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ReportStorageSettings: React.FC<ReportStorageSettingsProps> = ({
  students,
  attendanceHistory,
  feedingReports,
  settings,
  onShowToast,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'archive'>('weekly');

  // Stored reports state
  const [savedWeekly, setSavedWeekly] = useState<SavedWeeklyReport[]>([]);
  const [savedMonthly, setSavedMonthly] = useState<SavedMonthlyReport[]>([]);

  // Load saved on mount
  useEffect(() => {
    setSavedWeekly(loadWeeklyReports());
    setSavedMonthly(loadMonthlyReports());
  }, []);

  // Today Ethiopian info
  const todayEth = useMemo(() => getTodayEthiopian(), []);
  const todayIso = useMemo(() => getTodayDateString(), []);

  // Weekly selection state (Monday to Sunday)
  const defaultMonday = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().split('T')[0];
  }, []);

  const [weekStartDate, setWeekStartDate] = useState<string>(defaultMonday);
  const weekEndDate = useMemo(() => {
    const parts = weekStartDate.split('-');
    if (parts.length !== 3) return weekStartDate;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  }, [weekStartDate]);

  // Monthly selection state (Ethiopian year and month 1 to 13)
  const [selectedEthYear, setSelectedEthYear] = useState<number>(todayEth.year);
  const [selectedEthMonth, setSelectedEthMonth] = useState<number>(todayEth.month);

  // Validation modal state
  const [valModal, setValModal] = useState<{
    isOpen: boolean;
    errorType: 'no_students' | 'no_report_data' | 'no_period_reports' | 'partial_fields';
    missingFields?: string[];
  }>({
    isOpen: false,
    errorType: 'no_students',
  });

  // Review modal state
  const [reviewingReport, setReviewingReport] = useState<{
    type: 'weekly' | 'monthly';
    weekly?: SavedWeeklyReport;
    monthly?: SavedMonthlyReport;
    notes?: string;
  } | null>(null);

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'weekly' | 'monthly';
    id: string;
    title: string;
  } | null>(null);

  // Active calculated weekly summary
  const currentWeeklySummary = useMemo(() => {
    return calculateWeeklySummary(
      weekStartDate,
      weekEndDate,
      students,
      attendanceHistory,
      feedingReports
    );
  }, [weekStartDate, weekEndDate, students, attendanceHistory, feedingReports]);

  // Active calculated monthly summary
  const currentMonthlySummary = useMemo(() => {
    return calculateMonthlySummary(
      selectedEthYear,
      selectedEthMonth,
      students,
      attendanceHistory,
      feedingReports
    );
  }, [selectedEthYear, selectedEthMonth, students, attendanceHistory, feedingReports]);

  // Handle Save Weekly Report
  const handleSaveWeekly = () => {
    if (students.length === 0) {
      setValModal({ isOpen: true, errorType: 'no_students' });
      return;
    }
    if (currentWeeklySummary.totalDays === 0) {
      setValModal({ isOpen: true, errorType: 'no_period_reports' });
      return;
    }

    const { year, week } = getISOWeekNumber(new Date(weekStartDate));
    const periodKey = `${selectedEthYear}-W${String(week).padStart(2, '0')}`;
    const report: SavedWeeklyReport = {
      id: `weekly-${weekStartDate}-${weekEndDate}`,
      periodKey,
      startDate: weekStartDate,
      endDate: weekEndDate,
      ethiopianLabel: currentWeeklySummary.ethiopianLabel,
      gregorianLabel: `${weekStartDate} to ${weekEndDate}`,
      totalStudents: currentWeeklySummary.totalStudents,
      totalDays: currentWeeklySummary.totalDays,
      totalPresent: currentWeeklySummary.totalPresent,
      totalAbsent: currentWeeklySummary.totalAbsent,
      totalPermission: currentWeeklySummary.totalPermission,
      attendanceRate: currentWeeklySummary.attendanceRate,
      includedReportDates: currentWeeklySummary.includedReportDates,
      feedingSummary: currentWeeklySummary.feedingSummary,
      notes: currentWeeklySummary.gapsAndChallenges.map((g) => `${g.ethDateStr}: ${g.notes}`).join(' | '),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = saveWeeklyReport(report);
    setSavedWeekly(updated);
    onShowToast(`✓ የሳምንቱ ሪፖርት (${currentWeeklySummary.ethiopianLabel}) በተሳካ ሁኔታ ተቀምጧል!`, 'success');
  };

  // Handle Save Monthly Report
  const handleSaveMonthly = () => {
    if (students.length === 0) {
      setValModal({ isOpen: true, errorType: 'no_students' });
      return;
    }
    if (currentMonthlySummary.totalDays === 0) {
      setValModal({ isOpen: true, errorType: 'no_period_reports' });
      return;
    }

    const periodKey = `${selectedEthYear}-${String(selectedEthMonth).padStart(2, '0')}`;
    const report: SavedMonthlyReport = {
      id: `monthly-${periodKey}`,
      ethYear: selectedEthYear,
      ethMonth: selectedEthMonth,
      ethMonthName: currentMonthlySummary.ethMonthName,
      periodKey,
      startDate: currentMonthlySummary.startDate,
      endDate: currentMonthlySummary.endDate,
      label: currentMonthlySummary.label,
      totalStudents: currentMonthlySummary.totalStudents,
      totalDays: currentMonthlySummary.totalDays,
      totalPresent: currentMonthlySummary.totalPresent,
      totalAbsent: currentMonthlySummary.totalAbsent,
      totalPermission: currentMonthlySummary.totalPermission,
      attendanceRate: currentMonthlySummary.attendanceRate,
      includedReportDates: currentMonthlySummary.includedReportDates,
      feedingSummary: currentMonthlySummary.feedingSummary,
      generalNotes: currentMonthlySummary.gapsAndChallenges.map((g) => `${g.ethDateStr}: ${g.notes}`).join(' | '),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = saveMonthlyReport(report);
    setSavedMonthly(updated);
    onShowToast(`✓ የወሩ ሪፖርት (${currentMonthlySummary.label}) በተሳካ ሁኔታ ተቀምጧል!`, 'success');
  };

  // Handle Delete
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'weekly') {
      const updated = deleteWeeklyReport(deleteConfirm.id);
      setSavedWeekly(updated);
      onShowToast('Weekly report deleted', 'info');
    } else {
      const updated = deleteMonthlyReport(deleteConfirm.id);
      setSavedMonthly(updated);
      onShowToast('Monthly report deleted', 'info');
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                የሪፖርት ማስቀመጫ ቅንብሮች (Report Storage Settings)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save, organize, retrieve, and export weekly and monthly reports with Ethiopian calendar support.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab selection */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ሳምንታዊ ሪፖርቶች
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ወርሃዊ ሪፖርቶች
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>የተቀመጡ ({savedWeekly.length + savedMonthly.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WEEKLY REPORTS */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Week / ሳምንት ይምረጡ
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentWeeklySummary.ethiopianLabel}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {weekStartDate} to {weekEndDate} • {currentWeeklySummary.totalDays} days recorded
                </p>
              </div>

              {/* Quick Week Controls */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={weekStartDate}
                  onChange={(e) => setWeekStartDate(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
                  title="Week start date"
                />
                <button
                  type="button"
                  onClick={() => setWeekStartDate(defaultMonday)}
                  className="px-2.5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                >
                  This Week
                </button>
              </div>
            </div>

            {/* Weekly KPI metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] block">Students</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {currentWeeklySummary.totalStudents}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <span className="text-emerald-600 text-[10px] font-bold block">Present</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  {currentWeeklySummary.totalPresent}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <span className="text-rose-600 text-[10px] font-bold block">Absent</span>
                <span className="text-base font-black text-rose-700 dark:text-rose-400">
                  {currentWeeklySummary.totalAbsent}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <span className="text-blue-600 text-[10px] font-bold block">Permission</span>
                <span className="text-base font-black text-blue-700 dark:text-blue-400">
                  {currentWeeklySummary.totalPermission}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-amber-600 text-[10px] font-bold block">Rate</span>
                <span className="text-base font-black text-amber-700 dark:text-amber-400">
                  {currentWeeklySummary.attendanceRate}%
                </span>
              </div>
            </div>

            {/* Feeding details snippet */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Feeding Program: {currentWeeklySummary.feedingSummary.totalChildrenFed} children fed
                </span>
                <span className="text-slate-400">({currentWeeklySummary.feedingSummary.totalFoodKg} kg total)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Activities: {currentWeeklySummary.feedingSummary.lessonCount} Lessons • {currentWeeklySummary.feedingSummary.gameCount} Games • {currentWeeklySummary.feedingSummary.nothingCount} None
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={handleSaveWeekly}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>የሳምንቱን ሪፖርት አስቀምጥ (Save Weekly Report)</span>
            </button>

            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={async () => {
                  if (currentWeeklySummary.totalDays === 0) {
                    setValModal({ isOpen: true, errorType: 'no_period_reports' });
                    return;
                  }
                  await exportWeeklyReportPDF(currentWeeklySummary, settings);
                  onShowToast('Weekly Report PDF downloaded');
                }}
                className="py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <FileDown className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Export as PDF</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (currentWeeklySummary.totalDays === 0) {
                    setValModal({ isOpen: true, errorType: 'no_period_reports' });
                    return;
                  }
                  await exportWeeklyReportWord(currentWeeklySummary, settings);
                  onShowToast('Weekly Report Word document downloaded');
                }}
                className="py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Export as Word</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY REPORTS */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Ethiopian Month / የኢትዮጵያ ወር ይምረጡ
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {currentMonthlySummary.label}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {currentMonthlySummary.startDate} to {currentMonthlySummary.endDate} • {currentMonthlySummary.totalDays} days recorded
                </p>
              </div>

              {/* Month and Year Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedEthMonth}
                  onChange={(e) => setSelectedEthMonth(Number(e.target.value))}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                  aria-label="Ethiopian Month"
                >
                  {ETHIOPIAN_MONTHS.map((m) => (
                    <option key={m.number} value={m.number}>
                      {m.number}. {m.amharicName} ({m.englishName})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedEthYear}
                  onChange={(e) => setSelectedEthYear(Number(e.target.value))}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                  aria-label="Ethiopian Year"
                >
                  {[todayEth.year - 2, todayEth.year - 1, todayEth.year, todayEth.year + 1].map((y) => (
                    <option key={y} value={y}>
                      {y} ዓ.ም
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly KPI metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] block">Students</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {currentMonthlySummary.totalStudents}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <span className="text-emerald-600 text-[10px] font-bold block">Present</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  {currentMonthlySummary.totalPresent}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <span className="text-rose-600 text-[10px] font-bold block">Absent</span>
                <span className="text-base font-black text-rose-700 dark:text-rose-400">
                  {currentMonthlySummary.totalAbsent}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                <span className="text-blue-600 text-[10px] font-bold block">Permission</span>
                <span className="text-base font-black text-blue-700 dark:text-blue-400">
                  {currentMonthlySummary.totalPermission}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-amber-600 text-[10px] font-bold block">Rate</span>
                <span className="text-base font-black text-amber-700 dark:text-amber-400">
                  {currentMonthlySummary.attendanceRate}%
                </span>
              </div>
            </div>

            {/* Feeding details snippet */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Monthly Feeding: {currentMonthlySummary.feedingSummary.totalChildrenFed} children fed
                </span>
                <span className="text-slate-400">({currentMonthlySummary.feedingSummary.totalFoodKg} kg total)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {currentMonthlySummary.feedingSummary.lessonCount} Lessons • {currentMonthlySummary.feedingSummary.gameCount} Games • {currentMonthlySummary.feedingSummary.nothingCount} None
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={handleSaveMonthly}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>የወሩን ሪፖርት አስቀምጥ (Save Monthly Report)</span>
            </button>

            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={async () => {
                  if (currentMonthlySummary.totalDays === 0) {
                    setValModal({ isOpen: true, errorType: 'no_period_reports' });
                    return;
                  }
                  await exportMonthlyReportPDF(currentMonthlySummary, settings);
                  onShowToast(`Monthly Report PDF downloaded for ${currentMonthlySummary.label}`);
                }}
                className="py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <FileDown className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Export as PDF</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (currentMonthlySummary.totalDays === 0) {
                    setValModal({ isOpen: true, errorType: 'no_period_reports' });
                    return;
                  }
                  await exportMonthlyReportWord(currentMonthlySummary, settings);
                  onShowToast(`Monthly Report Word document downloaded for ${currentMonthlySummary.label}`);
                }}
                className="py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Export as Word</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED REPORTS ARCHIVE */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Saved Weekly &amp; Monthly Reports Archive (የተቀመጡ ሪፖርቶች መዝገብ)
            </span>
            <span className="text-[11px] text-slate-400">
              {savedWeekly.length} Weekly • {savedMonthly.length} Monthly
            </span>
          </div>

          {savedWeekly.length === 0 && savedMonthly.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400 space-y-2">
              <FolderArchive className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                እስካሁን የተቀመጠ ሳምንታዊ ወይም ወርሃዊ ሪፖርት የለም (No saved reports yet).
              </p>
              <p className="text-[11px] text-slate-400">
                Use the "ሳምንታዊ ሪፖርቶች" or "ወርሃዊ ሪፖርቶች" tabs above to generate and save completed reports.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Weekly Reports Section */}
              {savedWeekly.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                        Weekly
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.ethiopianLabel}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.startDate} to {item.endDate} • {item.totalStudents} Students • {item.totalDays} Days • {item.attendanceRate}% Rate • {item.feedingSummary?.totalChildrenFed || 0} Fed
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setReviewingReport({ type: 'weekly', weekly: item, notes: item.notes })}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition"
                      title="Review Report"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>ክለሳ</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const sum = calculateWeeklySummary(item.startDate, item.endDate, students, attendanceHistory, feedingReports);
                        await exportWeeklyReportPDF(sum, settings);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition"
                      title="Download PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const sum = calculateWeeklySummary(item.startDate, item.endDate, students, attendanceHistory, feedingReports);
                        await exportWeeklyReportWord(sum, settings);
                      }}
                      className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition"
                      title="Download Word"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'weekly', id: item.id, title: item.ethiopianLabel })}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Monthly Reports Section */}
              {savedMonthly.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 uppercase">
                        Monthly
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.label}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.startDate} to {item.endDate} • {item.totalStudents} Students • {item.totalDays} Days • {item.attendanceRate}% Rate • {item.feedingSummary?.totalChildrenFed || 0} Fed
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setReviewingReport({ type: 'monthly', monthly: item, notes: item.generalNotes })}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition"
                      title="Review Report"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>ክለሳ</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const sum = calculateMonthlySummary(item.ethYear, item.ethMonth, students, attendanceHistory, feedingReports);
                        await exportMonthlyReportPDF(sum, settings);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition"
                      title="Download PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const sum = calculateMonthlySummary(item.ethYear, item.ethMonth, students, attendanceHistory, feedingReports);
                        await exportMonthlyReportWord(sum, settings);
                      }}
                      className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition"
                      title="Download Word"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'monthly', id: item.id, title: item.label })}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Validation Warning Modal */}
      <ReportValidationModal
        isOpen={valModal.isOpen}
        onClose={() => setValModal({ ...valModal, isOpen: false })}
        errorType={valModal.errorType}
        actions={[
          ...(valModal.errorType === 'no_students'
            ? [
                {
                  label: 'ተማሪዎችን መዝግብ (Register Students)',
                  primary: true,
                  icon: <Users className="w-4 h-4" />,
                  onClick: () => {
                    if (onNavigateToTab) onNavigateToTab('students');
                  },
                },
              ]
            : [
                {
                  label: 'አቴንዳንስ መዝግብ (Take Attendance)',
                  primary: true,
                  icon: <Calendar className="w-4 h-4" />,
                  onClick: () => {
                    if (onNavigateToTab) onNavigateToTab('attendance');
                  },
                },
              ]),
        ]}
      />

      {/* Review Modal */}
      {reviewingReport && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ zIndex: 120 }}
          className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setReviewingReport(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {reviewingReport.type === 'weekly' ? 'Weekly Report Review' : 'Monthly Report Review'}
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {reviewingReport.weekly?.ethiopianLabel || reviewingReport.monthly?.label}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setReviewingReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content summary */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">Period</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {reviewingReport.weekly ? `${reviewingReport.weekly.startDate} to ${reviewingReport.weekly.endDate}` : `${reviewingReport.monthly?.startDate} to ${reviewingReport.monthly?.endDate}`}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">Attendance Rate</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {reviewingReport.weekly?.attendanceRate || reviewingReport.monthly?.attendanceRate}%
                  </span>
                </div>
              </div>

              {/* Editable or review notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  ማስታወሻ ወይም ተግዳሮቶች (Notes &amp; Observations):
                </label>
                <textarea
                  value={reviewingReport.notes || ''}
                  onChange={(e) => setReviewingReport({ ...reviewingReport, notes: e.target.value })}
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  placeholder="ተጨማሪ ማስታወሻ ያስገቡ..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (reviewingReport.type === 'weekly' && reviewingReport.weekly) {
                      const updated = saveWeeklyReport({ ...reviewingReport.weekly, notes: reviewingReport.notes, updatedAt: Date.now() });
                      setSavedWeekly(updated);
                      onShowToast('✓ Weekly report notes updated');
                    } else if (reviewingReport.type === 'monthly' && reviewingReport.monthly) {
                      const updated = saveMonthlyReport({ ...reviewingReport.monthly, generalNotes: reviewingReport.notes, updatedAt: Date.now() });
                      setSavedMonthly(updated);
                      onShowToast('✓ Monthly report notes updated');
                    }
                    setReviewingReport(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ለውጦችን መዝግብ (Save Changes)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewingReport(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  ዝጋ (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="ሪፖርቱን መሰረዝ ይፈልጋሉ? (Delete Report?)"
        message={`ይህ ድርጊት የተቀመጠውን ሪፖርት "${deleteConfirm?.title}" በቋሚነት ያጠፋዋል።`}
        confirmLabel="አዎ፣ ሰርዝ (Delete)"
        isDestructive={true}
      />
    </div>
  );
};

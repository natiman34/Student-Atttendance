import React, { useState, useRef } from 'react';
import type { Student, DayAttendance, AppSettings, DailyFeedingReport } from '../types.ts';
import {
  exportAttendanceToCSV,
  getTodayDateString,
} from '../utils/attendance.ts';
import {
  createBackupPayload,
  parseAndRestoreBackup,
  clearAllStorage,
  loadWeeklyReports,
  loadMonthlyReports,
  loadTermlyReports,
  loadAnnualReports,
  loadBackupHistory,
  DEFAULT_SCHOOL_TERMS,
  DEFAULT_ETHIOPIAN_HOLIDAYS,
} from '../utils/storage.ts';
import {
  downloadWordReport,
  downloadPDFReport,
  downloadExcelSheet,
} from '../utils/exports.ts';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Moon,
  Sun,
  Trash2,
  Printer,
  ShieldCheck,
  Percent,
  SlidersHorizontal,
  FileText,
  FileDown,
  CheckCircle2,
  FolderArchive,
  Globe,
  Calendar,
  CalendarDays,
  History,
  Info,
  Smartphone,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import { PrintReportModal } from './PrintReportModal.tsx';
import { AppLogo } from './AppLogo.tsx';
import { ReportStorageSettings } from './ReportStorageSettings.tsx';

interface SettingsScreenProps {
  students: Student[];
  attendanceHistory: DayAttendance[];
  feedingReports?: DailyFeedingReport[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onDataRestored: (students: Student[], attendance: DayAttendance[], settings?: AppSettings) => void;
  onClearAll: () => void;
  onOpenExcelImport: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenInstallModal?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  students,
  attendanceHistory,
  feedingReports = [],
  settings,
  onUpdateSettings,
  onDataRestored,
  onClearAll,
  onOpenExcelImport,
  onShowToast,
  onOpenInstallModal,
  onNavigateToTab,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attendance Preferences Settings
  const [enableLateStatus, setEnableLateStatus] = useState(Boolean(settings.enableLateStatus));
  const [targetRate, setTargetRate] = useState(settings.targetAttendanceRate || 75);
  const [defaultStatus, setDefaultStatus] = useState<'unmarked' | 'present'>(
    settings.defaultStatus || 'unmarked'
  );
  const [backupHistoryList, setBackupHistoryList] = useState(() => loadBackupHistory());

  // Modals
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [pendingBackupContent, setPendingBackupContent] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      enableLateStatus,
      targetAttendanceRate: targetRate,
      defaultStatus,
    };
    onUpdateSettings(updated);
    onShowToast(language === 'am' ? 'ምርጫዎች በተሳካ ሁኔታ ተቀምጠዋል' : 'Preferences updated successfully');
  };

  // 1. Export JSON Backup
  const handleExportBackup = () => {
    const backupData = createBackupPayload(
      students,
      attendanceHistory,
      feedingReports,
      loadWeeklyReports(),
      loadMonthlyReports(),
      loadTermlyReports(),
      loadAnnualReports(),
      settings
    );
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = getTodayDateString();
    link.href = url;
    link.download = `attendance-backup-${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Backup file downloaded');
  };

  // 2. Import JSON Backup
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPendingBackupContent(content);
        setIsRestoreModalOpen(true);
      }
    };
    reader.onerror = () => {
      onShowToast('Error reading backup file', 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!pendingBackupContent) return;
    const result = parseAndRestoreBackup(pendingBackupContent);
    if (result.success && result.data) {
      onDataRestored(
        result.data.students,
        result.data.attendance,
        result.data.settings as AppSettings | undefined
      );
      onShowToast('✓ Backup restored successfully');
    } else {
      onShowToast(result.error || 'Failed to restore backup', 'error');
    }
    setPendingBackupContent(null);
    setIsRestoreModalOpen(false);
  };

  // 3. Document Downloads
  const handleDownloadWord = () => {
    downloadWordReport(
      'Attendance-Summary',
      settings,
      students,
      attendanceHistory
    );
    onShowToast('Word document (.doc) downloaded');
  };

  const handleDownloadPDF = () => {
    downloadPDFReport(
      'Attendance-Summary',
      settings,
      students,
      attendanceHistory
    );
    onShowToast('PDF report (.pdf) downloaded');
  };

  const handleDownloadExcel = () => {
    downloadExcelSheet(
      'Attendance-Roster',
      students,
      attendanceHistory
    );
    onShowToast('Excel file (.xlsx) downloaded');
  };

  const handleDownloadCSV = () => {
    const csv = exportAttendanceToCSV(students, attendanceHistory);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${getTodayDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('CSV file downloaded');
  };

  const handleConfirmClear = () => {
    clearAllStorage();
    onClearAll();
    setIsClearModalOpen(false);
    onShowToast('All application data cleared', 'info');
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Settings &amp; Data Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Manage appearance, offline backups, roster data, and system preferences
          </p>
        </div>
        <AppLogo size="md" />
      </div>

      {/* Hidden file input for backup restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".json"
        className="hidden"
      />

      {/* Language Selector */}
      <section className="bg-white dark:bg-[#151F38] rounded-3xl p-5 sm:p-6 shadow-xs border border-[#E2E8F0] dark:border-[#2B3A67] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#0D9488]/10 text-[#0D9488] dark:bg-[#1D2A4D] dark:text-[#2DD4BF]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#172235] dark:text-[#F8FAFC]">
                {t.languageSectionTitle}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {t.languageSectionDesc}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#173B65]/10 text-[#173B65] dark:bg-[#2B3A67] dark:text-[#38BDF8]">
            {language === 'am' ? 'አማርኛ' : 'English'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* English Option */}
          <button
            type="button"
            onClick={() => {
              setLanguage('en');
              onUpdateSettings({ ...settings, language: 'en' });
              onShowToast('Language set to English');
            }}
            className={`p-4 rounded-2xl border text-left transition-all duration-150 flex items-start justify-between cursor-pointer ${
              language === 'en'
                ? 'bg-[#173B65]/5 border-[#173B65] dark:bg-[#38BDF8]/10 dark:border-[#38BDF8] shadow-xs'
                : 'bg-[#F4F7FB] dark:bg-[#1D2A4D] border-[#E2E8F0] dark:border-[#2B3A67] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#173B65] text-white flex items-center justify-center font-bold text-xs">
                  EN
                </span>
                <span className="font-black text-sm text-[#172235] dark:text-[#F8FAFC]">
                  English
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Standard English interface, forms, and exports.
              </p>
            </div>
            {language === 'en' && (
              <CheckCircle2 className="w-5 h-5 text-[#173B65] dark:text-[#38BDF8] shrink-0 mt-0.5" />
            )}
          </button>

          {/* Amharic Option */}
          <button
            type="button"
            onClick={() => {
              setLanguage('am');
              onUpdateSettings({ ...settings, language: 'am' });
              onShowToast('ቋንቋው ወደ አማርኛ ተቀይሯል');
            }}
            className={`p-4 rounded-2xl border text-left transition-all duration-150 flex items-start justify-between cursor-pointer ${
              language === 'am'
                ? 'bg-[#0D9488]/10 border-[#0D9488] dark:bg-[#2DD4BF]/15 dark:border-[#2DD4BF] shadow-xs'
                : 'bg-[#F4F7FB] dark:bg-[#1D2A4D] border-[#E2E8F0] dark:border-[#2B3A67] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs">
                  አማ
                </span>
                <span className="font-black text-sm text-[#172235] dark:text-[#F8FAFC]">
                  አማርኛ (Amharic)
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                የተሟላ የአማርኛ ቋንቋ፣ የኢትዮጵያ ዘመን አቆጣጠር እና ሪፖርቶች።
              </p>
            </div>
            {language === 'am' && (
              <CheckCircle2 className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
            )}
          </button>
        </div>
      </section>

      {/* Appearance & Theme */}
      <section className="bg-white dark:bg-[#1B2730] rounded-3xl p-5 sm:p-6 shadow-xs border border-[#E8E0D0] dark:border-[#37474F] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-[#24343D] text-[#006064] dark:text-[#4DD0E1]">
              <Sun className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase tracking-wider">
              Appearance &amp; Theme / የቀለምና የገጽታ ሁነታ
            </h2>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100/60 dark:bg-[#24343D] text-[#006064] dark:text-[#4DD0E1]">
            {settings.theme === 'dark' ? 'Dark Mode' : settings.theme === 'system' ? 'System Match' : 'Warm Cream'}
          </span>
        </div>

        {/* 3-Theme Segmented Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-[#FFF8E7] dark:bg-[#101820] border border-[#E8E0D0] dark:border-[#37474F]">
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              settings.theme === 'light'
                ? 'bg-white dark:bg-[#1B2730] text-[#006064] shadow-xs border border-[#E8E0D0] dark:border-[#37474F]'
                : 'text-[#607D8B] dark:text-[#B0BEC5] hover:text-[#263238] dark:hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              settings.theme === 'dark'
                ? 'bg-white dark:bg-[#1B2730] text-[#4DD0E1] shadow-xs border border-[#E8E0D0] dark:border-[#37474F]'
                : 'text-[#607D8B] dark:text-[#B0BEC5] hover:text-[#263238] dark:hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, theme: 'system' })}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              settings.theme === 'system'
                ? 'bg-white dark:bg-[#1B2730] text-[#006064] dark:text-[#4DD0E1] shadow-xs border border-[#E8E0D0] dark:border-[#37474F]'
                : 'text-[#607D8B] dark:text-[#B0BEC5] hover:text-[#263238] dark:hover:text-white'
            }`}
            title="Follow OS System Theme"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>System</span>
          </button>
        </div>

        {/* Quick Toggle Row */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="font-bold text-xs text-[#263238] dark:text-[#F5F7FA]">
              {settings.theme === 'dark'
                ? 'Deep Blue-Gray Dark Theme'
                : settings.theme === 'system'
                ? 'Follow Device System Preference'
                : 'Warm Cream + Cyan Light Theme'}
            </p>
            <p className="text-[11px] text-[#607D8B] dark:text-[#B0BEC5]">
              Use the top-right header button or these switches to change anytime.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
              onUpdateSettings({ ...settings, theme: newTheme });
            }}
            className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-hidden ${
              settings.theme === 'dark' ? 'bg-[#00BCD4]' : 'bg-[#E8E0D0]'
            }`}
            aria-label="Toggle dark mode"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Attendance Preferences */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#173B65] dark:text-[#38BDF8]" />
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {language === 'am' ? 'የአቴንዳንስ ምርጫዎች' : 'Attendance Preferences'}
          </h2>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Default Daily Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                {t.defaultStatusLabel}
              </label>
              <select
                value={defaultStatus}
                onChange={(e) => setDefaultStatus(e.target.value as 'unmarked' | 'present')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                <option value="unmarked">ያልተመረጠ (Unmarked - Manual 2-Status Check)</option>
                <option value="present">ሁሉም ተገኝተዋል (All Present by Default)</option>
              </select>
            </div>

            {/* Target Attendance Rate */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.targetAttendanceLabel} (%)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={targetRate}
                  onChange={(e) => setTargetRate(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#0D9488]"
                />
                <span className="w-12 text-center text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400">
                  {targetRate}%
                </span>
              </div>
            </div>

            {/* Late Status Toggle */}
            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {t.enableLateStatusLabel}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {language === 'am' ? 'የዘገዩ ተማሪዎችን ሁኔታ ያካትቱ' : 'Allow marking students as Late in attendance'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableLateStatus}
                onChange={(e) => setEnableLateStatus(e.target.checked)}
                className="w-4 h-4 rounded text-[#173B65] focus:ring-[#173B65] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#173B65] hover:bg-[#102a4a] text-white font-black text-xs uppercase tracking-wide transition shadow-xs cursor-pointer"
            >
              {language === 'am' ? 'ምርጫዎችን መዝግብ' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </section>

      {/* Ethiopian Academic Calendar & School Terms */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0D9488]" />
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t.academicCalendarTitle}
            </h2>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            2017 ዓ.ም
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {t.academicCalendarDesc}
        </p>

        {/* Terms Grid */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t.schoolTerms}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEFAULT_SCHOOL_TERMS.map((term) => (
              <div
                key={term.id}
                className="p-3 rounded-2xl bg-[#F4F7FB] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <div className="text-xs font-black text-[#173B65] dark:text-[#38BDF8]">
                  {language === 'am' ? (term.amharicName || term.name) : term.name}
                </div>
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1">
                  {term.startDate} — {term.endDate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Holidays List */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {t.ethiopianHolidays}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {DEFAULT_ETHIOPIAN_HOLIDAYS.map((holiday) => (
              <div
                key={holiday.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {language === 'am' ? (holiday.amharicName || holiday.name) : holiday.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {holiday.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly and Monthly Report Storage Settings (የሪፖርት ማስቀመጫ ቅንብሮች) */}
      <ReportStorageSettings
        students={students}
        attendanceHistory={attendanceHistory}
        feedingReports={feedingReports}
        settings={settings}
        onShowToast={onShowToast}
        onNavigateToTab={onNavigateToTab}
      />

      {/* Roster & Quick Export */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Student Roster Management</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Currently tracking <strong>{students.length} students</strong>. Import a roster spreadsheet from Excel (.xlsx) or export CSV.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenExcelImport}
            className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-98"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Import Excel Roster</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={students.length === 0}
            className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-40"
          >
            <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </section>

      {/* Standalone Android Mobile Application (APK) */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-emerald-500/20 dark:border-emerald-600/30 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>{language === 'am' ? 'የአንድሮይድ ስልክ አፕ (Standalone APK)' : 'Android Mobile Application (APK)'}</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {language === 'am'
                ? 'ሮልኮልን እንደ ራሱን የቻለ የአንድሮይድ አፕ በስልክዎ ላይ ይጫኑ። ያለ ኢንተርኔት በ100% ከመስመር ውጭ ይሰራል።'
                : 'Install RollCall as a standalone native app directly on any Android 8.0+ device. 100% offline.'}
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
            v1.0 Release
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href="/downloads/RollCall-Release.apk"
            download="RollCall-Release.apk"
            className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'am' ? 'የተፈረመ APK አውርድ (17 MB)' : 'Download Signed APK (17 MB)'}</span>
          </a>

          {onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Info className="w-4 h-4 text-emerald-600" />
              <span>{language === 'am' ? 'የመጫኛ መመሪያዎች እና ሌሎች ፋይሎች' : 'Installation Guide & Options'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Backup & Restore */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.backupSectionTitle}</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {t.backupSectionDesc}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-98"
          >
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.exportBackupBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-98"
          >
            <Upload className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>{t.importBackupBtn}</span>
          </button>
        </div>

        {/* Backup History Log Table */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <History className="w-4 h-4 text-slate-500" />
            <span>{t.backupHistory}</span>
          </div>

          {backupHistoryList.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
              {t.noBackupHistory}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {backupHistoryList.map((entry, idx) => (
                <div
                  key={entry.id || `hist_${idx}_${entry.timestamp}`}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      {entry.recordCount?.students ?? entry.totalStudents ?? 0} {language === 'am' ? 'ተማሪዎች' : 'students'} • {entry.recordCount?.attendance ?? entry.totalAttendanceDays ?? 0} {language === 'am' ? 'አቴንዳንስ' : 'attendance'} • {entry.recordCount?.feeding ?? entry.totalFeedingReports ?? 0} {language === 'am' ? 'ምገባ' : 'feeding'}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {Math.round((entry.fileSizeBytes || 1024) / 1024)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Local Storage & Honest Cloud Sync Notice */}
      <section className="bg-sky-50/70 dark:bg-sky-950/30 rounded-3xl p-5 border border-sky-200 dark:border-sky-900/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-sky-950 dark:text-sky-200">
            {t.storageNoticeTitle}
          </div>
          <p className="text-sky-800 dark:text-sky-300 leading-relaxed">
            {t.storageNoticeDesc}
          </p>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-rose-200/60 dark:border-rose-950/60 space-y-3">
        <h2 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Danger Zone (ዳታ ማጽጃ)</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Permanently delete all students, attendance sessions, and feeding records from this device.
        </p>

        <button
          type="button"
          onClick={() => setIsClearModalOpen(true)}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition active:scale-98 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All Application Data</span>
        </button>
      </section>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isRestoreModalOpen}
        title="Restore Backup?"
        message="This will replace current students, attendance records, feeding reports, and settings with the backup file."
        confirmLabel="Restore"
        cancelLabel="Cancel"
        isDestructive={false}
        onConfirm={handleConfirmRestore}
        onCancel={() => {
          setIsRestoreModalOpen(false);
          setPendingBackupContent(null);
        }}
      />

      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Delete all application data?"
        message="This cannot be undone. All students, attendance history, and feeding records will be permanently wiped from this device."
        confirmLabel="Delete Everything"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        students={students}
        attendanceHistory={attendanceHistory}
      />
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import type {
  TabType,
  Student,
  DayAttendance,
  AttendanceStatus,
  AppSettings,
  DailyFeedingReport,
  AttendanceAuditEntry,
} from './types.ts';
import {
  initializeStorage,
  saveStudents,
  saveAttendance,
  saveFeedingReports,
  saveDayAttendance,
  saveSettings,
  saveFeedingReport,
  deleteFeedingReport,
  archiveStudent,
  unarchiveStudent,
  DEFAULT_SETTINGS,
} from './utils/storage.ts';
import { SAMPLE_STUDENTS, getSampleAttendance, getSampleFeedingReport } from './utils/sampleData.ts';
import { getTodayDateString } from './utils/attendance.ts';
import { getTodayEthiopian, formatEthiopianDisplay } from './utils/ethiopianCalendar.ts';
import { HomeScreen } from './components/HomeScreen.tsx';
import { FloatingBottomNav } from './components/FloatingBottomNav.tsx';
import { TakeAttendanceScreen } from './components/TakeAttendanceScreen.tsx';
import { StudentsScreen } from './components/StudentsScreen.tsx';
import { DataScreen } from './components/DataScreen.tsx';
import { HistoryScreen } from './components/HistoryScreen.tsx';
import { ReportsScreen, ReportSubTab } from './components/ReportsScreen.tsx';
import { SettingsScreen } from './components/SettingsScreen.tsx';
import { Toast } from './components/Toast.tsx';
import { ExcelImportModal } from './components/ExcelImportModal.tsx';
import { ExportCompleteReportFab } from './components/ExportCompleteReportFab.tsx';
import { AppLogo } from './components/AppLogo.tsx';
import {
  Calendar,
  Sun,
  Moon,
  Globe,
  WifiOff,
} from 'lucide-react';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext.tsx';

function AppContent() {
  const { language, setLanguage, t } = useTranslation();

  // Core Data State synchronously initialized
  const [initialData] = useState(() => initializeStorage());
  const [students, setStudents] = useState<Student[]>(() => initialData.students);
  const [attendanceHistory, setAttendanceHistory] = useState<DayAttendance[]>(() => initialData.attendance);
  const [feedingReports, setFeedingReports] = useState<DailyFeedingReport[]>(() => initialData.feedingReports || []);
  const [settings, setSettings] = useState<AppSettings>(() => initialData.settings || DEFAULT_SETTINGS);

  // Online / Offline status
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [reportsInitialSubTab, setReportsInitialSubTab] = useState<ReportSubTab>('feeding');
  const [takeAttendanceDate, setTakeAttendanceDate] = useState<string>(getTodayDateString());
  const [historySelectedDate, setHistorySelectedDate] = useState<string | null>(null);

  // Modal State
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToastMessage(message);
      setToastType(type);
      setTimeout(() => {
        setToastMessage((current) => (current === message ? null : current));
      }, 2500);
    },
    []
  );

  // Check if dark mode is currently active (explicitly dark, or system dark)
  const isDarkActive =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const applyThemeToDom = useCallback((theme: 'light' | 'dark' | 'system') => {
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync theme to DOM on mount and listen to system preference
  useEffect(() => {
    applyThemeToDom(settings.theme);

    // Watch OS system preference if set to 'system'
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        setSettings((prev) => {
          if (prev.theme === 'system') {
            applyThemeToDom('system');
          }
          return prev;
        });
      };
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [applyThemeToDom, settings.theme]);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    applyThemeToDom(newSettings.theme);
  };

  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' = isDarkActive ? 'light' : 'dark';
    const updated: AppSettings = { ...settings, theme: nextTheme };
    handleUpdateSettings(updated);
    showToast(
      nextTheme === 'dark'
        ? 'ጨለማ ሁነታ በርቷል (Dark Mode active)'
        : 'ብርሃን ሁነታ በርቷል (Warm Cream & Cyan active)',
      'info'
    );
  };

  // Student Actions
  const handleAddStudent = (
    name: string,
    rollNumber?: number,
    extra?: { gender?: string; grade?: string; section?: string; notes?: string }
  ) => {
    const nextRoll =
      rollNumber !== undefined
        ? rollNumber
        : students.reduce((max, s) => Math.max(max, s.rollNumber), 0) + 1;

    const newStudent: Student = {
      id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rollNumber: nextRoll,
      name,
      ...extra,
    };

    const updated = [...students, newStudent].sort(
      (a, b) => a.rollNumber - b.rollNumber
    );
    setStudents(updated);
    saveStudents(updated);
  };

  const handleEditStudent = (updatedStudent: Student) => {
    const updated = students
      .map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
      .sort((a, b) => a.rollNumber - b.rollNumber);
    setStudents(updated);
    saveStudents(updated);
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    saveStudents(updated);
  };

  const handleDeleteMultipleStudents = (ids: string[]) => {
    const idSet = new Set(ids);
    const updated = students.filter((s) => !idSet.has(s.id));
    setStudents(updated);
    saveStudents(updated);
  };

  const handleDeleteAllStudents = () => {
    setStudents([]);
    saveStudents([]);
  };

  const handleArchiveStudent = (id: string, reason?: string) => {
    const updated = archiveStudent(id, reason);
    setStudents(updated);
    showToast(language === 'am' ? 'ተማሪው ወደ ማህደር ተዛውሯል' : 'Student moved to archive');
  };

  const handleUnarchiveStudent = (id: string) => {
    const updated = unarchiveStudent(id);
    setStudents(updated);
    showToast(language === 'am' ? 'ተማሪው ከማህደር ወጥቷል' : 'Student restored from archive');
  };

  const handleReorderStudents = (reordered: Student[]) => {
    setStudents(reordered);
    saveStudents(reordered);
    showToast('Student order updated');
  };

  const handleImportStudents = (imported: Student[]) => {
    const combined = [...students, ...imported];
    setStudents(combined);
    saveStudents(combined);
  };

  // Excel File Roster Import
  const handleExcelImport = (
    newStudents: Student[],
    mode: 'replace' | 'append'
  ) => {
    let finalStudents: Student[];
    if (mode === 'replace') {
      finalStudents = newStudents;
      showToast(`Roster replaced with ${newStudents.length} students from Excel`);
    } else {
      const maxCurrentRoll = students.reduce((max, s) => Math.max(max, s.rollNumber), 0);
      const renumberedNew = newStudents.map((s, idx) => ({
        ...s,
        rollNumber: maxCurrentRoll + idx + 1,
      }));
      finalStudents = [...students, ...renumberedNew];
      showToast(`Added ${newStudents.length} students from Excel`);
    }

    setStudents(finalStudents);
    saveStudents(finalStudents);
  };

  // Attendance Actions
  const handleStartAttendance = (date?: string) => {
    const targetDate = date || getTodayDateString();
    setTakeAttendanceDate(targetDate);
    setCurrentTab('attendance');
  };

  const handleViewDate = (date: string) => {
    setHistorySelectedDate(date);
    setCurrentTab('history');
  };

  const handleSaveAttendance = (
    date: string,
    records: Record<string, AttendanceStatus>,
    notes?: Record<string, string>,
    stayOnScreen = false,
    auditEntry?: AttendanceAuditEntry
  ) => {
    const existing = attendanceHistory.find((a) => a.date === date);
    const existingAudit = existing?.auditLog || [];
    const auditLog = auditEntry ? [...existingAudit, auditEntry] : existingAudit;

    const dayRecord: DayAttendance = {
      date,
      records,
      notes,
      auditLog: auditLog.length > 0 ? auditLog : undefined,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    const updatedHistory = saveDayAttendance(dayRecord);
    setAttendanceHistory(updatedHistory);
    showToast(language === 'am' ? '✓ አቴንዳንስ ተመዝግቧል' : '✓ Attendance Saved');
    if (!stayOnScreen) {
      setCurrentTab('home');
    }
  };

  // Feeding Actions
  const handleSaveFeedingReport = (report: DailyFeedingReport) => {
    const updated = saveFeedingReport(report);
    setFeedingReports(updated);
  };

  const handleDeleteFeedingReport = (id: string) => {
    const updated = deleteFeedingReport(id);
    setFeedingReports(updated);
    showToast('Feeding Report deleted', 'info');
  };

  const handleNavigateToReports = (subTab?: ReportSubTab) => {
    if (subTab) {
      setReportsInitialSubTab(subTab);
    }
    setCurrentTab('reports');
  };

  // Restoring backup
  const handleDataRestored = (
    newStudents: Student[],
    newAttendance: DayAttendance[],
    newSettings?: AppSettings
  ) => {
    setStudents(newStudents);
    setAttendanceHistory(newAttendance);
    if (newSettings) {
      setSettings(newSettings);
      if (newSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleClearAll = () => {
    setStudents([]);
    setAttendanceHistory([]);
    setFeedingReports([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const handleLoadSampleData = () => {
    const s = SAMPLE_STUDENTS;
    const a = [getSampleAttendance(s)];
    const f = [getSampleFeedingReport()];
    setStudents(s);
    setAttendanceHistory(a);
    setFeedingReports(f);
    saveStudents(s);
    saveAttendance(a);
    saveFeedingReports(f);
    showToast('Loaded sample class & feeding records');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0B132B] text-[#172235] dark:text-[#F8FAFC] font-sans antialiased transition-colors duration-200 overflow-x-hidden">
      {/* Modern Dashboard Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#151F38]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#2B3A67] shadow-2xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="h-12 sm:h-14 flex items-center justify-between gap-3">
            {/* Left: Brand Logo & Class Name */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className="text-left focus:outline-hidden cursor-pointer min-w-0 flex items-center gap-2 sm:gap-3"
                aria-label="RollCall Home"
              >
                <AppLogo
                  size="md"
                  showText={true}
                  subtitle={settings.className || 'Student Attendance & Feeding'}
                />
              </button>
            </div>

            {/* Right Side Header Items: Date Badge, Language Toggle, Theme Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Language Switcher Button */}
              <button
                type="button"
                onClick={() => {
                  const nextLang = language === 'en' ? 'am' : 'en';
                  setLanguage(nextLang);
                  handleUpdateSettings({ ...settings, language: nextLang });
                  showToast(
                    nextLang === 'am' ? 'ቋንቋ ወደ አማርኛ ተቀይሯል' : 'Language switched to English',
                    'info'
                  );
                }}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] bg-white hover:bg-[#F4F7FB] dark:bg-[#1D2A4D] dark:hover:bg-[#151F38] border-[#E2E8F0] dark:border-[#2B3A67] text-[#172235] dark:text-[#F8FAFC] active:scale-95 shadow-2xs font-bold text-xs"
                title={language === 'en' ? 'ወደ አማርኛ ቀይር (Switch to Amharic)' : 'Switch to English (ወደ እንግሊዝኛ ቀይር)'}
                aria-label="Toggle language"
              >
                <Globe className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                <span className="text-[11px] font-semibold">{language === 'en' ? 'አማርኛ' : 'English'}</span>
              </button>

              {/* Ethiopian Date Display */}
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#0D9488]/10 dark:bg-[#1D2A4D] border border-[#0D9488]/20 dark:border-[#2B3A67] text-[#173B65] dark:text-[#2DD4BF] font-mono tabular-nums whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                <span>{formatEthiopianDisplay(getTodayEthiopian(), { compact: true })}</span>
              </span>
              <span className="sm:hidden inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-xl bg-[#0D9488]/10 dark:bg-[#1D2A4D] border border-[#0D9488]/20 dark:border-[#2B3A67] text-[#173B65] dark:text-[#2DD4BF] font-mono tabular-nums whitespace-nowrap">
                <span>{formatEthiopianDisplay(getTodayEthiopian(), { compact: true })}</span>
              </span>

              {/* Dedicated Light/Dark Mode Toggle Button */}
              <button
                type="button"
                onClick={handleToggleTheme}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] bg-white hover:bg-[#F4F7FB] dark:bg-[#1D2A4D] dark:hover:bg-[#151F38] border-[#E2E8F0] dark:border-[#2B3A67] text-[#172235] dark:text-[#F8FAFC] active:scale-95 shadow-2xs"
                title={isDarkActive ? 'Switch to Light Mode / ወደ ብርሃን ሁነታ ቀይር' : 'Switch to Dark Mode / ወደ ጨለማ ሁነታ ቀይር'}
                aria-label={isDarkActive ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkActive ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="hidden xl:inline text-xs font-bold text-[#F8FAFC]">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#173B65] shrink-0" />
                    <span className="hidden xl:inline text-xs font-bold text-[#173B65]">Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Offline Status Alert Banner */}
        {!isOnline && (
          <div className="bg-amber-500 text-slate-950 font-bold text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
            <WifiOff className="w-3.5 h-3.5" />
            <span>
              {language === 'am'
                ? 'ከመስመር ውጭ ሁነታ ላይ ነዎት። ሁሉም ተግባራት ከመስመር ውጭ ይሰራሉ!'
                : 'You are in offline mode. All records and features continue working offline!'}
            </span>
          </div>
        )}
      </header>

      {/* Main responsive container with bottom padding to prevent bottom nav overlap */}
      <main className="max-w-7xl mx-auto min-h-screen px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-48 sm:pb-52">
        {currentTab === 'home' && (
          <HomeScreen
            students={students}
            attendanceHistory={attendanceHistory}
            feedingReports={feedingReports}
            settings={settings}
            onTakeAttendance={handleStartAttendance}
            onViewDate={handleViewDate}
            onNavigateToStudents={() => setCurrentTab('students')}
            onNavigateToReports={handleNavigateToReports}
            onOpenExcelImport={() => setIsExcelModalOpen(true)}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        {currentTab === 'attendance' && (
          <TakeAttendanceScreen
            initialDate={takeAttendanceDate}
            students={students}
            attendanceHistory={attendanceHistory}
            feedingReports={feedingReports}
            settings={settings}
            onBack={() => setCurrentTab('home')}
            onSave={handleSaveAttendance}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsScreen
            students={students}
            attendanceHistory={attendanceHistory}
            feedingReports={feedingReports}
            settings={settings}
            onSaveFeedingReport={handleSaveFeedingReport}
            onDeleteFeedingReport={handleDeleteFeedingReport}
            onNavigateToAttendance={handleStartAttendance}
            onShowToast={showToast}
            initialSubTab={reportsInitialSubTab}
            onNavigateToTab={(tab) => setCurrentTab(tab as TabType)}
          />
        )}

        {currentTab === 'students' && (
          <StudentsScreen
            students={students}
            attendanceHistory={attendanceHistory}
            settings={settings}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onDeleteMultipleStudents={handleDeleteMultipleStudents}
            onDeleteAllStudents={handleDeleteAllStudents}
            onArchiveStudent={handleArchiveStudent}
            onUnarchiveStudent={handleUnarchiveStudent}
            onReorderStudents={handleReorderStudents}
            onImportStudents={handleImportStudents}
            onOpenExcelImport={() => setIsExcelModalOpen(true)}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'data' && (
          <DataScreen
            students={students}
            attendanceHistory={attendanceHistory}
            settings={settings}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'history' && (
          <HistoryScreen
            students={students}
            attendanceHistory={attendanceHistory}
            settings={settings}
            onEditDayAttendance={(date) => {
              setTakeAttendanceDate(date);
              setCurrentTab('attendance');
            }}
            selectedDateInitially={historySelectedDate}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            students={students}
            attendanceHistory={attendanceHistory}
            feedingReports={feedingReports}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onDataRestored={handleDataRestored}
            onClearAll={handleClearAll}
            onOpenExcelImport={() => setIsExcelModalOpen(true)}
            onShowToast={showToast}
            onNavigateToTab={(tab) => setCurrentTab(tab as TabType)}
          />
        )}
      </main>

      {/* Floating Action Button for Complete Daily Report Export (Left Side, above bottom nav) */}
      {currentTab !== 'attendance' && (
        <ExportCompleteReportFab
          students={students}
          attendanceHistory={attendanceHistory}
          feedingReports={feedingReports}
          settings={settings}
        />
      )}

      {/* Floating Bottom Navigation Bar (Elevated Telegram-style horizontal dock) */}
      <FloatingBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      {/* Feedback Toast */}
      <Toast message={toastMessage} type={toastType} />

      {/* Excel File Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImport={handleExcelImport}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

import React, { useState } from 'react';
import type {
  DailyFeedingReport,
  DayAttendance,
  Student,
  AppSettings,
} from '../types.ts';
import { DailyFeedingReportForm } from './DailyFeedingReportForm.tsx';
import { StudentAttendanceReportView } from './StudentAttendanceReportView.tsx';
import { ReportHistory } from './ReportHistory.tsx';
import { ExportReportsHub } from './ExportReportsHub.tsx';
import { AppLogo } from './AppLogo.tsx';
import {
  Utensils,
  Users,
  History,
  FileDown,
  Sparkles,
} from 'lucide-react';

export type ReportSubTab = 'feeding' | 'attendance' | 'history' | 'export';

interface ReportsScreenProps {
  students: Student[];
  attendanceHistory: DayAttendance[];
  feedingReports: DailyFeedingReport[];
  settings: AppSettings;
  onSaveFeedingReport: (report: DailyFeedingReport) => void;
  onDeleteFeedingReport: (id: string) => void;
  onNavigateToAttendance: (date: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialSubTab?: ReportSubTab;
  onNavigateToTab?: (tab: string) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  students,
  attendanceHistory,
  feedingReports,
  settings,
  onSaveFeedingReport,
  onDeleteFeedingReport,
  onNavigateToAttendance,
  onShowToast,
  initialSubTab = 'feeding',
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>(initialSubTab);
  const [editingReport, setEditingReport] = useState<DailyFeedingReport | null>(null);

  const subTabs: {
    id: ReportSubTab;
    label: string;
    amharic: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'feeding',
      label: 'Feeding Report',
      amharic: 'የዕለት ምገባ',
      icon: <Utensils className="w-4 h-4" />,
    },
    {
      id: 'attendance',
      label: 'Attendance Report',
      amharic: 'የተማሪዎች አቴንዳንስ',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: 'Report History',
      amharic: 'የሪፖርቶች ታሪክ',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'export',
      label: 'Export Reports',
      amharic: 'ሪፖርት ማውረጃ',
      icon: <FileDown className="w-4 h-4" />,
    },
  ];

  const handleEditFeedingReport = (report: DailyFeedingReport) => {
    setEditingReport(report);
    setActiveSubTab('feeding');
    onShowToast(`Editing feeding report for ${report.date}`, 'info');
  };

  const handleSaveReport = (report: DailyFeedingReport) => {
    onSaveFeedingReport(report);
    setEditingReport(null);
    onShowToast('✓ Feeding Report saved successfully!');
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Report Section Navigation Bar */}
      <nav
        aria-label="Report Sub Navigation"
        className="bg-white dark:bg-[#151F38] rounded-2xl p-1.5 border border-[#E2E8F0] dark:border-[#2B3A67] shadow-xs transition-colors duration-200"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSubTab(tab.id);
                  if (tab.id !== 'feeding') {
                    setEditingReport(null);
                  }
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 relative cursor-pointer ${
                  isActive
                    ? 'bg-[#173B65] text-white shadow-xs'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#173B65] dark:hover:text-[#F8FAFC] hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-1.5">
                  {tab.icon}
                  <span className="text-[11px] font-black truncate">{tab.label}</span>
                </div>
                <span
                  className={`text-[9px] font-medium leading-none ${
                    isActive ? 'text-[#0D9488] dark:text-[#2DD4BF]' : 'text-[#64748B] dark:text-[#94A3B8]'
                  }`}
                >
                  {tab.amharic}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sub-tab 1: Daily Feeding Report Page */}
      {activeSubTab === 'feeding' && (
        <DailyFeedingReportForm
          initialReport={editingReport}
          onSaveReport={handleSaveReport}
          onClearEdit={() => setEditingReport(null)}
        />
      )}

      {/* Sub-tab 2: Student Attendance Report */}
      {activeSubTab === 'attendance' && (
        <StudentAttendanceReportView
          students={students}
          attendanceHistory={attendanceHistory}
          settings={settings}
          onNavigateToAttendance={onNavigateToAttendance}
        />
      )}

      {/* Sub-tab 3: Report History */}
      {activeSubTab === 'history' && (
        <ReportHistory
          feedingReports={feedingReports}
          attendanceHistory={attendanceHistory}
          students={students}
          settings={settings}
          onEditFeedingReport={handleEditFeedingReport}
          onDeleteFeedingReport={onDeleteFeedingReport}
          onNavigateToAttendance={onNavigateToAttendance}
        />
      )}

      {/* Sub-tab 4: Export Reports */}
      {activeSubTab === 'export' && (
        <ExportReportsHub
          feedingReports={feedingReports}
          attendanceHistory={attendanceHistory}
          students={students}
          settings={settings}
          onNavigateToTab={onNavigateToTab}
          onNavigateToFeeding={() => setActiveSubTab('feeding')}
          onNavigateToAttendance={(d) => onNavigateToAttendance(d || '')}
        />
      )}
    </div>
  );
};

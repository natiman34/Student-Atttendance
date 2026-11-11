import React, { useState } from 'react';
import type { DailyFeedingReport, DayAttendance, Student, AppSettings } from '../types.ts';
import { getTodayDateString } from '../utils/attendance.ts';
import { EthiopianDatePicker } from './EthiopianDatePicker.tsx';
import {
  exportCombinedReportPDF,
  exportCombinedReportWord,
  exportCombinedReportExcel,
  exportDailyAttendancePDF,
  exportDailyAttendanceWord,
  exportDailyAttendanceExcel,
  exportFeedingReportPDF,
  exportFeedingReportWord,
  exportFeedingReportExcel,
  exportAllFeedingHistoryExcel,
} from '../utils/reportExports.ts';
import {
  downloadWordReport,
  downloadPDFReport,
  downloadExcelSheet,
} from '../utils/exports.ts';
import {
  ReportValidationModal,
  type ReportValidationErrorType,
  type ValidationAction,
} from './ReportValidationModal.tsx';
import { validateReportBeforeExport } from '../utils/reportAggregations.ts';
import {
  FileSpreadsheet,
  FileText,
  FileDown,
  Calendar,
  Utensils,
  Users,
  CheckCircle2,
  FolderArchive,
  Download,
  FileCheck2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface ExportReportsHubProps {
  feedingReports: DailyFeedingReport[];
  attendanceHistory: DayAttendance[];
  students: Student[];
  settings: AppSettings;
  onNavigateToTab?: (tab: string) => void;
  onNavigateToFeeding?: (date?: string) => void;
  onNavigateToAttendance?: (date?: string) => void;
}

export const ExportReportsHub: React.FC<ExportReportsHubProps> = ({
  feedingReports,
  attendanceHistory,
  students,
  settings,
  onNavigateToTab,
  onNavigateToFeeding,
  onNavigateToAttendance,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Validation modal state
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

  const notifyDownload = (name: string) => {
    setDownloadSuccess(`Exported: ${name}`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const currentFeeding = feedingReports.find((f) => f.date === selectedDate);
  const currentAttendance = attendanceHistory.find((a) => a.date === selectedDate);

  const checkAndValidateExport = (
    type: 'combined' | 'feeding' | 'attendance' | 'archive_attendance' | 'archive_feeding'
  ): boolean => {
    // 1. Check student registration
    if (type !== 'archive_feeding' && students.length === 0) {
      setValidationModal({
        isOpen: true,
        errorType: 'no_students',
        customMessage: {
          amharic: 'እባክዎ መጀመሪያ ተማሪዎችን ይመዝግቡ።',
          english: 'Please register students first.',
        },
        actions: onNavigateToTab
          ? [
              {
                label: 'ተማሪዎችን ይመዝግቡ / Register Students',
                primary: true,
                onClick: () => {
                  setValidationModal((prev) => ({ ...prev, isOpen: false }));
                  onNavigateToTab('students');
                },
              },
            ]
          : [],
      });
      return false;
    }

    // 2. Check feeding report
    if (type === 'feeding') {
      if (!currentFeeding) {
        setValidationModal({
          isOpen: true,
          errorType: 'no_report_data',
          customMessage: {
            amharic: 'ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።',
            english: 'The report has not been completed. Please fill in the report before exporting or downloading it.',
          },
          actions: onNavigateToFeeding
            ? [
                {
                  label: 'የምገባ ሪፖርት ሙላ / Fill Feeding Report',
                  primary: true,
                  onClick: () => {
                    setValidationModal((prev) => ({ ...prev, isOpen: false }));
                    onNavigateToFeeding(selectedDate);
                  },
                },
              ]
            : [],
        });
        return false;
      }
      const val = validateReportBeforeExport({
        students,
        feeding: currentFeeding,
        checkType: 'feeding',
      });
      if (!val.isValid) {
        setValidationModal({
          isOpen: true,
          errorType: val.errorType || 'partial_fields',
          missingFields: val.missingFields,
          actions: onNavigateToFeeding
            ? [
                {
                  label: 'ሪፖርቱን አሟላ / Complete Form',
                  primary: true,
                  onClick: () => {
                    setValidationModal((prev) => ({ ...prev, isOpen: false }));
                    onNavigateToFeeding(selectedDate);
                  },
                },
              ]
            : [],
        });
        return false;
      }
    }

    // 3. Check attendance report
    if (type === 'attendance') {
      if (!currentAttendance || Object.keys(currentAttendance.records || {}).length === 0) {
        setValidationModal({
          isOpen: true,
          errorType: 'no_report_data',
          customMessage: {
            amharic: 'ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።',
            english: 'The report has not been completed. Please fill in the report before exporting or downloading it.',
          },
          actions: onNavigateToAttendance
            ? [
                {
                  label: 'አቴንዳንስ ሙላ / Take Attendance',
                  primary: true,
                  onClick: () => {
                    setValidationModal((prev) => ({ ...prev, isOpen: false }));
                    onNavigateToAttendance(selectedDate);
                  },
                },
              ]
            : [],
        });
        return false;
      }
    }

    // 4. Combined report: requires at least one of attendance or feeding, and if feeding exists, must be valid
    if (type === 'combined') {
      if (!currentAttendance && !currentFeeding) {
        setValidationModal({
          isOpen: true,
          errorType: 'no_report_data',
          customMessage: {
            amharic: 'ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።',
            english: 'The report has not been completed. Please fill in the report before exporting or downloading it.',
          },
          actions: [
            ...(onNavigateToAttendance
              ? [
                  {
                    label: 'አቴንዳንስ ሙላ / Take Attendance',
                    primary: true,
                    onClick: () => {
                      setValidationModal((prev) => ({ ...prev, isOpen: false }));
                      onNavigateToAttendance(selectedDate);
                    },
                  },
                ]
              : []),
            ...(onNavigateToFeeding
              ? [
                  {
                    label: 'የምገባ ሪፖርት ሙላ / Fill Feeding Report',
                    onClick: () => {
                      setValidationModal((prev) => ({ ...prev, isOpen: false }));
                      onNavigateToFeeding(selectedDate);
                    },
                  },
                ]
              : []),
          ],
        });
        return false;
      }

      if (currentFeeding) {
        const val = validateReportBeforeExport({
          students,
          feeding: currentFeeding,
          checkType: 'feeding',
        });
        if (!val.isValid && val.errorType === 'partial_fields') {
          setValidationModal({
            isOpen: true,
            errorType: 'partial_fields',
            missingFields: val.missingFields,
            actions: onNavigateToFeeding
              ? [
                  {
                    label: 'ሪፖርቱን አሟላ / Complete Form',
                    primary: true,
                    onClick: () => {
                      setValidationModal((prev) => ({ ...prev, isOpen: false }));
                      onNavigateToFeeding(selectedDate);
                    },
                  },
                ]
              : [],
          });
          return false;
        }
      }
    }

    // 5. Archives
    if (type === 'archive_attendance' && attendanceHistory.length === 0) {
      setValidationModal({
        isOpen: true,
        errorType: 'no_period_reports',
        customMessage: {
          amharic: 'በተመረጠው ጊዜ ውስጥ የተቀመጠ ሪፖርት የለም።',
          english: 'No saved reports were found for the selected period.',
        },
      });
      return false;
    }

    if (type === 'archive_feeding' && feedingReports.length === 0) {
      setValidationModal({
        isOpen: true,
        errorType: 'no_period_reports',
        customMessage: {
          amharic: 'በተመረጠው ጊዜ ውስጥ የተቀመጠ ሪፖርት የለም።',
          english: 'No saved reports were found for the selected period.',
        },
      });
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1B2730] rounded-2xl p-4 border border-[#E8E0D0] dark:border-[#37474F] shadow-xs">
        <h2 className="text-lg font-black text-[#263238] dark:text-[#F5F7FA] tracking-tight">
          Export Reports / ሪፖርቶችን አውርድ
        </h2>
        <p className="text-xs text-[#607D8B] dark:text-[#B0BEC5] mt-0.5">
          Download PDF, Microsoft Word (.docx), and Excel (.xlsx) files for attendance and feeding program records.
        </p>

        {/* Ethiopian Date Selector */}
        <div className="mt-3.5 max-w-xs">
          <EthiopianDatePicker
            value={selectedDate}
            onChange={(newIso) => setSelectedDate(newIso)}
            label="ቀን ምረጥ (Select Date)"
          />
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-cyan-50 dark:bg-[#24343D] border border-[#00BCD4]/40 dark:border-[#4DD0E1]/40 text-[#006064] dark:text-[#4DD0E1] rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#006064] dark:text-[#4DD0E1]" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Primary Section: Combined Student Attendance & Feeding Report */}
      <div className="bg-gradient-to-br from-[#00BCD4]/10 via-[#006064]/5 to-white dark:from-[#24343D] dark:via-[#1B2730] dark:to-[#101820] rounded-3xl p-5 border-2 border-[#006064]/30 dark:border-[#4DD0E1]/40 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#006064] text-white shadow-md shadow-[#006064]/30">
              <FileCheck2 className="w-6 h-6 text-[#00BCD4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-[#263238] dark:text-[#F5F7FA]">
                  Combined Report / የተሟላ ሪፖርት (Primary)
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#006064] text-white">
                  All-in-One
                </span>
              </div>
              <p className="text-xs text-[#607D8B] dark:text-[#B0BEC5] mt-0.5">
                Single complete document containing both <strong>Section 1: Student Attendance</strong> and <strong>Section 2: Daily Feeding Report</strong> with the 3-step activity schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Data summary status for selected date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-white/80 dark:bg-[#24343D]/80 rounded-xl p-3 border border-[#E8E0D0] dark:border-[#37474F] flex items-center justify-between">
            <span className="font-semibold text-[#607D8B] dark:text-[#B0BEC5]">1. Attendance (አቴንዳንስ):</span>
            {currentAttendance ? (
              <span className="font-bold text-[#006064] dark:text-[#4DD0E1] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00BCD4]" /> Taken ({students.length} students)
              </span>
            ) : (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Pending (Default status included)
              </span>
            )}
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <span className="font-semibold text-slate-500">2. Feeding (ምገባ):</span>
            {currentFeeding ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Logged ({currentFeeding.childrenCount} children)
              </span>
            ) : (
              <span className="font-medium text-slate-400 italic">
                Pending (Included with blank schedule)
              </span>
            )}
          </div>
        </div>

        {/* 3 Download Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={async () => {
              if (!checkAndValidateExport('combined')) return;
              await exportCombinedReportPDF(
                selectedDate,
                students,
                currentAttendance,
                currentFeeding,
                settings
              );
              notifyDownload(`Daily_Combined_Report_${selectedDate}.pdf`);
            }}
            className="py-3 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition"
          >
            <FileDown className="w-4 h-4" />
            <div className="text-left">
              <div>Combined PDF</div>
              <div className="text-[10px] font-normal opacity-80">.pdf print-ready</div>
            </div>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!checkAndValidateExport('combined')) return;
              await exportCombinedReportWord(
                selectedDate,
                students,
                currentAttendance,
                currentFeeding,
                settings
              );
              notifyDownload(`Daily_Combined_Report_${selectedDate}.docx`);
            }}
            className="py-3 px-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-98 transition"
          >
            <FileText className="w-4 h-4" />
            <div className="text-left">
              <div>Combined Word</div>
              <div className="text-[10px] font-normal opacity-80">.docx editable</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!checkAndValidateExport('combined')) return;
              exportCombinedReportExcel(
                selectedDate,
                students,
                currentAttendance,
                currentFeeding,
                settings
              );
              notifyDownload(`Daily_Combined_Report_${selectedDate}.xlsx`);
            }}
            className="py-3 px-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-800/20 active:scale-98 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <div className="text-left">
              <div>Combined Excel</div>
              <div className="text-[10px] font-normal opacity-80">.xlsx 3 worksheets</div>
            </div>
          </button>
        </div>
      </div>

      {/* Section 1: Daily Feeding Report Export */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Daily Feeding Report (የዕለት ምገባ ሪፖርት)
              </h3>
              <p className="text-[11px] text-slate-500">
                {currentFeeding
                  ? `${currentFeeding.foodType} • ${currentFeeding.childrenCount} children fed`
                  : `No feeding report saved for ${selectedDate}`}
              </p>
            </div>
          </div>
        </div>

        {currentFeeding ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!checkAndValidateExport('feeding')) return;
                await exportFeedingReportPDF(currentFeeding);
                notifyDownload(`Feeding_Report_${selectedDate}.pdf`);
              }}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF (.pdf)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!checkAndValidateExport('feeding')) return;
                await exportFeedingReportWord(currentFeeding);
                notifyDownload(`Feeding_Report_${selectedDate}.docx`);
              }}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word (.docx)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!checkAndValidateExport('feeding')) return;
                exportFeedingReportExcel(currentFeeding);
                notifyDownload(`Feeding_Report_${selectedDate}.xlsx`);
              }}
              className="py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              * ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።
            </p>
            {onNavigateToFeeding && (
              <button
                type="button"
                onClick={() => onNavigateToFeeding(selectedDate)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition"
              >
                ሪፖርቱን ሙላ / Fill Report
              </button>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Student Attendance Report Export */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Student Attendance Report (የተማሪዎች አቴንዳንስ)
            </h3>
            <p className="text-[11px] text-slate-500">
              {currentAttendance
                ? `Actual attendance data with ${students.length} students`
                : `No attendance taken for ${selectedDate}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!checkAndValidateExport('attendance')) return;
              await exportDailyAttendancePDF(selectedDate, students, currentAttendance, settings);
              notifyDownload(`Attendance_Report_${selectedDate}.pdf`);
            }}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF (.pdf)</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!checkAndValidateExport('attendance')) return;
              await exportDailyAttendanceWord(selectedDate, students, currentAttendance, settings);
              notifyDownload(`Attendance_Report_${selectedDate}.docx`);
            }}
            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Word (.docx)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!checkAndValidateExport('attendance')) return;
              exportDailyAttendanceExcel(selectedDate, students, currentAttendance, settings);
              notifyDownload(`Attendance_Report_${selectedDate}.xlsx`);
            }}
            className="py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Section 3: Cumulative & Full Program Archives */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Cumulative &amp; Multi-Session Archives
            </h3>
            <p className="text-[11px] text-slate-500">
              Bulk spreadsheets and reports across the entire school year.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Cumulative Attendance Excel */}
          <button
            type="button"
            onClick={() => {
              if (!checkAndValidateExport('archive_attendance')) return;
              downloadExcelSheet('Cumulative-Attendance-Report', students, attendanceHistory);
              notifyDownload('Cumulative-Attendance-Report.xlsx');
            }}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Cumulative Attendance Excel
              </p>
              <p className="text-[10px] text-slate-500">
                All dates &amp; rates for {students.length} students
              </p>
            </div>
            <Download className="w-4 h-4 text-emerald-600" />
          </button>

          {/* All Feeding History Excel */}
          <button
            type="button"
            onClick={() => {
              if (!checkAndValidateExport('archive_feeding')) return;
              exportAllFeedingHistoryExcel(feedingReports);
              notifyDownload('Feeding_History.xlsx');
            }}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                All Feeding Reports Archive
              </p>
              <p className="text-[10px] text-slate-500">
                {feedingReports.length} sessions recorded in Excel
              </p>
            </div>
            <Download className="w-4 h-4 text-amber-600" />
          </button>

          {/* Full Term PDF Attendance */}
          <button
            type="button"
            onClick={() => {
              if (!checkAndValidateExport('archive_attendance')) return;
              downloadPDFReport('Term-Attendance-Report', settings, students, attendanceHistory);
              notifyDownload('Term-Attendance-Report.pdf');
            }}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Term Attendance PDF
              </p>
              <p className="text-[10px] text-slate-500">
                Formal printed report with percentages
              </p>
            </div>
            <Download className="w-4 h-4 text-emerald-600" />
          </button>

          {/* Full Term Word (.doc) Attendance */}
          <button
            type="button"
            onClick={() => {
              if (!checkAndValidateExport('archive_attendance')) return;
              downloadWordReport('Term-Attendance-Report', settings, students, attendanceHistory);
              notifyDownload('Term-Attendance-Report.docx');
            }}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Term Attendance Word (.docx)
              </p>
              <p className="text-[10px] text-slate-500">
                Editable Word table report
              </p>
            </div>
            <Download className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Validation Alert Modal */}
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

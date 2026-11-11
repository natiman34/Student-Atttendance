import React, { useState, useMemo } from 'react';
import type { Student, DayAttendance, DailyFeedingReport, AppSettings } from '../types.ts';
import {
  formatDisplayDate,
  getTodayDateString,
  calculateDayStats,
} from '../utils/attendance.ts';
import {
  exportCombinedReportPDF,
  exportCombinedReportWord,
  exportCombinedReportExcel,
} from '../utils/combinedExports.ts';
import { EthiopianDatePicker } from './EthiopianDatePicker.tsx';
import {
  ReportValidationModal,
  type ReportValidationErrorType,
} from './ReportValidationModal.tsx';
import { validateReportBeforeExport } from '../utils/reportAggregations.ts';
import {
  FileDown,
  FileText,
  FileSpreadsheet,
  X,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface ExportCompleteReportFabProps {
  students: Student[];
  attendanceHistory: DayAttendance[];
  feedingReports: DailyFeedingReport[];
  settings: AppSettings;
}

export const ExportCompleteReportFab: React.FC<ExportCompleteReportFabProps> = ({
  students,
  attendanceHistory,
  feedingReports,
  settings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    // Check if user previously minimized
    try {
      return localStorage.getItem('rollcall_export_fab_minimized') === 'true';
    } catch {
      return false;
    }
  });
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'word' | 'excel' | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Pre-export validation modal state
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    errorType: ReportValidationErrorType;
    missingFields?: string[];
    customMessage?: { amharic: string; english: string };
  }>({
    isOpen: false,
    errorType: 'no_students',
  });

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isMinimized;
    setIsMinimized(next);
    try {
      localStorage.setItem('rollcall_export_fab_minimized', String(next));
    } catch {
      // ignore
    }
  };

  // Find attendance and feeding for selected date
  const dayAttendance = useMemo(
    () => attendanceHistory.find((a) => a.date === selectedDate),
    [attendanceHistory, selectedDate]
  );

  const dayFeeding = useMemo(
    () => feedingReports.find((f) => f.date === selectedDate),
    [feedingReports, selectedDate]
  );

  const stats = useMemo(
    () => calculateDayStats(students, dayAttendance?.records),
    [students, dayAttendance]
  );

  const isToday = selectedDate === getTodayDateString();

  const handleExport = async (format: 'pdf' | 'word' | 'excel') => {
    if (exportingFormat) return; // Prevent duplicate rapid clicks

    // Validation 1: Student check
    if (students.length === 0) {
      setValidationModal({
        isOpen: true,
        errorType: 'no_students',
        customMessage: {
          amharic: 'እባክዎ መጀመሪያ ተማሪዎችን ይመዝግቡ።',
          english: 'Please register students first before exporting reports.',
        },
      });
      return;
    }

    // Validation 2: Report check - must have either attendance or feeding
    if (!dayAttendance && !dayFeeding) {
      setValidationModal({
        isOpen: true,
        errorType: 'no_report_data',
        customMessage: {
          amharic: 'ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።',
          english: 'The report has not been completed. Please fill in the report before exporting or downloading it.',
        },
      });
      return;
    }

    // Validation 3: Partially completed feeding report
    if (dayFeeding) {
      const val = validateReportBeforeExport({
        students,
        feeding: dayFeeding,
        checkType: 'feeding',
      });
      if (!val.isValid && val.errorType === 'partial_fields') {
        setValidationModal({
          isOpen: true,
          errorType: 'partial_fields',
          missingFields: val.missingFields,
        });
        return;
      }
    }

    setExportingFormat(format);
    setExportSuccessMessage(null);
    setExportError(null);

    try {
      if (format === 'pdf') {
        await exportCombinedReportPDF(
          selectedDate,
          students,
          dayAttendance,
          dayFeeding,
          settings
        );
        setExportSuccessMessage(`Daily_Report_${selectedDate}.pdf በተሳካ ሁኔታ ወርዷል!`);
      } else if (format === 'word') {
        await exportCombinedReportWord(
          selectedDate,
          students,
          dayAttendance,
          dayFeeding,
          settings
        );
        setExportSuccessMessage(`Daily_Report_${selectedDate}.docx በተሳካ ሁኔታ ወርዷል!`);
      } else if (format === 'excel') {
        exportCombinedReportExcel(
          selectedDate,
          students,
          dayAttendance,
          dayFeeding,
          settings
        );
        setExportSuccessMessage(`Daily_Report_${selectedDate}.xlsx በተሳካ ሁኔታ ወርዷል!`);
      }
    } catch (err) {
      console.error('Export error:', err);
      setExportError(
        err instanceof Error
          ? err.message
          : 'ሪፖርቱን ማውረድ አልተቻለም። እባክዎ እንደገና ይሞክሩ (Failed to export report).'
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const getActLabel = (type?: string) => {
    if (type === 'lesson') return 'ትምህርት (Lesson)';
    if (type === 'game') return 'ጨዋታ (Game)';
    return 'ምንም (Nothing)';
  };

  return (
    <>
      {/* Floating Action Button */}
      <aside
        aria-label="Export Actions"
        style={{
          position: 'fixed',
          bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          right: '1rem',
          zIndex: 40,
        }}
        className="flex flex-col items-end print:hidden pointer-events-auto"
      >
        {isMinimized ? (
          // Minimized Compact Floating Circle (Does not block inputs or text)
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setExportSuccessMessage(null);
                setExportError(null);
              }}
              title="የተሟላ ሪፖርት አውርድ (Export Complete Report)"
              aria-label="Open complete report export"
              className="w-11 h-11 rounded-full bg-[#173B65] hover:bg-[#102a4a] text-white shadow-lg shadow-[#173B65]/30 flex items-center justify-center border-2 border-white/40 dark:border-slate-800 active:scale-95 transition-all"
            >
              <FileDown className="w-5 h-5 text-white" />
            </button>
            <button
              type="button"
              onClick={toggleMinimize}
              title="Expand export button (አስፋ)"
              aria-label="Expand export button"
              className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] shadow hover:bg-slate-700 border border-slate-600"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        ) : (
          // Expanded Pill with Minimize Toggle
          <div className="flex items-center gap-1 bg-[#173B65] hover:bg-[#102a4a] text-white shadow-xl shadow-[#173B65]/30 rounded-full border border-teal-400/30 p-1 pl-3 transition-all">
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                setExportSuccessMessage(null);
                setExportError(null);
              }}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              aria-label="Export Today's Complete Report (የተሟላ ሪፖርት ማውረጃ)"
              className="group flex items-center gap-2 text-white active:scale-95 transition-all focus:outline-hidden"
            >
              <FileDown className="w-4 h-4 shrink-0 text-[#0D9488] group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs sm:text-sm tracking-wide">
                የተሟላ ሪፖርት
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full bg-[#0D9488] text-white">
                Export
              </span>
            </button>

            {/* Minimize toggle button */}
            <button
              type="button"
              onClick={toggleMinimize}
              title="Minimize button (አሳንስ - እንዳይጋርድ)"
              aria-label="Minimize export button"
              className="p-1 rounded-full text-teal-200 hover:text-white hover:bg-white/10 transition ml-0.5"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </aside>

      {/* Floating Menu Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-menu-title"
          style={{ zIndex: 100 }}
          className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="export-menu-title"
                    className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2"
                  >
                    <span>ዕለታዊ የተሟላ ሪፖርት</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      All-in-One
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Daily Combined Attendance &amp; Feeding Report
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Close export dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto space-y-4 pt-4 flex-1">
              {/* Date Header & Toggle */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/70 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                      የሪፖርቱ ቀን (Report Date)
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {formatDisplayDate(selectedDate)}
                    </span>
                    <span className="font-mono text-xs text-slate-400 ml-1.5">
                      ({selectedDate}) {isToday ? '• ዛሬ (Today)' : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{showDatePicker ? 'አጥፋ' : 'ቀን ቀይር'}</span>
                  </button>
                </div>

                {showDatePicker && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <EthiopianDatePicker
                      value={selectedDate}
                      onChange={(newIso) => {
                        setSelectedDate(newIso);
                        setShowDatePicker(false);
                        setExportSuccessMessage(null);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Day Contents Live Summary */}
              <div className="space-y-2 text-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  የተካተቱ መረጃዎች (Included Sections):
                </p>

                {/* Section 1 Attendance */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      ክፍል 1: የተማሪዎች አቴንዳንስ (Attendance)
                    </span>
                    {dayAttendance ? (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {stats.present} ተገኝተዋል • {stats.absent} ቀሪ • {stats.permission} ፈቃድ ({stats.attendanceRate}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>አቴንዳንስ አልተወሰደም (Default unrecorded list will be included)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Section 2 Feeding */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      ክፍል 2: የዕለት ምገባ ሪፖርት (Feeding Program)
                    </span>
                    {dayFeeding ? (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex flex-col gap-0.5 mt-0.5">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {dayFeeding.childrenCount} ህፃናት • {dayFeeding.foodType} ({dayFeeding.foodQuantityKg} kg)
                          </span>
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          አስተባባሪ: {dayFeeding.coordinatorName} • እንቅስቃሴ: {getActLabel(dayFeeding.activityType)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>የምገባ መረጃ አልተመዘገበም (Blank feeding schedule will be included)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Gaps/Notes if present */}
                {dayFeeding?.generalNotes && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px]">
                    <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                      በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች:
                    </span>
                    <p className="text-amber-800 dark:text-amber-200 italic">
                      &ldquo;{dayFeeding.generalNotes}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Notifications */}
              {exportSuccessMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{exportSuccessMessage}</span>
                </div>
              )}

              {exportError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {/* Primary PDF Export Button */}
              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleExport('pdf')}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/30 active:scale-98 transition"
              >
                {exportingFormat === 'pdf' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>PDF በማዘጋጀት ላይ... (Generating PDF...)</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>የተሟላ ሪፖርት PDF አውርድ (Download PDF)</span>
                  </>
                )}
              </button>

              {/* Secondary Options: Word and Excel */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={exportingFormat !== null}
                  onClick={() => handleExport('word')}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  {exportingFormat === 'word' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Word (.docx)</span>
                </button>

                <button
                  type="button"
                  disabled={exportingFormat !== null}
                  onClick={() => handleExport('excel')}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  {exportingFormat === 'excel' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Excel (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-export validation dialog */}
      <ReportValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal((prev) => ({ ...prev, isOpen: false }))}
        errorType={validationModal.errorType}
        missingFields={validationModal.missingFields}
        customMessage={validationModal.customMessage}
      />
    </>
  );
};

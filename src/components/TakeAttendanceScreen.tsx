import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, DayAttendance, AttendanceStatus } from '../types.ts';
import {
  formatDisplayDate,
  formatRollNumber,
  getTodayDateString,
  calculateDayStats,
} from '../utils/attendance.ts';
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  Search,
  CheckCheck,
  Calendar,
  Save,
  ChevronDown,
  StickyNote,
  FileDown,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  exportCombinedReportPDF,
  exportCombinedReportWord,
  exportCombinedReportExcel,
  exportDailyAttendancePDF,
  exportDailyAttendanceWord,
  exportDailyAttendanceExcel,
} from '../utils/reportExports.ts';
import type { DailyFeedingReport } from '../types.ts';
import { EthiopianDatePicker } from './EthiopianDatePicker.tsx';
import {
  saveAttendanceDraft,
  getAttendanceDraft,
  clearAttendanceDraft,
  hasAttendanceDraft,
  formatLastSaved,
} from '../utils/draftStorage.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { useTranslation } from '../i18n/LanguageContext.tsx';

interface TakeAttendanceScreenProps {
  initialDate?: string;
  students: Student[];
  attendanceHistory: DayAttendance[];
  feedingReports?: DailyFeedingReport[];
  settings?: import('../types.ts').AppSettings;
  onBack: () => void;
  onSave: (
    date: string,
    records: Record<string, AttendanceStatus>,
    notes?: Record<string, string>,
    stayOnScreen?: boolean,
    auditEntry?: import('../types.ts').AttendanceAuditEntry
  ) => void;
}

export const TakeAttendanceScreen: React.FC<TakeAttendanceScreenProps> = ({
  initialDate,
  students,
  attendanceHistory,
  feedingReports = [],
  settings,
  onBack,
  onSave,
}) => {
  const { language, t } = useTranslation();
  const isAm = language === 'am';
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || getTodayDateString()
  );
  const [showImmediateExportModal, setShowImmediateExportModal] = useState(false);
  const [showDiscardDraftModal, setShowDiscardDraftModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAuditHistoryModal, setShowAuditHistoryModal] = useState(false);
  const [editReason, setEditReason] = useState('');

  // Active students only (exclude archived students from daily marking)
  const activeStudents = useMemo(() => students.filter((s) => !s.isArchived), [students]);

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [draftRestoredTime, setDraftRestoredTime] = useState<number | null>(null);

  // Find existing record for this date or start fresh/default all present if desired
  const existingRecord = useMemo(
    () => attendanceHistory.find((a) => a.date === selectedDate),
    [attendanceHistory, selectedDate]
  );

  const matchedFeeding = useMemo(
    () => feedingReports.find((f) => f.date === selectedDate),
    [feedingReports, selectedDate]
  );

  // Local state for the attendance records of this date
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(() => {
    const draft = getAttendanceDraft(initialDate || getTodayDateString());
    if (draft && Object.keys(draft.records).length > 0) {
      const activeOnly: Record<string, AttendanceStatus> = {};
      for (const [sId, st] of Object.entries(draft.records)) {
        if (st === 'present' || st === 'permission') {
          activeOnly[sId] = st;
        }
      }
      return activeOnly;
    }
    if (existingRecord?.records) {
      const activeOnly: Record<string, AttendanceStatus> = {};
      for (const [sId, st] of Object.entries(existingRecord.records)) {
        if (st === 'present' || st === 'permission') {
          activeOnly[sId] = st;
        }
      }
      return activeOnly;
    }
    if (settings?.defaultStatus === 'present') {
      const initial: Record<string, AttendanceStatus> = {};
      activeStudents.forEach((s) => {
        initial[s.id] = 'present';
      });
      return initial;
    }
    return {};
  });

  // Local state for quick notes attached to attendance
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const draft = getAttendanceDraft(initialDate || getTodayDateString());
    if (draft?.notes && Object.keys(draft.notes).length > 0) {
      return { ...draft.notes };
    }
    if (existingRecord?.notes) {
      return { ...existingRecord.notes };
    }
    return {};
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'permission' | 'unmarked'>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Set initial draftRestoredTime if draft was present on mount
  useEffect(() => {
    const draft = getAttendanceDraft(selectedDate);
    if (draft && Object.keys(draft.records).length > 0) {
      setDraftRestoredTime(draft.updatedAt);
      setLastSavedTime(draft.updatedAt);
    }
  }, []);

  // Ref to track latest state for synchronous flush on exit/unmount
  const attendanceStateRef = useRef({ selectedDate, records, notes });
  useEffect(() => {
    attendanceStateRef.current = { selectedDate, records, notes };
  }, [selectedDate, records, notes]);

  const flushAttendanceDraftNow = (): boolean => {
    const s = attendanceStateRef.current;
    if (Object.keys(s.records).length === 0 && Object.keys(s.notes).length === 0) {
      return false;
    }
    const res = saveAttendanceDraft(s.selectedDate, s.records, s.notes);
    if (res.success) {
      setAutoSaveStatus('saved');
      setLastSavedTime(res.timestamp);
      return true;
    } else {
      setAutoSaveStatus('error');
      return false;
    }
  };

  // Auto-save effect
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (Object.keys(records).length === 0 && Object.keys(notes).length === 0) {
      return;
    }

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      flushAttendanceDraftNow();
    }, 350);

    return () => clearTimeout(timer);
  }, [selectedDate, records, notes]);

  // Lifecycle listeners for pagehide, visibilitychange, beforeunload, and unmount
  useEffect(() => {
    const handleVis = () => {
      if (document.visibilityState === 'hidden') flushAttendanceDraftNow();
    };
    const handleHide = () => flushAttendanceDraftNow();
    const handleUnload = () => flushAttendanceDraftNow();

    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('pagehide', handleHide);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('pagehide', handleHide);
      window.removeEventListener('beforeunload', handleUnload);
      flushAttendanceDraftNow();
    };
  }, []);

  // When changing date from picker
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const draft = getAttendanceDraft(newDate);
    const existing = attendanceHistory.find((a) => a.date === newDate);

    const extractActive = (source: Record<string, AttendanceStatus>): Record<string, AttendanceStatus> => {
      const active: Record<string, AttendanceStatus> = {};
      for (const [sId, st] of Object.entries(source)) {
        if (st === 'present' || st === 'permission') {
          active[sId] = st;
        }
      }
      return active;
    };

    if (draft && Object.keys(draft.records).length > 0) {
      setRecords(extractActive(draft.records));
      setNotes(draft.notes ? { ...draft.notes } : {});
      setDraftRestoredTime(draft.updatedAt);
      setLastSavedTime(draft.updatedAt);
      setAutoSaveStatus('saved');
    } else if (existing?.records) {
      setRecords(extractActive(existing.records));
      setNotes(existing.notes ? { ...existing.notes } : {});
      setDraftRestoredTime(null);
    } else if (settings?.defaultStatus === 'present') {
      const initial: Record<string, AttendanceStatus> = {};
      students.forEach((s) => {
        initial[s.id] = 'present';
      });
      setRecords(initial);
      setNotes({});
      setDraftRestoredTime(null);
    } else {
      setRecords({});
      setNotes({});
      setDraftRestoredTime(null);
    }
    setShowDatePicker(false);
  };

  const handleDiscardDraft = () => {
    clearAttendanceDraft(selectedDate);
    setDraftRestoredTime(null);
    setLastSavedTime(null);
    setShowDiscardDraftModal(false);

    const extractActive = (source: Record<string, AttendanceStatus>): Record<string, AttendanceStatus> => {
      const active: Record<string, AttendanceStatus> = {};
      for (const [sId, st] of Object.entries(source)) {
        if (st === 'present' || st === 'permission') {
          active[sId] = st;
        }
      }
      return active;
    };

    // Reset back to saved history or default
    const existing = attendanceHistory.find((a) => a.date === selectedDate);
    if (existing?.records) {
      setRecords(extractActive(existing.records));
      setNotes(existing.notes ? { ...existing.notes } : {});
    } else if (settings?.defaultStatus === 'present') {
      const initial: Record<string, AttendanceStatus> = {};
      students.forEach((s) => {
        initial[s.id] = 'present';
      });
      setRecords(initial);
      setNotes({});
    } else {
      setRecords({});
      setNotes({});
    }
  };

  // Mark all present (fast attendance shortcut)
  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    for (const student of students) {
      updated[student.id] = 'present';
    }
    setRecords(updated);
  };

  // Clear all selections (resets all to blank / unmarked status)
  const handleClearAll = () => {
    setRecords({});
  };

  // Toggle student status:
  // First click: Select status.
  // Second click on the same button: Unselect and return to blank status.
  // Clicking other button: Switches to other status immediately. Never both simultaneously.
  const handleToggleStatus = (studentId: string, targetStatus: 'present' | 'permission') => {
    setRecords((prev) => {
      const copy = { ...prev };
      if (copy[studentId] === targetStatus) {
        delete copy[studentId]; // Toggle off to blank
      } else {
        copy[studentId] = targetStatus; // Switch or set
      }
      return copy;
    });
  };

  // Update quick note for a student
  const handleSetNote = (studentId: string, noteText: string) => {
    setNotes((prev) => {
      if (!noteText.trim()) {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      }
      return {
        ...prev,
        [studentId]: noteText,
      };
    });
  };

  // One-tap chip shortcut for quick note
  const handleQuickChip = (studentId: string, chipText: string) => {
    const current = notes[studentId] || '';
    if (current === chipText) {
      handleSetNote(studentId, '');
    } else if (!current.trim()) {
      handleSetNote(studentId, chipText);
    } else if (!current.includes(chipText)) {
      handleSetNote(studentId, `${current}, ${chipText}`);
    }
  };

  // Finalized records helper: Unmarked / blank students automatically finalize as 'absent'
  const getFinalizedRecords = (): Record<string, AttendanceStatus> => {
    const finalized: Record<string, AttendanceStatus> = {};
    for (const student of activeStudents) {
      const st = records[student.id];
      finalized[student.id] = st === 'present' || st === 'permission' ? st : 'absent';
    }
    return finalized;
  };

  // Live Stats calculation: Present, Permission, Unmarked (projected Absent), Total = Present + Permission + Absent
  const stats = useMemo(() => {
    let present = 0;
    let permission = 0;
    for (const student of activeStudents) {
      const st = records[student.id];
      if (st === 'present') present++;
      else if (st === 'permission') permission++;
    }
    const unmarked = activeStudents.length - present - permission;
    const rate = activeStudents.length > 0 ? Math.round((present / activeStudents.length) * 100) : 0;
    return {
      present,
      permission,
      unmarked,
      absent: unmarked, // When finalized or exported, unmarked students are treated as absent
      totalStudents: activeStudents.length,
      attendanceRate: rate,
    };
  }, [activeStudents, records]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return activeStudents.filter((s) => {
      // Search check
      const matchesSearch =
        q === '' ||
        s.name.toLowerCase().includes(q) ||
        formatRollNumber(s.rollNumber).includes(q) ||
        s.rollNumber.toString().includes(q) ||
        (s.studentIdNumber && s.studentIdNumber.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'unmarked') {
        const st = records[s.id];
        return st !== 'present' && st !== 'permission';
      }
      return records[s.id] === statusFilter;
    });
  }, [activeStudents, searchQuery, statusFilter, records]);

  // Open Attendance Summary Modal for teacher confirmation before saving
  const handleSave = () => {
    setShowSummaryModal(true);
  };

  // Confirmed final save with optional audit log entry
  const handleConfirmFinalSave = () => {
    const cleanedNotes: Record<string, string> = {};
    Object.entries(notes).forEach(([sId, note]) => {
      if (note && note.trim()) {
        cleanedNotes[sId] = note.trim();
      }
    });

    const finalizedRecords = getFinalizedRecords();

    // Construct audit entry if this day was previously saved
    let auditEntry: import('../types.ts').AttendanceAuditEntry | undefined;
    if (existingRecord) {
      const prevStats = calculateDayStats(activeStudents, existingRecord.records);
      auditEntry = {
        timestamp: Date.now(),
        reason: editReason.trim() || (isAm ? 'የተሰብሳቢዎች መዝገብ ተስተካክሏል' : 'Attendance updated'),
        author: settings?.teacherName || 'Teacher',
        previousCounts: {
          present: prevStats.present,
          absent: prevStats.absent,
          permission: prevStats.permission,
        },
        newCounts: {
          present: stats.present,
          absent: stats.absent,
          permission: stats.permission,
        },
      };
    }

    // Clear draft on successful official save
    clearAttendanceDraft(selectedDate);
    setDraftRestoredTime(null);

    onSave(
      selectedDate,
      finalizedRecords,
      Object.keys(cleanedNotes).length > 0 ? cleanedNotes : undefined,
      true,
      auditEntry
    );
    setShowSummaryModal(false);
    setEditReason('');
    setShowImmediateExportModal(true);
  };

  if (students.length === 0) {
    return (
      <div className="py-12 px-4 text-center space-y-4">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">
            No Students in Roster
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please add students or import your Excel file first before taking attendance.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#1B2730]/95 backdrop-blur-md border-b border-[#E8E0D0] dark:border-[#37474F] -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3 shadow-xs transition-colors duration-200">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#263238] dark:text-[#F5F7FA] hover:text-[#00BCD4] dark:hover:text-[#4DD0E1] font-bold text-sm p-1.5 -ml-1 rounded-xl hover:bg-[#FFF8E7] dark:hover:bg-[#24343D] transition cursor-pointer"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-[#006064] dark:text-[#4DD0E1]" />
            <span>{t.attendanceTitle}</span>
          </button>

          {/* Date Picker & Export Action */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowImmediateExportModal(true)}
              className="p-2 rounded-xl bg-[#FFF8E7] hover:bg-[#F5EDD6] dark:bg-[#24343D] dark:hover:bg-[#1B2730] border border-[#E8E0D0] dark:border-[#37474F] text-[#263238] dark:text-[#F5F7FA] transition cursor-pointer"
              title={t.exportAttendanceReport}
              aria-label={t.exportAttendanceReport}
            >
              <FileDown className="w-4 h-4 text-[#006064] dark:text-[#4DD0E1]" />
            </button>

            <div className="w-52 sm:w-64">
              <EthiopianDatePicker
                value={selectedDate}
                onChange={(newIso) => handleDateChange(newIso)}
              />
            </div>
          </div>
        </div>

        {/* Date and Count Sub-header */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#263238] dark:text-[#F5F7FA] tracking-tight">
              {formatDisplayDate(selectedDate)}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-[#607D8B] dark:text-[#B0BEC5]">
                <span className="font-mono tabular-nums">{activeStudents.length}</span> {t.studentsEnrolled}
              </span>
              {existingRecord?.auditLog && existingRecord.auditLog.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAuditHistoryModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200 transition cursor-pointer"
                  title={t.attendanceAuditLogTitle}
                >
                  <Clock className="w-3 h-3" />
                  <span>{existingRecord.auditLog.length} {isAm ? 'ማስተካከያዎች' : 'edits'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#006064] hover:bg-[#004d50] text-white font-bold text-xs shadow-xs active:scale-[0.98] transition cursor-pointer"
              title={t.allPresent}
              aria-label={t.allPresent}
            >
              <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>{t.allPresent}</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#64748B] dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs active:scale-[0.98] transition cursor-pointer"
              title={t.clearAll}
              aria-label={t.clearAll}
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.clearAll}</span>
            </button>
          </div>
        </div>

        {/* Real-time counters segmented filter bar */}
        <div className="mt-3 flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/70 rounded-xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-[#121826] dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.all} <span className="font-mono tabular-nums opacity-75">({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('present')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              statusFilter === 'present'
                ? 'bg-white text-emerald-700 shadow-xs dark:bg-[#121826] dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t.present}</span>
            <span className="font-mono tabular-nums opacity-75">({stats.present})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('permission')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              statusFilter === 'permission'
                ? 'bg-white text-amber-700 shadow-xs dark:bg-[#121826] dark:text-amber-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.permission}</span>
            <span className="font-mono tabular-nums opacity-75">({stats.permission})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('unmarked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              statusFilter === 'unmarked'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-[#121826] dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <span>{t.unmarkedFilter}</span>
            <span className="font-mono tabular-nums opacity-75">({stats.unmarked})</span>
          </button>
        </div>

        {/* Live Auto-save indicator and draft controls */}
        <div className="mt-2.5 flex items-center justify-between text-xs px-0.5">
          <div className="flex items-center gap-2">
            {autoSaveStatus === 'saving' ? (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                <span>በማስቀመጥ ላይ... (Saving draft...)</span>
              </span>
            ) : autoSaveStatus === 'error' ? (
              <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium text-xs">
                <span>⚠️ ማስቀመጥ አልተቻለም (Unable to save)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Draft saved {lastSavedTime ? `· ${formatLastSaved(lastSavedTime).am}` : ''}
                </span>
              </span>
            )}
          </div>

          {hasAttendanceDraft(selectedDate) && (
            <button
              type="button"
              onClick={() => setShowDiscardDraftModal(true)}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Discard unsubmitted draft"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ረቂቁን ሰርዝ (Discard)</span>
            </button>
          )}
        </div>

        {/* Quick Search Bar */}
        <div className="relative mt-2.5">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t.searchStudentsPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold p-1"
            >
              {t.clear}
            </button>
          )}
        </div>
      </div>

      {/* Student List */}
      <div className="mt-4 space-y-2.5">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#121826] rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No students found matching your search.
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const currentStatus = records[student.id];

            return (
              <div
                key={student.id}
                className={`rounded-2xl p-3.5 shadow-2xs border transition-all ${
                  currentStatus === 'present'
                    ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 ring-1 ring-[#16A34A]/25'
                    : currentStatus === 'permission'
                    ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 ring-1 ring-[#F59E0B]/25'
                    : 'bg-white dark:bg-[#151F38] border-[#E2E8F0] dark:border-[#2B3A67]'
                }`}
              >
                {/* Roll Number, Name, and Status Toggle Buttons */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <span className="shrink-0 w-8 text-center text-xs font-bold font-mono text-[#64748B] dark:text-slate-400">
                      {formatRollNumber(student.rollNumber)}
                    </span>
                    <span className="font-semibold text-[#172235] dark:text-[#F8FAFC] text-sm truncate">
                      {student.name}
                    </span>
                    {!currentStatus && (
                      <span className="hidden sm:inline text-[10px] text-slate-400 italic">
                        (Blank / Default Absent)
                      </span>
                    )}
                  </div>

                  {/* 2 Touch-friendly attendance toggle buttons: Present | Permission */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Present Toggle Option */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(student.id, 'present')}
                      aria-label={`Toggle Present for ${student.name} (click to select or unselect)`}
                      aria-pressed={currentStatus === 'present'}
                      className={`h-10 px-3.5 sm:px-4 min-w-[70px] rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                        currentStatus === 'present'
                          ? 'bg-[#16A34A] text-white shadow-xs ring-2 ring-[#16A34A]/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-[#16A34A]'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{t.present}</span>
                    </button>

                    {/* Permission Toggle Option */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(student.id, 'permission')}
                      aria-label={`${student.name} ${t.permission}`}
                      aria-pressed={currentStatus === 'permission'}
                      className={`h-10 px-3.5 sm:px-4 min-w-[70px] rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                        currentStatus === 'permission'
                          ? 'bg-[#F59E0B] text-white shadow-xs ring-2 ring-[#F59E0B]/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-[#F59E0B]'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t.permission}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Note Input Field */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                  <div className="relative flex items-center">
                    <StickyNote className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={t.addNotePlaceholder}
                      value={notes[student.id] || ''}
                      onChange={(e) => handleSetNote(student.id, e.target.value)}
                      className={`w-full pl-8 pr-8 py-1.5 rounded-xl border text-xs font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                        notes[student.id]
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white'
                      }`}
                    />
                    {notes[student.id] && (
                      <button
                        type="button"
                        onClick={() => handleSetNote(student.id, '')}
                        className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={t.clearNote}
                        aria-label={t.clearNote}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto no-scrollbar">
                    {[
                      { key: 'sick', label: t.tagSick, val: language === 'am' ? 'ታሟል' : 'Sick' },
                      { key: 'excused', label: t.tagExcused, val: language === 'am' ? 'ፈቃድ' : 'Excused' },
                      { key: 'late', label: t.tagLate, val: language === 'am' ? 'ያረፈደ' : 'Late' },
                      { key: 'appt', label: t.tagAppointment, val: language === 'am' ? 'ቀጠሮ' : 'Appointment' },
                    ].map((chip) => {
                      const isSelected = notes[student.id]?.toLowerCase().includes(chip.val.toLowerCase());
                      return (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => handleQuickChip(student.id, chip.val)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition whitespace-nowrap active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-white dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          +{chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Bar (Sticky near screen bottom) */}
      <div
        style={{
          bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        }}
        className="fixed left-0 right-0 z-30 p-3 pointer-events-none"
      >
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="bg-[#173B65]/98 dark:bg-[#151F38]/98 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-[#173B65] dark:border-[#2B3A67] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start px-2">
              <div>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  {t.attendanceLiveStatus} ({t.blankAbsentNotice})
                </p>
                <p className="text-xs font-bold text-white flex items-center gap-2 font-mono tabular-nums">
                  <span className="text-[#22c55e]">{stats.present} {t.present}</span>
                  <span className="text-slate-400" aria-hidden="true">•</span>
                  <span className="text-[#fbbf24]">{stats.permission} {t.permission}</span>
                  <span className="text-slate-400" aria-hidden="true">•</span>
                  <span className="text-[#f87171]">{stats.absent} {t.absent}</span>
                  <span className="text-slate-400" aria-hidden="true">•</span>
                  <span className="text-slate-200">{stats.attendanceRate}%</span>
                </p>
              </div>

              {matchedFeeding && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0D9488]/30 text-teal-200 border border-[#0D9488]/40">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{t.logged}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Export Complete Report Button */}
              <button
                type="button"
                onClick={() => setShowImmediateExportModal(true)}
                className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition active:scale-[0.98] cursor-pointer"
                title={t.exportAttendanceReport}
              >
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>{t.exportAction}</span>
              </button>

              {/* Save Attendance Button */}
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold text-xs tracking-wide shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4 text-white" />
                <span>{t.save}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Export Complete Report Modal */}
      {showImmediateExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <FileCheck2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Export Complete Report
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                የተማሪዎች አቴንዳንስ እና የዕለት ምገባ ሪፖርት በአንድ ሰነድ (Combined in 1 Document)
              </p>
            </div>

            {/* Scope details */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-600 dark:text-slate-300">ቀን (Date):</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatDisplayDate(selectedDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ክፍል 1 (Attendance):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.totalStudents} ተማሪዎች ({stats.present} P, {stats.absent} A, {stats.permission} Perm, {stats.attendanceRate}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ክፍል 2 (Feeding):</span>
                {matchedFeeding ? (
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {matchedFeeding.foodType} ({matchedFeeding.childrenCount} ህፃናት)
                  </span>
                ) : (
                  <span className="font-semibold text-slate-400 italic">
                    Pending (included with blank schedule)
                  </span>
                )}
              </div>
            </div>

            {/* Primary Combined 1-Tap Export Options */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Download Combined Report File:
              </p>

              <button
                type="button"
                onClick={async () => {
                  await exportCombinedReportPDF(
                    selectedDate,
                    students,
                    { date: selectedDate, records: getFinalizedRecords(), notes, updatedAt: Date.now() },
                    matchedFeeding,
                    settings
                  );
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between shadow-sm transition active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4" />
                  <span className="font-black">Combined PDF (.pdf)</span>
                </div>
                <span className="text-[10px] opacity-80 font-mono">Daily_Combined_Report_{selectedDate}.pdf</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await exportCombinedReportWord(
                    selectedDate,
                    students,
                    { date: selectedDate, records: getFinalizedRecords(), notes, updatedAt: Date.now() },
                    matchedFeeding,
                    settings
                  );
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-between shadow-sm transition active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-black">Combined Word (.docx)</span>
                </div>
                <span className="text-[10px] opacity-80 font-mono">Daily_Combined_Report_{selectedDate}.docx</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportCombinedReportExcel(
                    selectedDate,
                    students,
                    { date: selectedDate, records: getFinalizedRecords(), notes, updatedAt: Date.now() },
                    matchedFeeding,
                    settings
                  );
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-between shadow-sm transition active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="font-black">Combined Excel (.xlsx)</span>
                </div>
                <span className="text-[10px] opacity-80 font-mono">3 Worksheets</span>
              </button>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowImmediateExportModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>

              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black shadow-xs transition active:scale-95 text-center"
              >
                Done (Back to Dashboard)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Summary Confirmation Modal */}
      {showSummaryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#151F38] rounded-3xl p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#2B3A67] max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2B3A67]">
              <div>
                <h2 className="text-lg font-black text-[#172235] dark:text-[#F8FAFC]">
                  {t.attendanceSummaryTitle}
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  {formatDisplayDate(selectedDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172235] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">
                  {t.present}
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {stats.present}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block mt-0.5">
                  {stats.attendanceRate}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                  {t.permission}
                </span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
                  {stats.permission}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-500 block mt-0.5">
                  {stats.totalStudents > 0 ? Math.round((stats.permission / stats.totalStudents) * 100) : 0}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40">
                <span className="text-[11px] font-bold text-red-700 dark:text-red-300 block mb-0.5">
                  {t.studentsMarkedAbsent}
                </span>
                <span className="text-xl font-black text-red-700 dark:text-red-400 font-mono">
                  {stats.absent}
                </span>
                <span className="text-[10px] text-red-600 dark:text-red-500 block mt-0.5">
                  {stats.totalStudents > 0 ? Math.round((stats.absent / stats.totalStudents) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#F4F7FB] dark:bg-[#1D2A4D] rounded-2xl border border-[#E2E8F0] dark:border-[#2B3A67] flex items-center justify-between text-xs font-semibold text-[#172235] dark:text-[#F8FAFC]">
              <span>{t.studentsTotal}</span>
              <span className="font-mono font-bold text-sm text-[#173B65] dark:text-[#38BDF8]">{stats.totalStudents}</span>
            </div>

            {/* If modifying existing record, display warning & capture reason */}
            {existingRecord && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{t.editSavedAttendanceTitle}</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  {t.editSavedAttendanceWarning}
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase mb-1">
                    {t.editReasonLabel}
                  </label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder={t.editReasonPlaceholder}
                    className="w-full text-xs p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#2B3A67]">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalSave}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#173B65] hover:bg-[#102a4a] text-white shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-[#0D9488]" />
                <span>{t.confirmAndSaveAttendance}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {showAuditHistoryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#151F38] rounded-3xl p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#2B3A67] max-h-[85vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2B3A67]">
              <div>
                <h2 className="text-base font-black text-[#172235] dark:text-[#F8FAFC]">
                  {t.attendanceAuditLogTitle}
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  {formatDisplayDate(selectedDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditHistoryModal(false)}
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172235] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {existingRecord?.auditLog && existingRecord.auditLog.length > 0 ? (
              <div className="space-y-3">
                {existingRecord.auditLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#F4F7FB] dark:bg-[#1D2A4D] border border-[#E2E8F0] dark:border-[#2B3A67] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="font-semibold text-[#173B65] dark:text-[#38BDF8]">{log.author || 'Teacher'}</span>
                    </div>
                    <p className="font-semibold text-[#172235] dark:text-[#F8FAFC]">
                      &ldquo;{log.reason}&rdquo;
                    </p>
                    {(log.previousCounts || log.previousStats) && (log.newCounts || log.newStats) && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Before: {(log.previousCounts || log.previousStats)?.present}P • {(log.previousCounts || log.previousStats)?.absent}A • {(log.previousCounts || log.previousStats)?.permission}F</span>
                        <span>→</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">After: {(log.newCounts || log.newStats)?.present}P • {(log.newCounts || log.newStats)?.absent}A • {(log.newCounts || log.newStats)?.permission}F</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] text-center py-6">
                {t.noAuditLogs}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowAuditHistoryModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#173B65] text-white hover:bg-[#102a4a] transition"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Discard Draft Confirmation Modal */}
      <ConfirmModal
        isOpen={showDiscardDraftModal}
        title="ረቂቅ ይሰረዝ? (Discard Draft?)"
        message="እስካሁን በራስ-ሰር የተቀመጠው ያልተረጋገጠ የአቴንዳንስ ረቂቅ ይሰረዛል። እርግጠኛ ነዎት? (This will clear unsubmitted attendance markings for this date)."
        confirmLabel="አዎ፣ ሰርዝ (Yes, Discard)"
        cancelLabel="ይቆይ (Keep Draft)"
        isDestructive={true}
        onConfirm={handleDiscardDraft}
        onCancel={() => setShowDiscardDraftModal(false)}
      />
    </div>
  );
};

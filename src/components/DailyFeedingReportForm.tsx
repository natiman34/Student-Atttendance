import React, { useState, useEffect, useRef } from 'react';
import type { DailyFeedingReport, FeedingActivityRow, LessonOrGameType } from '../types.ts';
import {
  createDefaultFeedingActivities,
  validateFeedingReport,
} from '../utils/feeding.ts';
import { getTodayDateString } from '../utils/attendance.ts';
import { FeedingActivityTable } from './FeedingActivityTable.tsx';
import { EthiopianDatePicker } from './EthiopianDatePicker.tsx';
import {
  exportFeedingReportPDF,
  exportFeedingReportWord,
  exportFeedingReportExcel,
} from '../utils/reportExports.ts';
import {
  saveFeedingDraft,
  getFeedingDraft,
  getLatestFeedingDraft,
  clearFeedingDraft,
  hasFeedingDraft,
  formatLastSaved,
  type FeedingDraftPayload,
} from '../utils/draftStorage.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import {
  Save,
  RotateCcw,
  CheckCircle,
  FileDown,
  Printer,
  Sparkles,
  Utensils,
  MapPin,
  Users,
  UserCheck,
  BookOpen,
  FileText,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface DailyFeedingReportFormProps {
  initialReport?: DailyFeedingReport | null;
  students?: import('../types.ts').Student[];
  existingReports?: DailyFeedingReport[];
  onSaveReport: (report: DailyFeedingReport) => void;
  onClearEdit?: () => void;
}

export const DailyFeedingReportForm: React.FC<DailyFeedingReportFormProps> = ({
  initialReport,
  students = [],
  existingReports = [],
  onSaveReport,
  onClearEdit,
}) => {
  const { language, t } = useTranslation();
  const isAm = language === 'am';
  const [date, setDate] = useState<string>(
    initialReport?.date || getTodayDateString()
  );
  const [participatedStudentIds, setParticipatedStudentIds] = useState<Set<string>>(() => {
    return new Set(initialReport?.participatedStudentIds || []);
  });
  const [isRosterExpanded, setIsRosterExpanded] = useState<boolean>(false);
  const [coordinatorName, setCoordinatorName] = useState<string>(
    initialReport?.coordinatorName || ''
  );
  const [foodType, setFoodType] = useState<string>(
    initialReport?.foodType || ''
  );
  const [location, setLocation] = useState<string>(
    initialReport?.location || ''
  );
  const [childrenCount, setChildrenCount] = useState<string>(
    initialReport?.childrenCount !== undefined
      ? String(initialReport.childrenCount)
      : ''
  );
  const [volunteersCount, setVolunteersCount] = useState<string>(
    initialReport?.volunteersCount !== undefined
      ? String(initialReport.volunteersCount)
      : ''
  );
  const [activityType, setActivityType] = useState<LessonOrGameType>(
    initialReport?.activityType || 'lesson'
  );
  const [activities, setActivities] = useState<FeedingActivityRow[]>(() => {
    if (initialReport?.activities && initialReport.activities.length > 0) {
      return initialReport.activities;
    }
    return createDefaultFeedingActivities();
  });
  const [generalNotes, setGeneralNotes] = useState<string>(
    initialReport?.generalNotes || ''
  );

  // Auto-save & draft state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [draftRestoredTime, setDraftRestoredTime] = useState<number | null>(null);
  const [showDiscardDraftModal, setShowDiscardDraftModal] = useState<boolean>(false);
  const [otherDraftToResume, setOtherDraftToResume] = useState<{
    date: string;
    payload: FeedingDraftPayload;
  } | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedSuccessReport, setSavedSuccessReport] = useState<DailyFeedingReport | null>(null);

  // Track latest form values in a ref for synchronous flush on exit/unmount/visibilitychange
  const formStateRef = useRef({
    date,
    participatedStudentIds,
    coordinatorName,
    foodType,
    location,
    childrenCount,
    volunteersCount,
    activityType,
    activities,
    generalNotes,
  });

  useEffect(() => {
    formStateRef.current = {
      date,
      participatedStudentIds,
      coordinatorName,
      foodType,
      location,
      childrenCount,
      volunteersCount,
      activityType,
      activities,
      generalNotes,
    };
  }, [
    date,
    participatedStudentIds,
    coordinatorName,
    foodType,
    location,
    childrenCount,
    volunteersCount,
    activityType,
    activities,
    generalNotes,
  ]);

  // Synchronous flush helper that persists current state immediately
  const flushDraftNow = (): boolean => {
    const s = formStateRef.current;
    const hasAnyContent = Boolean(
      s.coordinatorName.trim() ||
      s.foodType.trim() ||
      s.location.trim() ||
      s.participatedStudentIds.size > 0 ||
      s.childrenCount.trim() ||
      s.volunteersCount.trim() ||
      s.generalNotes.trim() ||
      s.activities.some((a) => a.activityName.trim() || a.startTime || a.endTime)
    );

    if (!hasAnyContent || !s.date) {
      return false;
    }

    const res = saveFeedingDraft(s.date, {
      grade: initialReport?.grade,
      section: initialReport?.section,
      participatedStudentIds: Array.from(s.participatedStudentIds),
      coordinatorName: s.coordinatorName.trim(),
      foodType: s.foodType.trim(),
      location: s.location.trim(),
      childrenCount: s.childrenCount === '' ? 0 : parseInt(s.childrenCount, 10),
      volunteersCount: s.volunteersCount === '' ? 0 : parseInt(s.volunteersCount, 10),
      activityType: s.activityType,
      activities: s.activities,
      generalNotes: s.generalNotes.trim(),
    });

    if (res.success) {
      setAutoSaveStatus('saved');
      setLastSavedTime(res.timestamp);
      setSaveError(null);
      return true;
    } else {
      setAutoSaveStatus('error');
      setSaveError(res.error || 'Failed to persist draft to storage');
      return false;
    }
  };

  // Restore fields from a draft payload
  const applyDraftPayload = (draft: FeedingDraftPayload) => {
    if (!draft || !draft.report) return;
    const rep = draft.report;
    if (rep.participatedStudentIds && Array.from(rep.participatedStudentIds).length > 0) {
      setParticipatedStudentIds(new Set(rep.participatedStudentIds));
    }
    setCoordinatorName(rep.coordinatorName || '');
    setFoodType(rep.foodType || '');
    setLocation(rep.location || '');
    setChildrenCount(rep.childrenCount !== undefined && rep.childrenCount > 0 ? String(rep.childrenCount) : '');
    setVolunteersCount(rep.volunteersCount !== undefined && rep.volunteersCount > 0 ? String(rep.volunteersCount) : '');
    setActivityType(rep.activityType || 'lesson');
    if (rep.activities && rep.activities.length > 0) {
      setActivities(rep.activities);
    }
    setGeneralNotes(rep.generalNotes || '');
    setDraftRestoredTime(draft.updatedAt);
    setLastSavedTime(draft.updatedAt);
    setAutoSaveStatus('saved');
    setSaveError(null);
  };

  // Check and restore draft on mount or when switching date
  useEffect(() => {
    if (initialReport) return;

    if (hasFeedingDraft(date)) {
      const draft = getFeedingDraft(date);
      if (draft) {
        applyDraftPayload(draft);
        setOtherDraftToResume(null);
      }
    } else {
      // Check if there is an unfinished draft from a different date
      const latest = getLatestFeedingDraft();
      if (latest && latest.date !== date && hasFeedingDraft(latest.date)) {
        setOtherDraftToResume(latest);
      } else {
        setOtherDraftToResume(null);
      }
    }
  }, [date, initialReport]);

  // Debounced auto-save effect while editing
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const hasAnyContent = Boolean(
      coordinatorName.trim() ||
      foodType.trim() ||
      location.trim() ||
      childrenCount.trim() ||
      volunteersCount.trim() ||
      generalNotes.trim() ||
      activities.some((a) => a.activityName.trim() || a.startTime || a.endTime)
    );

    if (!hasAnyContent) {
      return;
    }

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      flushDraftNow();
    }, 350);

    return () => clearTimeout(timer);
  }, [
    date,
    coordinatorName,
    foodType,
    location,
    childrenCount,
    volunteersCount,
    activityType,
    activities,
    generalNotes,
  ]);

  // Lifecycle listeners: flush draft when switching tabs, minimizing, closing, or navigating
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushDraftNow();
      }
    };
    const handlePageHide = () => {
      flushDraftNow();
    };
    const handleBeforeUnload = () => {
      flushDraftNow();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Synchronous flush on component unmount
      flushDraftNow();
    };
  }, []);

  const handleResumeOtherDraft = () => {
    if (!otherDraftToResume) return;
    setDate(otherDraftToResume.date);
    applyDraftPayload(otherDraftToResume.payload);
    setOtherDraftToResume(null);
  };

  const handleDiscardOtherDraft = () => {
    if (!otherDraftToResume) return;
    clearFeedingDraft(otherDraftToResume.date);
    setOtherDraftToResume(null);
  };

  const handleClearForm = () => {
    if (onClearEdit) {
      onClearEdit();
    }
    setDate(getTodayDateString());
    setCoordinatorName('');
    setFoodType('');
    setLocation('');
    setChildrenCount('');
    setVolunteersCount('');
    setActivityType('lesson');
    setActivities(createDefaultFeedingActivities());
    setGeneralNotes('');
    setErrors({});
    setSavedSuccessReport(null);
  };

  const handleDiscardDraft = () => {
    clearFeedingDraft(date);
    setDraftRestoredTime(null);
    setLastSavedTime(null);
    setAutoSaveStatus('saved');
    handleClearForm();
    setShowDiscardDraftModal(false);
  };

  // Active students & roster tracking helpers
  const activeStudents = students.filter((s) => !s.isArchived);
  const rosterStudents = activeStudents;

  const duplicateWarning = existingReports.find(
    (r) => r.id !== initialReport?.id && r.date === date
  );

  const handleToggleStudent = (studentId: string) => {
    setParticipatedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSelectAllRoster = () => {
    const next = new Set(participatedStudentIds);
    rosterStudents.forEach((s) => next.add(s.id));
    setParticipatedStudentIds(next);
    setChildrenCount(String(next.size));
  };

  const handleClearRoster = () => {
    setParticipatedStudentIds(new Set());
  };

  const handleSyncCountFromRoster = () => {
    setChildrenCount(String(participatedStudentIds.size));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const candidate: Partial<DailyFeedingReport> = {
      date,
      coordinatorName: coordinatorName.trim(),
      foodType: foodType.trim(),
      location: location.trim(),
      childrenCount: childrenCount === '' ? 0 : parseInt(childrenCount, 10),
      volunteersCount: volunteersCount === '' ? 0 : parseInt(volunteersCount, 10),
      activityType,
      activities,
      generalNotes: generalNotes.trim(),
    };

    const validation = validateFeedingReport(candidate);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    const finalReport: DailyFeedingReport = {
      id: initialReport?.id || `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date,
      grade: initialReport?.grade,
      section: initialReport?.section,
      participatedStudentIds: Array.from(participatedStudentIds),
      coordinatorName: candidate.coordinatorName!,
      foodType: candidate.foodType!,
      location: candidate.location!,
      childrenCount: candidate.childrenCount!,
      volunteersCount: candidate.volunteersCount!,
      activityType: candidate.activityType!,
      activities,
      generalNotes: candidate.generalNotes,
      createdAt: initialReport?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // Clear saved draft once fully committed
    clearFeedingDraft(date);
    setDraftRestoredTime(null);

    onSaveReport(finalReport);
    setSavedSuccessReport(finalReport);
  };

  const handlePrint = () => {
    window.print();
  };

  const hasDraftForCurrentDate = hasFeedingDraft(date);

  return (
    <div className="space-y-4">
      {/* Page Title & Auto-Save Status Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold mb-1.5">
              <Sparkles className="w-3 h-3" />
              <span>{t.tabFeedingReport}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.feedingReportTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.feedingReportSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Live Auto-save indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              autoSaveStatus === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : autoSaveStatus === 'saving'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            }`}>
              {autoSaveStatus === 'saving' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[11px]">
                    በማስቀመጥ ላይ... (Saving…)
                  </span>
                </>
              ) : autoSaveStatus === 'error' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-[11px]" title={saveError || 'Storage error'}>
                    ማስቀመጥ አልተቻለም (Unable to save)
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px]">
                    {lastSavedTime
                      ? `${formatLastSaved(lastSavedTime).am} (${formatLastSaved(lastSavedTime).en})`
                      : 'ረቂቁ ተቀምጧል (Draft saved)'}
                  </span>
                </>
              )}
            </div>

            {/* Discard draft button if draft exists */}
            {hasDraftForCurrentDate && (
              <button
                type="button"
                onClick={() => setShowDiscardDraftModal(true)}
                title="Discard unsubmitted draft"
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Print Form"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Unfinished Draft on Another Date Banner */}
      {otherDraftToResume && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold text-amber-950 dark:text-amber-200">
                ያልተጠናቀቀ ረቂቅ ሪፖርት ተገኝቷል (Unfinished Draft Found)
              </span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                ቀን፡ <span className="font-mono font-bold">{otherDraftToResume.date}</span> • የተቀመጠበት፡ {formatLastSaved(otherDraftToResume.payload.updatedAt).am}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDiscardOtherDraft}
              className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 font-bold text-xs transition cursor-pointer"
            >
              አስወግድ (Discard)
            </button>
            <button
              type="button"
              onClick={handleResumeOtherDraft}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
            >
              <span>ረቂቁን ቀጥል (Resume Draft)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Restored Draft Alert Banner for current date */}
      {draftRestoredTime && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <span className="font-bold text-sky-900 dark:text-sky-200">
                ያልተጠናቀቀ ረቂቅ ተመልሷል (Restored Unsaved Draft)
              </span>
              <p className="text-[11px] text-sky-700 dark:text-sky-300">
                የተቀመጠበት ሰዓት፡ {formatLastSaved(draftRestoredTime).am} ({formatLastSaved(draftRestoredTime).en}).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDiscardDraftModal(true)}
            className="px-2.5 py-1 rounded-lg bg-sky-200 hover:bg-sky-300 dark:bg-sky-900 dark:hover:bg-sky-800 text-sky-900 dark:text-sky-100 font-bold text-[11px] shrink-0 transition cursor-pointer"
          >
            ረቂቁን ሰርዝ (Discard)
          </button>
        </div>
      )}

      {/* Success Banner with Immediate Export */}
      {savedSuccessReport && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/30 rounded-2xl p-4 shadow-sm animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                ሪፖርቱ በተሳካ ሁኔታ ተመዝግቧል! (Report Saved Successfully)
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Saved for {savedSuccessReport.date} ({savedSuccessReport.childrenCount} children fed).
                Download now:
              </p>

              {/* Immediate Export Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => exportFeedingReportPDF(savedSuccessReport)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF አውርድ</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportFeedingReportWord(savedSuccessReport)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Word (.docx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportFeedingReportExcel(savedSuccessReport)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Report Warning Banner */}
      {duplicateWarning && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-amber-950 dark:text-amber-200 text-xs sm:text-sm">
              ማስጠንቀቂያ፡ ለዚህ ቀን የተመዘገበ ሪፖርት አለ (Existing Report Found)
            </span>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              ለቀን {date} ቀደም ሲል የተመዘገበ ሪፖርት ተገኝቷል ({duplicateWarning.childrenCount} ተማሪዎች ተመግበዋል)። አዲስ ማስቀመጥዎ ተጨማሪ ግቤት ይፈጥራል ወይም ያሻሽለዋል።
            </p>
          </div>
        </div>
      )}

      {/* Main Feeding Report Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          {/* Row 1: Date & Coordinator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Report Date */}
            <div>
              <EthiopianDatePicker
                value={date}
                onChange={(newIso) => setDate(newIso)}
                label={t.reportDateLabel}
                required={true}
              />
              {errors.date && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.date}
                </p>
              )}
            </div>

            {/* Coordinator Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.coordinatorNameLabel} *</span>
              </label>
              <input
                type="text"
                placeholder={t.coordinatorPlaceholder}
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  errors.coordinatorName
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.coordinatorName && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.coordinatorName}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Food Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.foodTypeLabel} *</span>
            </label>
            <input
              type="text"
              placeholder={t.foodTypePlaceholder}
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                errors.foodType
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.foodType && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">
                {errors.foodType}
              </p>
            )}
          </div>

          {/* Row 3: Feeding Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.feedingLocationLabel} *</span>
            </label>
            <input
              type="text"
              placeholder={t.feedingLocationPlaceholder}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                errors.location
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.location && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">
                {errors.location}
              </p>
            )}
          </div>

          {/* Row 4: Children Count & Volunteers Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Children Fed */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.childrenCountLabel} *</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 85"
                value={childrenCount}
                onChange={(e) => setChildrenCount(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  errors.childrenCount
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.childrenCount && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.childrenCount}
                </p>
              )}
            </div>

            {/* Volunteers Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.volunteersCountLabel} *</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 6"
                value={volunteersCount}
                onChange={(e) => setVolunteersCount(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  errors.volunteersCount
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.volunteersCount && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {errors.volunteersCount}
                </p>
              )}
            </div>
          </div>

          {/* Individual Student Participation Roster Tracking */}
          <div className="border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/20 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  የተማሪዎች የግል ምዝገባ (Individual Student Roster)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-black">
                  {participatedStudentIds.size} / {rosterStudents.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRosterExpanded(!isRosterExpanded)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer transition"
                >
                  {isRosterExpanded ? 'ዝርዝር ደብቅ (Hide)' : 'ተማሪዎችን ምረጥ (Select Students)'}
                </button>
              </div>
            </div>

            {isRosterExpanded && (
              <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    በዚህ ክፍለ-ጊዜ የተመገቡ ተማሪዎችን ምልክት ያድርጉ (Check students who ate)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllRoster}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer transition"
                    >
                      ሁሉንም ምረጥ (All)
                    </button>
                    <button
                      type="button"
                      onClick={handleClearRoster}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-[11px] cursor-pointer transition"
                    >
                      አጽዳ (Clear)
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncCountFromRoster}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] cursor-pointer transition"
                      title="Set Children Count input to current roster count"
                    >
                      ቁጥር አመሳስል (Sync Count)
                    </button>
                  </div>
                </div>

                {rosterStudents.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    {language === 'am' ? 'ምንም ንቁ ተማሪዎች አልተገኙም' : 'No active students found in roster.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                    {rosterStudents.map((s) => {
                      const isSelected = participatedStudentIds.has(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleStudent(s.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-semibold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-bold">
                              {s.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <span>#{s.rollNumber}</span>
                              {s.studentIdNumber && <span>• ID: {s.studentIdNumber}</span>}
                              {s.grade && <span>• {s.grade}{s.section}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 5: እንቅስቃሴ አይነት (Lesson vs Game vs None) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>የዕለቱ የትምህርት ወይም የጨዋታ ምርጫ (Activity Option) *</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  activityType === 'lesson'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="activityType"
                  value="lesson"
                  checked={activityType === 'lesson'}
                  onChange={() => {
                    setActivityType('lesson');
                    setActivities((prev) =>
                      prev.map((a) =>
                        a.orderNumber === 2
                          ? { ...a, activityName: 'የተሰጠው ትምህርት' }
                          : a
                      )
                    );
                  }}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0">
                  <span className="block text-xs font-bold">1. ትምህርት (Lesson)</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                    የትምህርት ክፍለ-ጊዜ
                  </span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  activityType === 'game'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="activityType"
                  value="game"
                  checked={activityType === 'game'}
                  onChange={() => {
                    setActivityType('game');
                    setActivities((prev) =>
                      prev.map((a) =>
                        a.orderNumber === 2
                          ? { ...a, activityName: 'የተሰጠው ጨዋታ' }
                          : a
                      )
                    );
                  }}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0">
                  <span className="block text-xs font-bold">2. ጨዋታ (Game)</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                    የጨዋታ ክፍለ-ጊዜ
                  </span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  activityType === 'none'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="activityType"
                  value="none"
                  checked={activityType === 'none'}
                  onChange={() => {
                    setActivityType('none');
                    setActivities((prev) =>
                      prev.map((a) =>
                        a.orderNumber === 2
                          ? { ...a, activityName: 'ምንም (Nothing)', startTime: '', endTime: '' }
                          : a
                      )
                    );
                  }}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0">
                  <span className="block text-xs font-bold">3. ምንም (Nothing)</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                    ምንም አልተከናወነም
                  </span>
                </div>
              </label>
            </div>

            {activityType === 'none' && (
              <p className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                ℹ️ በዕለቱ ምንም አይነት ትምህርት ወይም ጨዋታ አልተካሄደም። የሰዓት ዝርዝር መሙላት አያስፈልግም።
              </p>
            )}
          </div>
        </div>

        {/* Section 4: Recreated Feeding Activity Table with Interactive Time Picker & Manual Entry */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <FeedingActivityTable
            activities={activities}
            onChange={setActivities}
            activityType={activityType}
            applicableDate={date}
            onDateChange={setDate}
          />
        </div>

        {/* Gaps and Challenges Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 leading-snug">
            {t.gapsChallengesLabel}
          </label>
          <textarea
            rows={2}
            placeholder={t.gapsChallengesPlaceholder}
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Action Buttons: Save & Clear */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleClearForm}
            className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.clearFormBtn}</span>
          </button>

          <button
            type="submit"
            className="flex-1 py-3 px-5 rounded-xl bg-[#006064] hover:bg-[#004d50] text-white font-black text-xs sm:text-sm uppercase tracking-wide shadow-xs active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-cyan-300" />
            <span>{t.saveReportBtn}</span>
          </button>
        </div>
      </form>

      {/* Discard Draft Confirmation Modal */}
      <ConfirmModal
        isOpen={showDiscardDraftModal}
        title="ረቂቅ ይሰረዝ? (Discard Draft?)"
        message="እስካሁን በራስ-ሰር የተቀመጠው ያልተረጋገጠ ረቂቅ ይሰረዛል። እርግጠኛ ነዎት? (This will clear the automatically saved draft for this date)."
        confirmLabel="አዎ፣ ሰርዝ (Yes, Discard)"
        cancelLabel="ይቆይ (Keep Draft)"
        isDestructive={true}
        onConfirm={handleDiscardDraft}
        onCancel={() => setShowDiscardDraftModal(false)}
      />
    </div>
  );
};

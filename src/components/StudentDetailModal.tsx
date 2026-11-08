import React, { useState } from 'react';
import { Student, DayAttendance, AppSettings } from '../types.ts';
import {
  calculateStudentStats,
  formatDisplayDate,
  formatRollNumber,
  formatShortDate,
} from '../utils/attendance.ts';
import { exportStudentReportPDF } from '../utils/studentExports.ts';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileText,
  FileDown,
  Archive,
  RotateCcw,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';

interface StudentDetailModalProps {
  student: Student | null;
  attendanceHistory: DayAttendance[];
  settings?: Partial<AppSettings>;
  onClose: () => void;
  onEditStudent?: (student: Student) => void;
  onArchiveStudent?: (id: string, reason?: string) => void;
  onUnarchiveStudent?: (id: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  attendanceHistory,
  settings = {},
  onClose,
  onEditStudent,
  onArchiveStudent,
  onUnarchiveStudent,
}) => {
  const { t, language } = useTranslation();
  const isAm = language === 'am';
  const [isExporting, setIsExporting] = useState(false);
  const [isArchivePromptOpen, setIsArchivePromptOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState('Transferred');

  if (!student) return null;

  const stats = calculateStudentStats(student.id, attendanceHistory);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportStudentReportPDF(student, attendanceHistory, settings);
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmArchive = () => {
    if (onArchiveStudent) {
      onArchiveStudent(student.id, archiveReason);
      setIsArchivePromptOpen(false);
      onClose();
    }
  };

  const handleConfirmRestore = () => {
    if (onUnarchiveStudent) {
      onUnarchiveStudent(student.id);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-detail-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#151F38] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#2B3A67] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#2B3A67]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#173B65] dark:text-[#38BDF8] uppercase tracking-wider">
                #{formatRollNumber(student.rollNumber)}
              </span>
              {student.studentIdNumber && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[#F4F7FB] dark:bg-[#1D2A4D] text-[#64748B] dark:text-[#94A3B8]">
                  ID: {student.studentIdNumber}
                </span>
              )}
              {student.isArchived ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {t.archivedStudents}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  {t.activeStudents}
                </span>
              )}
            </div>

            <h2
              id="student-detail-title"
              className="text-xl font-black text-[#172235] dark:text-[#F8FAFC] mt-1"
            >
              {student.name}
            </h2>

            {(student.grade || student.section) && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {student.grade && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0D9488]/10 text-[#173B65] dark:text-[#2DD4BF]">
                    {student.grade}
                  </span>
                )}
                {student.section && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-[#F59E0B]">
                    Sec {student.section}
                  </span>
                )}
              </div>
            )}
            {student.notes && (
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 italic">
                &ldquo;{student.notes}&rdquo;
              </p>
            )}
            {student.isArchived && student.archiveReason && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {t.archiveReasonLabel}: {student.archiveReason}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#172235] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 pt-4 flex-1 pr-1">
          {/* Quick PDF Export Action Button */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPDF}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#0D9488]/10 hover:bg-[#0D9488]/20 text-[#0D9488] dark:text-[#2DD4BF] flex items-center justify-center gap-2 transition cursor-pointer border border-[#0D9488]/30"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>{isAm ? 'የተማሪውን የተሟላ ሪፖርት አውርድ (PDF)' : 'Download Student Attendance Profile (PDF)'}</span>
          </button>

          {/* Attendance Rate Big Card */}
          <div className="bg-[#F4F7FB] dark:bg-[#1D2A4D] rounded-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#2B3A67]">
            <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
              {t.rate}
            </p>
            <div className="text-5xl font-black text-[#173B65] dark:text-[#38BDF8] tracking-tight">
              {stats.totalDays > 0 ? `${stats.rate}%` : 'N/A'}
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
              {isAm ? `ከ ${stats.totalDays} የተመዘገቡ ቀናት` : `Based on ${stats.totalDays} recorded days`}
            </p>
          </div>

          {/* Counts Breakdown */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-900/40">
              <span className="text-xs font-bold text-[#16A34A] dark:text-emerald-400 block mb-0.5">
                {t.present}
              </span>
              <span className="text-xl font-black text-[#16A34A] dark:text-emerald-300">
                {stats.present}
              </span>
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3 text-center border border-red-200 dark:border-red-900/40">
              <span className="text-xs font-bold text-[#DC5252] dark:text-red-400 block mb-0.5">
                {t.absent}
              </span>
              <span className="text-xl font-black text-[#DC5252] dark:text-red-300">
                {stats.absent}
              </span>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center border border-amber-200 dark:border-amber-900/40">
              <span className="text-xs font-bold text-[#F59E0B] dark:text-amber-400 block mb-0.5">
                {t.permission}
              </span>
              <span className="text-xl font-black text-[#F59E0B] dark:text-amber-300">
                {stats.permission}
              </span>
            </div>
          </div>

          {/* Archive / Restore Confirmation Box */}
          {isArchivePromptOpen && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Archive className="w-4 h-4 text-amber-600" />
                <span>{t.archiveConfirmTitle}</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                {t.archiveConfirmMsg}
              </p>
              <div>
                <label className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                  {t.archiveReasonLabel}
                </label>
                <select
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  <option value="Transferred">{isAm ? 'ወደ ሌላ ት/ቤት የተዛወረ' : 'Transferred to another school'}</option>
                  <option value="Graduated">{isAm ? 'የተመረቀ / ክፍል ያጠናቀቀ' : 'Graduated / Completed grade'}</option>
                  <option value="Withdrawn">{isAm ? 'ያቋረጠ' : 'Withdrawn / Dropped out'}</option>
                  <option value="Other">{isAm ? 'ሌላ ምክንያት' : 'Other'}</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsArchivePromptOpen(false)}
                  className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-amber-300 text-slate-700 dark:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmArchive}
                  className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {t.archiveStudent}
                </button>
              </div>
            </div>
          )}

          {/* Recent Attendance List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAm ? 'የቅርብ ጊዜ የተሰብሳቢነት ታሪክ' : 'Recent Attendance History'}</span>
            </h3>

            {stats.recentHistory.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                {isAm ? 'ለዚህ ተማሪ እስካሁን ምንም መዝገብ የለም።' : 'No attendance recorded yet for this student.'}
              </p>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
                {stats.recentHistory.slice(0, 15).map((item) => {
                  return (
                    <div
                      key={item.date}
                      className="px-4 py-2.5 flex items-center justify-between text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatShortDate(item.date)}
                        </span>
                        {item.note && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic">
                            &ldquo;{item.note}&rdquo;
                          </span>
                        )}
                      </div>

                      {item.status === 'present' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t.present}
                        </span>
                      )}

                      {item.status === 'absent' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> {t.absent}
                        </span>
                      )}

                      {item.status === 'permission' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
                          <FileText className="w-3.5 h-3.5" /> {t.permission}
                        </span>
                      )}

                      {item.status === 'late' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5" /> {t.late}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#2B3A67] flex flex-wrap gap-2">
          {student.isArchived ? (
            <button
              type="button"
              onClick={handleConfirmRestore}
              className="py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.unarchiveStudent}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsArchivePromptOpen(true)}
              className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{t.archiveStudent}</span>
            </button>
          )}

          {onEditStudent && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditStudent(student);
              }}
              className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#F4F7FB] hover:bg-[#E2E8F0] text-[#172235] dark:bg-[#1D2A4D] dark:hover:bg-[#2B3A67] dark:text-[#F8FAFC] transition text-center cursor-pointer"
            >
              {t.edit}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#173B65] hover:bg-[#102a4a] text-white transition text-center cursor-pointer shadow-xs"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};


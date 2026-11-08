import React, { useState, useMemo } from 'react';
import type { DailyFeedingReport, DayAttendance, Student, AppSettings } from '../types.ts';
import { formatDisplayDate } from '../utils/attendance.ts';
import {
  exportFeedingReportPDF,
  exportFeedingReportWord,
  exportFeedingReportExcel,
  exportDailyAttendancePDF,
  exportDailyAttendanceWord,
  exportDailyAttendanceExcel,
  exportCombinedReportPDF,
  exportCombinedReportWord,
  exportCombinedReportExcel,
} from '../utils/reportExports.ts';
import {
  Search,
  Calendar,
  Utensils,
  Users,
  Eye,
  Edit3,
  Trash2,
  FileDown,
  FileText,
  Printer,
  X,
  Clock,
  BookOpen,
  MapPin,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
} from 'lucide-react';
import { FeedingActivityTable } from './FeedingActivityTable.tsx';
import { EthiopianDatePicker } from './EthiopianDatePicker.tsx';

interface ReportHistoryProps {
  feedingReports: DailyFeedingReport[];
  attendanceHistory: DayAttendance[];
  students: Student[];
  settings: AppSettings;
  onEditFeedingReport: (report: DailyFeedingReport) => void;
  onDeleteFeedingReport: (id: string) => void;
  onNavigateToAttendance: (date: string) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  feedingReports,
  attendanceHistory,
  students,
  settings,
  onEditFeedingReport,
  onDeleteFeedingReport,
  onNavigateToAttendance,
}) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState<'feeding' | 'attendance'>('feeding');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Selected report modal for inspecting details
  const [viewingFeedingReport, setViewingFeedingReport] = useState<DailyFeedingReport | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered Feeding Reports
  const filteredFeeding = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return feedingReports.filter((r) => {
      const matchesDate = !selectedDateFilter || r.date === selectedDateFilter;
      const matchesSearch =
        !q ||
        r.coordinatorName.toLowerCase().includes(q) ||
        r.foodType.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.date.includes(q);
      return matchesDate && matchesSearch;
    });
  }, [feedingReports, searchQuery, selectedDateFilter]);

  // Filtered Attendance History
  const filteredAttendance = useMemo(() => {
    return attendanceHistory.filter((a) => {
      const matchesDate = !selectedDateFilter || a.date === selectedDateFilter;
      const matchesSearch = !searchQuery || a.date.includes(searchQuery.trim());
      return matchesDate && matchesSearch;
    });
  }, [attendanceHistory, searchQuery, selectedDateFilter]);

  const handleDelete = (id: string) => {
    onDeleteFeedingReport(id);
    setDeleteConfirmId(null);
    if (viewingFeedingReport?.id === id) {
      setViewingFeedingReport(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher: Feeding vs Attendance History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveHistoryTab('feeding')}
            className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeHistoryTab === 'feeding'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>የምገባ ሪፖርቶች ({feedingReports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHistoryTab('attendance')}
            className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeHistoryTab === 'attendance'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>አቴንዳንስ ሪፖርቶች ({attendanceHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Search text */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeHistoryTab === 'feeding'
                  ? 'Search by coordinator, food, location...'
                  : 'Search by date (YYYY-MM-DD)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Ethiopian Date Picker Filter */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <EthiopianDatePicker
                value={selectedDateFilter}
                onChange={setSelectedDateFilter}
                label="ቀን በኢትዮጵያ ካላንደር ምረጥ"
                showLabel={false}
              />
            </div>
            {selectedDateFilter && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter('')}
                className="px-2.5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 dark:bg-slate-800 rounded-xl transition whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: FEEDING REPORTS LIST */}
      {activeHistoryTab === 'feeding' && (
        <div className="space-y-3">
          {filteredFeeding.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
              <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                ምንም የምገባ ሪፖርት አልተገኘም (No feeding reports found)
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Use the Daily Feeding Report form to record your first session.
              </p>
            </div>
          ) : (
            filteredFeeding.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {formatDisplayDate(report.date)}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        ({report.date})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                        {report.childrenCount} ህፃናት (Children)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                        {report.activityType === 'lesson'
                          ? 'ትምህርት (Lesson)'
                          : report.activityType === 'game'
                          ? 'ጨዋታ (Game)'
                          : 'ምንም (Nothing)'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1.5 flex items-center gap-1.5">
                      <span>ተረኛ አስተባባሪ:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-black">
                        {report.coordinatorName}
                      </span>
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      ምግብ: <strong>{report.foodType}</strong> • ቦታ: {report.location}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      አገልጋዮች: {report.volunteersCount} • የተግባራት ብዛት: {report.activities?.length || 3}
                    </p>
                  </div>

                  {/* Top Action Icons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingFeedingReport(report)}
                      className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditFeedingReport(report)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Edit Report"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(report.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Export Action Bar */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Combined (ተሟላ):
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const matchedAtt = attendanceHistory.find((a) => a.date === report.date);
                        await exportCombinedReportPDF(report.date, students, matchedAtt, report, settings);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition"
                      title="Export Complete PDF"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const matchedAtt = attendanceHistory.find((a) => a.date === report.date);
                        await exportCombinedReportWord(report.date, students, matchedAtt, report, settings);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition"
                      title="Export Complete Word (.docx)"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Word</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const matchedAtt = attendanceHistory.find((a) => a.date === report.date);
                        exportCombinedReportExcel(report.date, students, matchedAtt, report, settings);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-900 hover:bg-black text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition"
                      title="Export Complete Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Excel</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Feeding-only:
                    </span>
                    <button
                      type="button"
                      onClick={() => exportFeedingReportPDF(report)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <FileDown className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportFeedingReportWord(report)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Word</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ATTENDANCE HISTORY LIST */}
      {activeHistoryTab === 'attendance' && (
        <div className="space-y-3">
          {filteredAttendance.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                ምንም የአቴንዳንስ መረጃ አልተገኘም (No attendance records)
              </p>
            </div>
          ) : (
            filteredAttendance.map((att) => {
              const presentCount = Object.values(att.records).filter((s) => s === 'present').length;
              const absentCount = Object.values(att.records).filter((s) => s === 'absent').length;
              const permissionCount = Object.values(att.records).filter((s) => s === 'permission').length;
              const totalCount = students.length || Object.keys(att.records).length;
              const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

              return (
                <div
                  key={att.date}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {att.date}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          ({formatDisplayDate(att.date)})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs font-bold">
                        <span className="text-emerald-600">{presentCount} Present</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-600">{absentCount} Absent</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-blue-600">{permissionCount} Permission</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-700 dark:text-slate-300">{rate}% Rate</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateToAttendance(att.date)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Immediate Export Buttons for this day */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Combined (ተሟላ):
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const matchedFeeding = feedingReports.find((f) => f.date === att.date);
                          await exportCombinedReportPDF(att.date, students, att, matchedFeeding, settings);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition"
                        title="Export Combined Attendance + Feeding PDF"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const matchedFeeding = feedingReports.find((f) => f.date === att.date);
                          await exportCombinedReportWord(att.date, students, att, matchedFeeding, settings);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition"
                        title="Export Combined Attendance + Feeding Word (.docx)"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Word</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const matchedFeeding = feedingReports.find((f) => f.date === att.date);
                          exportCombinedReportExcel(att.date, students, att, matchedFeeding, settings);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-900 hover:bg-black text-white font-black text-[11px] flex items-center gap-1 shadow-xs transition"
                        title="Export Combined Attendance + Feeding Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>Excel</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Attendance-only:
                      </span>
                      <button
                        type="button"
                        onClick={() => exportDailyAttendancePDF(att.date, students, att, settings)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition"
                      >
                        <FileDown className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => exportDailyAttendanceWord(att.date, students, att, settings)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Word</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* FEEDING REPORT DETAILS MODAL */}
      {viewingFeedingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  የዕለት ምገባ ሪፖርት ዝርዝር
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingFeedingReport.date} • {viewingFeedingReport.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingFeedingReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Grid */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">ተረኛ አስተባባሪ:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {viewingFeedingReport.coordinatorName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">የምግቡ አይነት:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {viewingFeedingReport.foodType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">የተሳተፉ ህፃናት:</span>
                <span className="font-bold text-emerald-600">
                  {viewingFeedingReport.childrenCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">የተሳተፉ አገልጋዮች:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {viewingFeedingReport.volunteersCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ትምህርት / ጨዋታ:</span>
                <span className="font-bold text-amber-600">
                  {viewingFeedingReport.activityType === 'lesson'
                    ? 'ትምህርት (Lesson)'
                    : viewingFeedingReport.activityType === 'game'
                    ? 'ጨዋታ (Game)'
                    : 'ምንም (Nothing)'}
                </span>
              </div>
              {viewingFeedingReport.generalNotes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 block font-semibold">በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች:</span>
                  <p className="text-slate-800 dark:text-slate-200 italic mt-0.5">
                    {viewingFeedingReport.generalNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Embedded Activity Table in Read-Only Mode */}
            <FeedingActivityTable
              activities={viewingFeedingReport.activities}
              onChange={() => {}}
              readOnly={true}
              activityType={viewingFeedingReport.activityType}
            />

            {/* Export & Print actions inside modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportFeedingReportPDF(viewingFeedingReport)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportFeedingReportWord(viewingFeedingReport)}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Word</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportFeedingReportExcel(viewingFeedingReport)}
                  className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
              ይህን ሪፖርት መሰረዝ ይፈልጋሉ?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                አይሰረዝ (Cancel)
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs"
              >
                ይሰረዝ (Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

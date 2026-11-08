import React, { useState, useMemo } from 'react';
import type { Student, DayAttendance, AppSettings } from '../types.ts';
import {
  groupAttendanceByWeeks,
  formatRollNumber,
  calculateStudentStats,
  formatShortDate,
} from '../utils/attendance.ts';
import {
  downloadWordReport,
  downloadPDFReport,
  downloadExcelSheet,
} from '../utils/exports.ts';
import {
  CalendarRange,
  FileDown,
  FileText,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  TrendingUp,
  Users,
} from 'lucide-react';

interface DataScreenProps {
  students: Student[];
  attendanceHistory: DayAttendance[];
  settings: AppSettings;
  onShowToast: (message: string) => void;
}

export const DataScreen: React.FC<DataScreenProps> = ({
  students,
  attendanceHistory,
  settings,
  onShowToast,
}) => {
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAtRiskOnly, setFilterAtRiskOnly] = useState(false);

  // Group attendance into weeks
  const weeks = useMemo(() => {
    return groupAttendanceByWeeks(attendanceHistory);
  }, [attendanceHistory]);

  // Selected week data
  const activeWeek = useMemo(() => {
    if (selectedWeekKey === 'all') return null;
    return weeks.find((w) => w.weekKey === selectedWeekKey) || null;
  }, [weeks, selectedWeekKey]);

  // Overall classroom stats
  const overallStats = useMemo(() => {
    let totalPresent = 0;
    let totalRecorded = 0;
    let atRiskCount = 0;

    students.forEach((s) => {
      const stats = calculateStudentStats(s.id, attendanceHistory);
      totalPresent += stats.present;
      totalRecorded += stats.totalDays;
      if (stats.totalDays > 0 && stats.rate < settings.targetAttendanceRate) {
        atRiskCount++;
      }
    });

    const averageRate = totalRecorded > 0 ? Math.round((totalPresent / totalRecorded) * 100) : 0;
    return {
      averageRate,
      atRiskCount,
      totalWeeks: weeks.length,
      totalDays: attendanceHistory.length,
    };
  }, [students, attendanceHistory, weeks, settings.targetAttendanceRate]);

  // Filter students
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const stats = calculateStudentStats(s.id, attendanceHistory);
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        formatRollNumber(s.rollNumber).includes(q) ||
        s.rollNumber.toString().includes(q);

      if (!matchesSearch) return false;

      if (filterAtRiskOnly) {
        return stats.totalDays > 0 && stats.rate < settings.targetAttendanceRate;
      }
      return true;
    });
  }, [students, attendanceHistory, searchQuery, filterAtRiskOnly, settings.targetAttendanceRate]);

  // Export handlers
  const handleExportWord = () => {
    const subtitle = activeWeek ? activeWeek.label : `All ${weeks.length} Weeks`;
    downloadWordReport(
      `Attendance-Report-${settings.className || 'Class'}`,
      settings,
      filteredStudents,
      activeWeek ? activeWeek.days : attendanceHistory,
      subtitle
    );
    onShowToast('Word report (.doc) downloaded');
  };

  const handleExportPDF = () => {
    const subtitle = activeWeek ? activeWeek.label : `All ${weeks.length} Weeks Cumulative`;
    downloadPDFReport(
      `Attendance-Report-${settings.className || 'Class'}`,
      settings,
      filteredStudents,
      activeWeek ? activeWeek.days : attendanceHistory,
      subtitle
    );
    onShowToast('PDF report (.pdf) downloaded');
  };

  const handleExportExcel = () => {
    downloadExcelSheet(
      `Attendance-${settings.className || 'Class'}`,
      filteredStudents,
      activeWeek ? activeWeek.days : attendanceHistory,
      activeWeek || undefined
    );
    onShowToast('Excel file (.xlsx) downloaded');
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Offline Weekly Data
        </h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
          All weeks' records stored securely on this device
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
            <span>Weeks</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {overallStats.totalWeeks}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {overallStats.totalDays} days recorded
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Avg Rate</span>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {overallStats.averageRate}%
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Target: {settings.targetAttendanceRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>At Risk</span>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {overallStats.atRiskCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Students &lt; {settings.targetAttendanceRate}%
          </p>
        </div>
      </div>

      {/* Export Toolbar */}
      <section className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Export Offline Reports</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            {activeWeek ? activeWeek.label : 'Full Term'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Word Download */}
          <button
            type="button"
            onClick={handleExportWord}
            disabled={students.length === 0}
            className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50 flex flex-col items-center justify-center gap-1 transition active:scale-95 disabled:opacity-40"
            title="Download Word Document"
          >
            <FileText className="w-5 h-5 text-sky-600" />
            <span className="text-xs font-bold">Word (.doc)</span>
          </button>

          {/* PDF Download */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={students.length === 0}
            className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 flex flex-col items-center justify-center gap-1 transition active:scale-95 disabled:opacity-40"
            title="Download PDF Document"
          >
            <FileDown className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-bold">PDF (.pdf)</span>
          </button>

          {/* Excel Download */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={students.length === 0}
            className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 flex flex-col items-center justify-center gap-1 transition active:scale-95 disabled:opacity-40"
            title="Download Excel Spreadsheet"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">Excel (.xlsx)</span>
          </button>
        </div>
      </section>

      {/* Week Selector Pills */}
      {weeks.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
            Filter by Week
          </label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setSelectedWeekKey('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedWeekKey === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              All Weeks ({weeks.length})
            </button>
            {weeks.map((w) => (
              <button
                key={w.weekKey}
                type="button"
                onClick={() => setSelectedWeekKey(w.weekKey)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition flex items-center gap-1 ${
                  selectedWeekKey === w.weekKey
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>{w.label}</span>
                <span className="opacity-70">({w.dates.length}d)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Risk Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterAtRiskOnly(!filterAtRiskOnly)}
          className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition ${
            filterAtRiskOnly
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
          title="Toggle students below attendance target"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>&lt; {settings.targetAttendanceRate}%</span>
        </button>
      </div>

      {/* Main Weekly Sheet / Data Table */}
      {students.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No students enrolled yet. Use Students tab or Excel Import to add students.
          </p>
        </div>
      ) : activeWeek ? (
        /* Selected Single Week Grid View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {activeWeek.label} Grid
            </h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {activeWeek.dates.length} Attendance Sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200/80 dark:border-slate-700">
                  <th className="py-2.5 px-3">Student</th>
                  {activeWeek.dates.map((d) => (
                    <th key={d} className="py-2.5 px-2 text-center whitespace-nowrap">
                      {formatShortDate(d)}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right">Week Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((s) => {
                  let present = 0;
                  let absent = 0;
                  let permission = 0;
                  let late = 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 font-bold">
                            #{formatRollNumber(s.rollNumber)}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                            {s.name}
                          </span>
                        </div>
                      </td>

                      {activeWeek.dates.map((d) => {
                        const dayRec = activeWeek.days.find((item) => item.date === d);
                        const status = dayRec?.records[s.id];
                        if (status === 'present') present++;
                        else if (status === 'absent') absent++;
                        else if (status === 'permission') permission++;
                        else if (status === 'late') late++;

                        return (
                          <td key={d} className="py-2 px-2 text-center">
                            {status === 'present' && (
                              <span className="inline-block w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] leading-5">
                                P
                              </span>
                            )}
                            {status === 'absent' && (
                              <span className="inline-block w-5 h-5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px] leading-5">
                                A
                              </span>
                            )}
                            {status === 'permission' && (
                              <span className="inline-block px-1 h-5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px] leading-5">
                                Perm
                              </span>
                            )}
                            {status === 'late' && (
                              <span className="inline-block w-5 h-5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] leading-5">
                                L
                              </span>
                            )}
                            {!status && (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2 px-3 text-right">
                        {present + absent + permission + late > 0 ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {Math.round((present / (present + absent + permission + late)) * 100)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cumulative All-Weeks Roster Table */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Student Roster ({filteredStudents.length})</span>
            <span>Attendance Rate</span>
          </div>

          {filteredStudents.map((student) => {
            const stats = calculateStudentStats(student.id, attendanceHistory);
            const isAtRisk = stats.totalDays > 0 && stats.rate < settings.targetAttendanceRate;

            return (
              <div
                key={student.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 font-mono text-slate-400 font-bold text-xs">
                    #{formatRollNumber(student.rollNumber)}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {student.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {stats.present} Present • {stats.absent} Absent • {stats.late} Late
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-black text-sm ${
                      isAtRisk
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {stats.totalDays > 0 ? `${stats.rate}%` : 'N/A'}
                  </p>
                  {isAtRisk && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md">
                      Below {settings.targetAttendanceRate}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

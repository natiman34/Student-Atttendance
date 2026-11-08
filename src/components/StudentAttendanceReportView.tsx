import React, { useState, useMemo } from 'react';
import type { Student, DayAttendance, AppSettings, AttendanceStatus } from '../types.ts';
import {
  formatDisplayDate,
  formatRollNumber,
  getTodayDateString,
  calculateDayStats,
} from '../utils/attendance.ts';
import {
  exportDailyAttendancePDF,
  exportDailyAttendanceWord,
  exportDailyAttendanceExcel,
} from '../utils/reportExports.ts';
import { EthiopianDatePicker } from './EthiopianDatePicker.tsx';
import {
  Calendar,
  Search,
  FileDown,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Edit,
} from 'lucide-react';

interface StudentAttendanceReportViewProps {
  students: Student[];
  attendanceHistory: DayAttendance[];
  settings: AppSettings;
  onNavigateToAttendance?: (date: string) => void;
}

export const StudentAttendanceReportView: React.FC<StudentAttendanceReportViewProps> = ({
  students,
  attendanceHistory,
  settings,
  onNavigateToAttendance,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [searchQuery, setSearchQuery] = useState('');

  // Find attendance record for selected date
  const dayRecord = useMemo(
    () => attendanceHistory.find((a) => a.date === selectedDate),
    [attendanceHistory, selectedDate]
  );

  const records = dayRecord?.records || {};
  const notes = dayRecord?.notes || {};
  const stats = useMemo(
    () => calculateDayStats(students, records),
    [students, records]
  );

  const isRecorded = !!dayRecord && Object.keys(records).length > 0;

  // Filter students by search
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        formatRollNumber(s.rollNumber).includes(q) ||
        s.rollNumber.toString().includes(q)
    );
  }, [students, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Date Picker */}
      <div className="bg-white dark:bg-[#1B2730] rounded-2xl p-4 border border-[#E8E0D0] dark:border-[#37474F] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#263238] dark:text-[#F5F7FA] tracking-tight">
              Student Attendance Report / የተማሪዎች አቴንዳንስ ሪፖርት
            </h2>
            <p className="text-xs text-[#607D8B] dark:text-[#B0BEC5] mt-0.5">
              {settings.className || 'General Class'} • Teacher: {settings.teacherName || 'Instructor'}
            </p>
          </div>

          {/* Ethiopian Date Picker */}
          <div className="w-full sm:w-64">
            <EthiopianDatePicker
              value={selectedDate}
              onChange={(newIso) => setSelectedDate(newIso)}
            />
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E0D0] dark:border-[#37474F]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => exportDailyAttendancePDF(selectedDate, students, dayRecord, settings)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
              title="Download PDF Attendance Report"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF አውርድ</span>
            </button>

            <button
              type="button"
              onClick={() => exportDailyAttendanceWord(selectedDate, students, dayRecord, settings)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
              title="Download Word Document"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word (.docx)</span>
            </button>

            <button
              type="button"
              onClick={() => exportDailyAttendanceExcel(selectedDate, students, dayRecord, settings)}
              className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
              title="Download Excel Sheet"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Print Attendance Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {stats.totalStudents}
          </div>
          <div className="text-[10px] font-semibold text-slate-500">ተማሪዎች</div>
        </div>

        {/* Present */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-200/70 dark:border-emerald-900/60 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Present</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
            {stats.present}
          </div>
          <div className="text-[10px] font-bold text-emerald-600">ተገኝተዋል ({stats.attendanceRate}%)</div>
        </div>

        {/* Absent */}
        <div className="bg-rose-50/60 dark:bg-rose-950/20 rounded-xl p-3 border border-rose-200/70 dark:border-rose-900/60 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Absent</span>
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-rose-700 dark:text-rose-400">
            {stats.absent}
          </div>
          <div className="text-[10px] font-bold text-rose-600">ቀሪዎች</div>
        </div>

        {/* Permission */}
        <div className="bg-blue-50/60 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-200/70 dark:border-blue-900/60 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Permission</span>
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-400">
            {stats.permission}
          </div>
          <div className="text-[10px] font-bold text-blue-600">ፈቃድ ({stats.permission})</div>
        </div>
      </div>

      {!isRecorded && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 text-center space-y-2">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
            ለ {formatDisplayDate(selectedDate)} እስካሁን አቴንዳንስ አልተወሰደም።
          </p>
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            Attendance has not been taken for this date yet.
          </p>
          {onNavigateToAttendance && (
            <button
              type="button"
              onClick={() => onNavigateToAttendance(selectedDate)}
              className="mt-1 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 mx-auto transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Take Attendance Now</span>
            </button>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name or roll number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
      </div>

      {/* Student Attendance List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Attendance Roster ({filteredStudents.length})
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            {formatDisplayDate(selectedDate)}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredStudents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No students found.
            </div>
          ) : (
            filteredStudents.map((s) => {
              const st: AttendanceStatus | 'unmarked' = (records[s.id] as AttendanceStatus | undefined) || 'unmarked';
              const note = notes[s.id];

              return (
                <div
                  key={s.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-8 text-center text-xs font-black font-mono text-slate-400">
                      {formatRollNumber(s.rollNumber)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {s.name}
                      </p>
                      {note && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic truncate">
                          ማስታወሻ: {note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {st === 'present' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                        Present
                      </span>
                    )}
                    {st === 'absent' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-black uppercase">
                        Absent
                      </span>
                    )}
                    {st === 'permission' && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase">
                        Permission
                      </span>
                    )}
                    {st === 'late' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase">
                        Late
                      </span>
                    )}
                    {st === 'unmarked' && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold">
                        Unmarked
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

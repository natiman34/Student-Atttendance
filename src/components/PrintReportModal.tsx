import React, { useRef } from 'react';
import { Student, DayAttendance } from '../types.ts';
import {
  calculateStudentStats,
  formatDisplayDate,
  formatRollNumber,
  getTodayDateString,
} from '../utils/attendance.ts';
import { X, Printer } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendanceHistory: DayAttendance[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  students,
  attendanceHistory,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = getTodayDateString();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white"
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[95vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:p-4">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Print Attendance Summary Report
            </h2>
            <p className="text-xs text-slate-500">
              Formatted for 8.5x11 / A4 printing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div
          ref={reportRef}
          className="overflow-y-auto space-y-4 pt-4 flex-1 text-slate-900 dark:text-slate-100 print:overflow-visible print:pt-0"
        >
          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-xl font-black tracking-tight">
              STUDENT ATTENDANCE REPORT
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Generated on {formatDisplayDate(todayStr)} • {students.length} Total Students • {attendanceHistory.length} Days Recorded
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 dark:border-slate-700 font-bold uppercase text-slate-600 dark:text-slate-400">
                  <th className="py-2 px-2 w-12">#</th>
                  <th className="py-2 px-2">Student Name</th>
                  <th className="py-2 px-2 text-center">Present</th>
                  <th className="py-2 px-2 text-center">Absent</th>
                  <th className="py-2 px-2 text-center">Late</th>
                  <th className="py-2 px-2 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => {
                  const stats = calculateStudentStats(student.id, attendanceHistory);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-2 font-mono text-slate-400">
                        {formatRollNumber(student.rollNumber)}
                      </td>
                      <td className="py-1.5 px-2 font-semibold">
                        {student.name}
                      </td>
                      <td className="py-1.5 px-2 text-center text-emerald-600 font-bold">
                        {stats.present}
                      </td>
                      <td className="py-1.5 px-2 text-center text-rose-600 font-bold">
                        {stats.absent}
                      </td>
                      <td className="py-1.5 px-2 text-center text-amber-600 font-bold">
                        {stats.late}
                      </td>
                      <td className="py-1.5 px-2 text-right font-black">
                        {stats.totalDays > 0 ? `${stats.rate}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Student, DayAttendance, AppSettings } from '../types.ts';
import {
  formatDisplayDate,
  formatShortDate,
  formatRollNumber,
  calculateDayStats,
  getTodayDateString,
} from '../utils/attendance.ts';
import {
  downloadMonthlyWordReport,
  downloadMonthlyPdfReport,
  downloadMonthlyExcelSheet,
} from '../utils/exports.ts';
import {
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_WEEKDAYS,
  getTodayEthiopian,
  getDaysInEthiopianMonth,
  getEthiopianDayOfWeek,
  ethiopianToIso,
  isoToEthiopian,
} from '../utils/ethiopianCalendar.ts';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  X,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Search,
  ArrowUpDown,
  Filter,
  Download,
  AlertCircle,
  Award,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface HistoryScreenProps {
  students: Student[];
  attendanceHistory: DayAttendance[];
  settings?: AppSettings;
  onEditDayAttendance: (date: string) => void;
  selectedDateInitially?: string | null;
}

type HistoryTab = 'calendar' | 'monthly' | 'trends';
type SortField = 'rollNumber' | 'name' | 'present' | 'absent' | 'permission' | 'rate';
type SortOrder = 'asc' | 'desc';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  students,
  attendanceHistory,
  settings,
  onEditDayAttendance,
  selectedDateInitially,
}) => {
  const todayStr = getTodayDateString();
  const targetRate = settings?.targetAttendanceRate || 75;

  // Active view tab: calendar, monthly summary table, or 30-day trends
  const [activeTab, setActiveTab] = useState<HistoryTab>('calendar');

  // Ethiopian Calendar month state
  const todayEth = useMemo(() => getTodayEthiopian(), []);
  const [currentEthYear, setCurrentEthYear] = useState(() => todayEth.year);
  const [currentEthMonth, setCurrentEthMonth] = useState(() => todayEth.month); // 1-13 (1 = መስከረም, 13 = ጳጉሜ)

  // Monthly summary table search and sorting
  const [studentSearch, setStudentSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('rollNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'warning' | 'perfect'>('all');

  // Currently inspected day modal state
  const [inspectDate, setInspectDate] = useState<string | null>(
    selectedDateInitially || null
  );
  const [detailFilter, setDetailFilter] = useState<'all' | 'present' | 'absent' | 'permission'>('all');

  // Map of date string -> DayAttendance
  const attendanceMap = useMemo(() => {
    const map = new Map<string, DayAttendance>();
    for (const record of attendanceHistory) {
      map.set(record.date, record);
    }
    return map;
  }, [attendanceHistory]);

  const currentMonthInfo = ETHIOPIAN_MONTHS[currentEthMonth - 1] || ETHIOPIAN_MONTHS[0];

  const handlePrevMonth = () => {
    if (currentEthMonth === 1) {
      setCurrentEthMonth(13);
      setCurrentEthYear(currentEthYear - 1);
    } else {
      setCurrentEthMonth(currentEthMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentEthMonth === 13) {
      setCurrentEthMonth(1);
      setCurrentEthYear(currentEthYear + 1);
    } else {
      setCurrentEthMonth(currentEthMonth + 1);
    }
  };

  // Calendar calculations for Calendar View (Ethiopian 13-month calendar grid)
  const calendarDays = useMemo(() => {
    const startingDayOfWeek = getEthiopianDayOfWeek(currentEthYear, currentEthMonth, 1); // 0 = Sunday
    const totalDays = getDaysInEthiopianMonth(currentEthYear, currentEthMonth);

    const days: { dayNumber: number; dateStr: string; hasAttendance: boolean; isToday: boolean }[] = [];

    // Preceding empty slots for padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ dayNumber: 0, dateStr: '', hasAttendance: false, isToday: false });
    }

    // Days of the Ethiopian month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = ethiopianToIso(currentEthYear, currentEthMonth, day);
      const hasAttendance = attendanceMap.has(dateStr);
      const isToday = dateStr === todayStr;

      days.push({
        dayNumber: day,
        dateStr,
        hasAttendance,
        isToday,
      });
    }

    return days;
  }, [currentEthYear, currentEthMonth, attendanceMap, todayStr]);

  // Attendance records for the selected Ethiopian month
  const selectedMonthRecords = useMemo(() => {
    return attendanceHistory.filter((rec) => {
      const eth = isoToEthiopian(rec.date);
      return eth.year === currentEthYear && eth.month === currentEthMonth;
    });
  }, [attendanceHistory, currentEthYear, currentEthMonth]);

  // Monthly summary stats per student
  const monthlyStudentStats = useMemo(() => {
    const totalSessions = selectedMonthRecords.length;

    return students.map((student) => {
      let present = 0;
      let absent = 0;
      let permission = 0;
      let late = 0;

      for (const day of selectedMonthRecords) {
        const st = day.records[student.id];
        if (st === 'present') present++;
        else if (st === 'absent') absent++;
        else if (st === 'permission') permission++;
        else if (st === 'late') late++;
      }

      const totalRecorded = present + absent + permission + late;
      const rate = totalRecorded > 0 ? Math.round((present / totalRecorded) * 100) : 0;
      const isWarning = totalRecorded > 0 && rate < targetRate;
      const isPerfect = totalSessions > 0 && present === totalSessions;

      return {
        student,
        present,
        absent,
        permission,
        late,
        totalRecorded,
        totalSessions,
        rate,
        isWarning,
        isPerfect,
      };
    });
  }, [students, selectedMonthRecords, targetRate]);

  // Filtered & sorted student rows for monthly table
  const filteredAndSortedMonthlyStudents = useMemo(() => {
    let result = [...monthlyStudentStats];

    // Search filter
    if (studentSearch.trim()) {
      const query = studentSearch.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.student.name.toLowerCase().includes(query) ||
          String(item.student.rollNumber).includes(query) ||
          formatRollNumber(item.student.rollNumber).includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'warning') {
      result = result.filter((item) => item.isWarning);
    } else if (statusFilter === 'perfect') {
      result = result.filter((item) => item.isPerfect);
    }

    // Sorting
    result.sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'rollNumber':
          comp = a.student.rollNumber - b.student.rollNumber;
          break;
        case 'name':
          comp = a.student.name.localeCompare(b.student.name);
          break;
        case 'present':
          comp = a.present - b.present;
          break;
        case 'absent':
          comp = a.absent - b.absent;
          break;
        case 'permission':
          comp = a.permission - b.permission;
          break;
        case 'rate':
          comp = a.rate - b.rate;
          break;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return result;
  }, [monthlyStudentStats, studentSearch, statusFilter, sortField, sortOrder]);

  // Overall monthly class rate
  const monthlyClassSummary = useMemo(() => {
    const totalSessions = selectedMonthRecords.length;
    if (totalSessions === 0 || students.length === 0) {
      return { totalSessions: 0, overallRate: 0, warningCount: 0, perfectCount: 0 };
    }

    let totalPossiblePresent = totalSessions * students.length;
    let actualPresent = 0;
    let warningCount = 0;
    let perfectCount = 0;

    for (const item of monthlyStudentStats) {
      actualPresent += item.present;
      if (item.isWarning) warningCount++;
      if (item.isPerfect) perfectCount++;
    }

    const overallRate =
      totalPossiblePresent > 0 ? Math.round((actualPresent / totalPossiblePresent) * 100) : 0;

    return {
      totalSessions,
      overallRate,
      warningCount,
      perfectCount,
    };
  }, [selectedMonthRecords, students.length, monthlyStudentStats]);

  // 30-Day Trend Data for Recharts Line Chart
  const trendData30Days = useMemo(() => {
    const today = new Date();
    const dataPoints: {
      date: string;
      formattedDate: string;
      shortDate: string;
      percentage: number;
      present: number;
      absent: number;
      late: number;
      total: number;
      hasRecord: boolean;
    }[] = [];

    // Calculate dates for past 30 days chronologically (30 days ago -> today)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const record = attendanceMap.get(dateStr);
      if (record) {
        const stats = calculateDayStats(students, record.records);
        dataPoints.push({
          date: dateStr,
          formattedDate: formatDisplayDate(dateStr),
          shortDate: formatShortDate(dateStr),
          percentage: stats.attendanceRate,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          total: students.length,
          hasRecord: true,
        });
      } else {
        // Record days with no attendance session
        dataPoints.push({
          date: dateStr,
          formattedDate: formatDisplayDate(dateStr),
          shortDate: formatShortDate(dateStr),
          percentage: 0,
          present: 0,
          absent: 0,
          late: 0,
          total: students.length,
          hasRecord: false,
        });
      }
    }

    return dataPoints;
  }, [attendanceMap, students]);

  // Filtered recorded days only for smooth trendline
  const recordedDaysOnly = useMemo(() => {
    return trendData30Days.filter((d) => d.hasRecord);
  }, [trendData30Days]);

  const [trendViewMode, setTrendViewMode] = useState<'recorded' | 'all'>('recorded');
  const activeTrendData = trendViewMode === 'recorded' ? recordedDaysOnly : trendData30Days;

  // 30-day stats
  const trend30Stats = useMemo(() => {
    if (recordedDaysOnly.length === 0) {
      return { avgRate: 0, maxRate: 0, minRate: 0, recordedCount: 0 };
    }
    const sum = recordedDaysOnly.reduce((acc, curr) => acc + curr.percentage, 0);
    const avgRate = Math.round(sum / recordedDaysOnly.length);
    const maxRate = Math.max(...recordedDaysOnly.map((d) => d.percentage));
    const minRate = Math.min(...recordedDaysOnly.map((d) => d.percentage));
    return {
      avgRate,
      maxRate,
      minRate,
      recordedCount: recordedDaysOnly.length,
    };
  }, [recordedDaysOnly]);

  // Inspect modal record
  const inspectedRecord = inspectDate ? attendanceMap.get(inspectDate) : null;
  const inspectedStats = inspectedRecord
    ? calculateDayStats(students, inspectedRecord.records)
    : null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'name' || field === 'rollNumber' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#263238] dark:text-[#F5F7FA] tracking-tight">
          Attendance History
        </h1>
        <p className="text-xs font-semibold text-[#607D8B] dark:text-[#B0BEC5] mt-0.5">
          Review past records, 30-day attendance trends, & monthly student summaries
        </p>
      </div>

      {/* Navigation View Segmented Controls */}
      <div className="bg-white dark:bg-[#1B2730] border border-[#E8E0D0] dark:border-[#37474F] p-1.5 rounded-2xl flex gap-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'bg-[#006064] text-white shadow-sm'
              : 'text-[#607D8B] dark:text-[#B0BEC5] hover:text-[#263238] dark:hover:text-[#F5F7FA] hover:bg-[#FFF8E7] dark:hover:bg-[#24343D]'
          }`}
        >
          <CalendarIcon className={`w-4 h-4 ${activeTab === 'calendar' ? 'text-[#00BCD4]' : ''}`} />
          <span>Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'monthly'
              ? 'bg-[#006064] text-white shadow-sm'
              : 'text-[#607D8B] dark:text-[#B0BEC5] hover:text-[#263238] dark:hover:text-[#F5F7FA] hover:bg-[#FFF8E7] dark:hover:bg-[#24343D]'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'monthly' ? 'text-[#00BCD4]' : ''}`} />
          <span>Monthly Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trends')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'trends'
              ? 'bg-[#006064] text-white shadow-sm'
              : 'text-[#607D8B] dark:text-[#B0BEC5] hover:text-[#263238] dark:hover:text-[#F5F7FA] hover:bg-[#FFF8E7] dark:hover:bg-[#24343D]'
          }`}
        >
          <TrendingUp className={`w-4 h-4 ${activeTab === 'trends' ? 'text-[#00BCD4]' : ''}`} />
          <span>30-Day Trends</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. MONTHLY SUMMARY TABLE VIEW                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'monthly' && (
        <section aria-label="Monthly Student Summary" className="space-y-5">
          {/* Month Selector Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Selected Period
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {currentMonthInfo.amharicName} ({currentMonthInfo.englishName}) {currentEthYear} ዓ.ም
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const nowEth = getTodayEthiopian();
                  setCurrentEthMonth(nowEth.month);
                  setCurrentEthYear(nowEth.year);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Current Month
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Sessions
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {monthlyClassSummary.totalSessions}
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                Days recorded
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Average Rate
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {monthlyClassSummary.overallRate}%
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                Class overall
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                100% Attendance
              </span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {monthlyClassSummary.perfectCount}
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                Perfect record
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Needs Attention
              </span>
              <span className={`text-2xl font-black ${monthlyClassSummary.warningCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {monthlyClassSummary.warningCount}
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                Under {targetRate}%
              </span>
            </div>
          </div>

          {/* Search, Filter, and Export Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student by name or roll number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  All ({monthlyStudentStats.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('warning')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === 'warning'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  &lt;{targetRate}% ({monthlyClassSummary.warningCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('perfect')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === 'perfect'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  100% ({monthlyClassSummary.perfectCount})
                </button>
              </div>
            </div>

            {/* Export options row */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">
                Showing {filteredAndSortedMonthlyStudents.length} students
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadMonthlyExcelSheet(
                      `${currentMonthInfo.amharicName} (${currentMonthInfo.englishName})`,
                      currentEthYear,
                      students,
                      selectedMonthRecords
                    )
                  }
                  disabled={selectedMonthRecords.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition flex items-center gap-1.5 disabled:opacity-50"
                  title="Download monthly summary as Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadMonthlyWordReport(
                      `${currentMonthInfo.amharicName} (${currentMonthInfo.englishName})`,
                      currentEthYear,
                      students,
                      selectedMonthRecords,
                      targetRate
                    )
                  }
                  disabled={selectedMonthRecords.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center gap-1.5 disabled:opacity-50"
                  title="Download monthly summary as Word"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Word</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadMonthlyPdfReport(
                      `${currentMonthInfo.amharicName} (${currentMonthInfo.englishName})`,
                      currentEthYear,
                      students,
                      selectedMonthRecords,
                      targetRate
                    )
                  }
                  disabled={selectedMonthRecords.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 transition flex items-center gap-1.5 disabled:opacity-50"
                  title="Download monthly summary as PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Student Summary Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            {selectedMonthRecords.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No records in {currentMonthInfo.amharicName} {currentEthYear} ዓ.ም
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Take attendance for dates in this month to view the student monthly summary table.
                </p>
              </div>
            ) : filteredAndSortedMonthlyStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No students match your search filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold select-none">
                      <th
                        onClick={() => handleSort('rollNumber')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      >
                        <div className="flex items-center gap-1">
                          <span>Roll #</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('name')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      >
                        <div className="flex items-center gap-1">
                          <span>Student Name</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('present')}
                        className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Present</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('absent')}
                        className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Absent</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('permission')}
                        className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Permission</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('rate')}
                        className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Rate %</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAndSortedMonthlyStudents.map((item) => (
                      <tr
                        key={item.student.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                          item.isWarning ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">
                          {formatRollNumber(item.student.rollNumber)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {item.student.name}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {item.present}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                          {item.absent}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                          {item.permission}
                        </td>
                        <td className="py-3 px-4 text-right font-black">
                          <span
                            className={
                              item.isWarning
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {item.totalRecorded > 0 ? `${item.rate}%` : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.isPerfect ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                              <Award className="w-3 h-3" /> Perfect
                            </span>
                          ) : item.isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                              <AlertCircle className="w-3 h-3" /> Low
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. 30-DAY TRENDS VIEW (RECHARTS LINE CHART)                   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'trends' && (
        <section aria-label="30-Day Attendance Trends" className="space-y-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                30-Day Average
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {trend30Stats.avgRate}%
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                Attendance rate
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Recorded Sessions
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {trend30Stats.recordedCount}
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                Past 30 days
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Peak Day Rate
              </span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {trend30Stats.maxRate}%
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                Highest session
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Lowest Day Rate
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {trend30Stats.minRate}%
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                Lowest session
              </span>
            </div>
          </div>

          {/* Line Chart Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Daily Attendance Percentage (Last 30 Days)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visual daily attendance rates plotted over the last 30 calendar days
                </p>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTrendViewMode('recorded')}
                  className={`px-3 py-1 rounded-lg transition ${
                    trendViewMode === 'recorded'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Recorded Days ({recordedDaysOnly.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTrendViewMode('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    trendViewMode === 'all'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All 30 Days
                </button>
              </div>
            </div>

            {/* Recharts Line Chart Container */}
            {activeTrendData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No attendance records in the last 30 days
                </p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Once you take attendance for any date within the past 30 days, the daily percentage trend chart will appear here.
                </p>
              </div>
            ) : (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activeTrendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    <XAxis
                      dataKey="shortDate"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      dy={8}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          if (!data.hasRecord) {
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs">
                                <p className="font-bold text-slate-300">{data.formattedDate}</p>
                                <p className="text-xs text-slate-400 mt-1 italic">
                                  No attendance taken
                                </p>
                              </div>
                            );
                          }
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
                              <p className="font-bold text-emerald-400">{data.formattedDate}</p>
                              <p className="text-sm font-black">
                                Attendance Rate:{' '}
                                <span className="text-emerald-400">{data.percentage}%</span>
                              </p>
                              <div className="flex gap-2 pt-1 border-t border-slate-800 text-[11px] font-semibold">
                                <span className="text-emerald-400">{data.present} Present</span>
                                <span className="text-rose-400">{data.absent} Absent</span>
                                <span className="text-amber-400">{data.late} Late</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={targetRate}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{
                        value: `Target ${targetRate}%`,
                        position: 'insideTopRight',
                        fill: '#10b981',
                        fontSize: 10,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: '#059669',
                        strokeWidth: 2,
                        stroke: '#ffffff',
                      }}
                      activeDot={{
                        r: 6,
                        fill: '#047857',
                        strokeWidth: 2,
                        stroke: '#ffffff',
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Legend & Guide */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs font-semibold text-slate-500 gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-600 rounded-full" />
                  <span>Daily Attendance %</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-emerald-500" />
                  <span>Target Benchmark ({targetRate}%)</span>
                </span>
              </div>
              <span className="text-slate-400 text-[11px]">
                Hover or tap on points to view student breakdown
              </span>
            </div>
          </div>

          {/* Quick list of past 30 days sessions */}
          {recordedDaysOnly.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Daily Breakdown (Last 30 Days)
              </h3>
              <div className="space-y-2">
                {recordedDaysOnly.slice(0, 10).map((d) => (
                  <div
                    key={d.date}
                    onClick={() => setInspectDate(d.date)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition text-xs"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">
                      {d.formattedDate}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-600 font-semibold">{d.present} P</span>
                      <span className="text-rose-600 font-semibold">{d.absent} A</span>
                      <span className="text-amber-600 font-semibold">{d.late} L</span>
                      <span className="font-black text-slate-900 dark:text-white min-w-12 text-right">
                        {d.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CALENDAR & DAILY RECORDS VIEW                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'calendar' && (
        <>
          {/* Monthly Calendar Card */}
          <section
            aria-label="Attendance Calendar"
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-800"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentMonthInfo.amharicName} {currentEthYear} ዓ.ም
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Days of week header in Ethiopian Amharic */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {ETHIOPIAN_WEEKDAYS.map((w) => (
                <div
                  key={w.dayIndex}
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 py-1"
                  title={w.english}
                >
                  {w.short}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((item, index) => {
                if (!item.dayNumber) {
                  return <div key={`empty-${index}`} className="h-9" />;
                }

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setInspectDate(item.dateStr)}
                    className={`h-9 rounded-xl text-xs font-bold flex flex-col items-center justify-center relative transition active:scale-90 ${
                      item.hasAttendance
                        ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                        : 'bg-slate-50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    } ${item.isToday ? 'ring-2 ring-emerald-500' : ''}`}
                    aria-label={`View attendance for ${item.dateStr}`}
                  >
                    <span>{item.dayNumber}</span>
                    {item.hasAttendance && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 -mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend & Month Table Shortcut */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 gap-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                  <span>No Record</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('monthly')}
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>View {currentMonthInfo.amharicName} Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

          {/* Mini 30-Day Line Chart Preview */}
          {recordedDaysOnly.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    30-Day Attendance Rate: {trend30Stats.avgRate}%
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('trends')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Full Chart</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={recordedDaysOnly}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                    <XAxis dataKey="shortDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white px-2 py-1.5 rounded-lg text-[11px] shadow">
                              <span className="font-bold text-emerald-400">{data.shortDate}: </span>
                              <span>{data.percentage}%</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="percentage" stroke="#059669" strokeWidth={2.5} dot={{ r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chronological List of Past Attendance */}
          <section aria-label="Daily Attendance Records" className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-1">
              Daily Records
            </h2>

            {attendanceHistory.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No attendance recorded yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {attendanceHistory.map((day) => {
                  const dayStats = calculateDayStats(students, day.records);

                  return (
                    <div
                      key={day.date}
                      onClick={() => setInspectDate(day.date)}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer active:scale-99"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setInspectDate(day.date);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {formatDisplayDate(day.date)}
                        </h3>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {dayStats.attendanceRate}% Rate
                        </span>
                      </div>

                      {/* Present, Absent, Permission Counts */}
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {dayStats.present} Present
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          {dayStats.absent} Absent
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {dayStats.permission} Permission
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Date Detail Modal */}
      {inspectDate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Attendance Details
                </p>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {formatDisplayDate(inspectDate)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectDate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If record exists */}
            {inspectedRecord && inspectedStats ? (
              <div className="overflow-y-auto space-y-4 pt-4 flex-1 pr-1">
                {/* Stats Breakdown */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-2.5 text-center">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                      Present
                    </span>
                    <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                      {inspectedStats.present}
                    </span>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-2.5 text-center">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block">
                      Absent
                    </span>
                    <span className="text-xl font-black text-rose-800 dark:text-rose-300">
                      {inspectedStats.absent}
                    </span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2.5 text-center">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 block">
                      Permission
                    </span>
                    <span className="text-xl font-black text-blue-800 dark:text-blue-300">
                      {inspectedStats.permission}
                    </span>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1.5 text-xs font-bold">
                  {(['all', 'present', 'absent', 'permission'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDetailFilter(tab)}
                      className={`px-3 py-1.5 rounded-full capitalize transition ${
                        detailFilter === tab
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Students breakdown */}
                <div className="space-y-1.5">
                  {students
                    .filter((s) => {
                      if (detailFilter === 'all') return true;
                      return inspectedRecord.records[s.id] === detailFilter;
                    })
                    .map((s) => {
                      const st = inspectedRecord.records[s.id];
                      return (
                        <div
                          key={s.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 font-bold">
                              {formatRollNumber(s.rollNumber)}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {s.name}
                              </span>
                              {inspectedRecord.notes?.[s.id] && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic">
                                  Note: &ldquo;{inspectedRecord.notes[s.id]}&rdquo;
                                </span>
                              )}
                            </div>
                          </div>

                          {st === 'present' && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Present
                            </span>
                          )}
                          {st === 'absent' && (
                            <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Absent
                            </span>
                          )}
                          {st === 'permission' && (
                            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> Permission
                            </span>
                          )}
                          {st === 'late' && (
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Late (Historical)
                            </span>
                          )}
                          {!st && (
                            <span className="text-slate-400 italic">Unrecorded</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-slate-500">
                  No attendance record exists for this date.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetDate = inspectDate;
                  setInspectDate(null);
                  onEditDayAttendance(targetDate);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>
                  {inspectedRecord ? 'Edit Attendance' : 'Take Attendance for Date'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

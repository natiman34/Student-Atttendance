import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRollNumber,
  calculateDayStats,
  calculateStudentStats,
  exportAttendanceToCSV,
  exportStudentsToCSV,
  parseStudentsFromCSV,
  validateBackupData,
  groupAttendanceByWeeks,
  getISOWeekNumber,
} from './attendance.ts';
import type { Student, DayAttendance } from '../types.ts';

test('formatRollNumber formats 1, 12, 120 with zero padding', () => {
  assert.equal(formatRollNumber(1), '001');
  assert.equal(formatRollNumber(9), '009');
  assert.equal(formatRollNumber(10), '010');
  assert.equal(formatRollNumber(99), '099');
  assert.equal(formatRollNumber(120), '120');
});

test('calculateDayStats computes correct counts and attendance rate with Permission and Late', () => {
  const students: Student[] = [
    { id: 's1', rollNumber: 1, name: 'Abebe Kebede' },
    { id: 's2', rollNumber: 2, name: 'Hana Tesfaye' },
    { id: 's3', rollNumber: 3, name: 'Dawit Alemu' },
    { id: 's4', rollNumber: 4, name: 'Meron Bekele' },
    { id: 's5', rollNumber: 5, name: 'Tigist Tadesse' },
  ];

  const records = {
    s1: 'present' as const,
    s2: 'present' as const,
    s3: 'absent' as const,
    s4: 'permission' as const,
    s5: 'late' as const,
  };

  const stats = calculateDayStats(students, records);
  assert.equal(stats.totalStudents, 5);
  assert.equal(stats.present, 2);
  assert.equal(stats.absent, 1);
  assert.equal(stats.permission, 1);
  assert.equal(stats.late, 1);
  assert.equal(stats.unrecorded, 0);
  assert.equal(stats.attendanceRate, 40); // 2/5 = 40%
});

test('calculateStudentStats aggregates student history across multiple days including permission', () => {
  const history: DayAttendance[] = [
    {
      date: '2026-08-19',
      records: { s1: 'present', s2: 'absent' },
      updatedAt: 1,
    },
    {
      date: '2026-08-18',
      records: { s1: 'permission', s2: 'late' },
      updatedAt: 2,
    },
    {
      date: '2026-08-17',
      records: { s1: 'absent', s2: 'present' },
      updatedAt: 3,
    },
    {
      date: '2026-08-16',
      records: { s1: 'present', s2: 'present' },
      updatedAt: 4,
    },
  ];

  const s1Stats = calculateStudentStats('s1', history);
  assert.equal(s1Stats.totalDays, 4);
  assert.equal(s1Stats.present, 2);
  assert.equal(s1Stats.absent, 1);
  assert.equal(s1Stats.permission, 1);
  assert.equal(s1Stats.late, 0);
  assert.equal(s1Stats.rate, 50); // 2/4 = 50%
  assert.equal(s1Stats.recentHistory.length, 4);

  const s2Stats = calculateStudentStats('s2', history);
  assert.equal(s2Stats.totalDays, 4);
  assert.equal(s2Stats.present, 2);
  assert.equal(s2Stats.absent, 1);
  assert.equal(s2Stats.permission, 0);
  assert.equal(s2Stats.late, 1); // historical late safely preserved
  assert.equal(s2Stats.rate, 50);
});

test('exportAttendanceToCSV produces valid Excel-compatible CSV text', () => {
  const students: Student[] = [
    { id: 's1', rollNumber: 1, name: 'Abebe Kebede' },
    { id: 's2', rollNumber: 2, name: 'Hana, Tesfaye' }, // name with comma
  ];
  const history: DayAttendance[] = [
    {
      date: '2026-08-19',
      records: { s1: 'present', s2: 'absent' },
      updatedAt: 1,
    },
  ];

  const csv = exportAttendanceToCSV(students, history);
  assert.match(csv, /Date,Student Number,Student Name,Status/);
  assert.match(csv, /2026-08-19,1,Abebe Kebede,Present/);
  assert.match(csv, /2026-08-19,2,"Hana, Tesfaye",Absent/);
});

test('parseStudentsFromCSV parses headers, commas, and quotes properly', () => {
  const csv = `Student Number,Name\n1,Abebe Kebede\n2,"Hana, Tesfaye"\nDawit Alemu`;
  const parsed = parseStudentsFromCSV(csv);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].rollNumber, 1);
  assert.equal(parsed[0].name, 'Abebe Kebede');
  assert.equal(parsed[1].rollNumber, 2);
  assert.equal(parsed[1].name, 'Hana, Tesfaye');
  assert.equal(parsed[2].name, 'Dawit Alemu');
});

test('validateBackupData detects corrupted vs valid payloads', () => {
  assert.equal(validateBackupData(null), null);
  assert.equal(validateBackupData({}), null);
  assert.equal(validateBackupData('invalid string'), null);

  const valid = {
    version: 1,
    students: [{ id: 's1', rollNumber: 1, name: 'Abebe' }],
    attendance: [{ date: '2026-08-19', records: { s1: 'present' }, updatedAt: 12345 }],
  };
  const sanitized = validateBackupData(valid);
  assert.notEqual(sanitized, null);
  assert.equal(sanitized?.students.length, 1);
  assert.equal(sanitized?.attendance.length, 1);
});

test('groupAttendanceByWeeks correctly clusters attendance records into weekly buckets', () => {
  const history: DayAttendance[] = [
    { date: '2026-10-12', records: { s1: 'present' }, updatedAt: 1 },
    { date: '2026-10-13', records: { s1: 'present' }, updatedAt: 2 },
    { date: '2026-10-05', records: { s1: 'absent' }, updatedAt: 3 },
  ];

  const weeks = groupAttendanceByWeeks(history);
  assert.equal(weeks.length, 2);
  // Newest week first
  assert.equal(weeks[0].dates.length, 2);
  assert.equal(weeks[1].dates.length, 1);
});

test('getISOWeekNumber correctly calculates ISO week', () => {
  const d = new Date(2026, 9, 16); // Oct 16, 2026
  const weekInfo = getISOWeekNumber(d);
  assert.equal(weekInfo.year, 2026);
  assert.ok(weekInfo.week >= 40 && weekInfo.week <= 43);
});

test('calculateDayStats calculates 100% and 50% correctly', () => {
  const students: Student[] = [
    { id: 's1', rollNumber: 1, name: 'Alice' },
    { id: 's2', rollNumber: 2, name: 'Bob' },
  ];
  const stats1 = calculateDayStats(students, { s1: 'present', s2: 'present' });
  assert.equal(stats1.attendanceRate, 100);
  assert.equal(stats1.present, 2);
  assert.equal(stats1.absent, 0);

  const stats2 = calculateDayStats(students, { s1: 'present', s2: 'absent' });
  assert.equal(stats2.attendanceRate, 50);
  assert.equal(stats2.present, 1);
  assert.equal(stats2.absent, 1);
});

test('calculateStudentStats attaches note to recentHistory records', () => {
  const history: DayAttendance[] = [
    {
      date: '2026-10-18',
      records: { s1: 'absent' },
      notes: { s1: 'sick' },
      updatedAt: 1,
    },
    {
      date: '2026-10-17',
      records: { s1: 'late' },
      notes: { s1: 'left early' },
      updatedAt: 2,
    },
  ];

  const stats = calculateStudentStats('s1', history);
  assert.equal(stats.totalDays, 2);
  assert.equal(stats.recentHistory[0].note, 'sick');
  assert.equal(stats.recentHistory[1].note, 'left early');
});

test('calculateDayStats with treatBlankAsAbsent: true automatically converts blank entries into absent', () => {
  const students: Student[] = [
    { id: 's1', rollNumber: 1, name: 'Student 1' },
    { id: 's2', rollNumber: 2, name: 'Student 2' },
    { id: 's3', rollNumber: 3, name: 'Student 3' },
    { id: 's4', rollNumber: 4, name: 'Student 4' },
    { id: 's5', rollNumber: 5, name: 'Student 5' },
  ];

  // User only marked Present and Permission, leaving s3, s4, s5 blank
  const draftRecords = {
    s1: 'present' as const,
    s2: 'permission' as const,
  };

  // While filling: unrecorded = 3, absent = 0
  const fillingStats = calculateDayStats(students, draftRecords);
  assert.equal(fillingStats.present, 1);
  assert.equal(fillingStats.permission, 1);
  assert.equal(fillingStats.absent, 0);
  assert.equal(fillingStats.unrecorded, 3);

  // When finalized/exported with treatBlankAsAbsent: true:
  const finalizedStats = calculateDayStats(students, draftRecords, { treatBlankAsAbsent: true });
  assert.equal(finalizedStats.present, 1);
  assert.equal(finalizedStats.permission, 1);
  assert.equal(finalizedStats.absent, 3);
  assert.equal(finalizedStats.unrecorded, 0);
  // Total strictly equals Present + Permission + Absent
  assert.equal(
    finalizedStats.totalStudents,
    finalizedStats.present + finalizedStats.permission + finalizedStats.absent
  );
  assert.equal(finalizedStats.attendanceRate, 20); // 1/5 = 20%
});

test('Attendance toggle and undo logic: click selects, second click unselects to blank, other switches', () => {
  let records: Record<string, string | undefined> = {};

  const toggle = (id: string, target: 'present' | 'permission') => {
    if (records[id] === target) {
      delete records[id]; // Toggle off to blank
    } else {
      records[id] = target; // Set or switch
    }
  };

  // 1. First click: Select Present
  toggle('s1', 'present');
  assert.equal(records['s1'], 'present');

  // 2. Second click on same button: Unselect back to blank
  toggle('s1', 'present');
  assert.equal(records['s1'], undefined);

  // 3. First click: Select Permission
  toggle('s1', 'permission');
  assert.equal(records['s1'], 'permission');

  // 4. Second click on same button: Unselect back to blank
  toggle('s1', 'permission');
  assert.equal(records['s1'], undefined);

  // 5. Switch from Present to Permission
  toggle('s1', 'present');
  assert.equal(records['s1'], 'present');
  toggle('s1', 'permission');
  assert.equal(records['s1'], 'permission');

  // 6. Switch from Permission to Present
  toggle('s1', 'present');
  assert.equal(records['s1'], 'present');
});


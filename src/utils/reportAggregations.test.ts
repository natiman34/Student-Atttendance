import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateReportBeforeExport,
  calculateWeeklySummary,
  calculateMonthlySummary,
} from './reportAggregations.ts';
import type { Student, DayAttendance, DailyFeedingReport } from '../types.ts';

const SAMPLE_STUDENTS: Student[] = [
  { id: 's1', rollNumber: 1, name: 'Abebe Kebede' },
  { id: 's2', rollNumber: 2, name: 'Sara Bekele' },
  { id: 's3', rollNumber: 3, name: 'Dawit Yohannes' },
];

test('validateReportBeforeExport rejects when no students registered', () => {
  const result = validateReportBeforeExport({
    students: [],
    attendance: undefined,
    feeding: undefined,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errorType, 'no_students');
  assert.equal(result.messageAm, 'እባክዎ መጀመሪያ ተማሪዎችን ይመዝግቡ።');
  assert.match(result.messageEn || '', /Please register students first/i);
});

test('validateReportBeforeExport rejects when students exist but report data empty', () => {
  const result = validateReportBeforeExport({
    students: SAMPLE_STUDENTS,
    attendance: undefined,
    feeding: undefined,
    checkType: 'combined',
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errorType, 'no_report_data');
  assert.equal(result.messageAm, 'ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።');
  assert.match(result.messageEn || '', /The report has not been completed/i);
});

test('validateReportBeforeExport detects partial feeding report missing coordinator or food type', () => {
  const partialFeeding: DailyFeedingReport = {
    id: 'f1',
    date: '2026-10-26',
    coordinatorName: '', // Missing
    foodType: '', // Missing
    foodQuantityKg: 0,
    location: '',
    childrenCount: 0,
    volunteersCount: 0,
    activityType: 'none',
    activities: [],
    createdAt: Date.now(),
  };

  const result = validateReportBeforeExport({
    students: SAMPLE_STUDENTS,
    feeding: partialFeeding,
    checkType: 'feeding',
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errorType, 'partial_fields');
  assert.ok(result.missingFields && result.missingFields.length > 0);
});

test('validateReportBeforeExport approves complete valid report', () => {
  const validAttendance: DayAttendance = {
    date: '2026-10-26',
    records: { s1: 'present', s2: 'absent', s3: 'permission' },
    updatedAt: Date.now(),
  };

  const validFeeding: DailyFeedingReport = {
    id: 'f1',
    date: '2026-10-26',
    coordinatorName: 'Almaz',
    foodType: 'Bread',
    foodQuantityKg: 20,
    location: 'Hall',
    childrenCount: 50,
    volunteersCount: 5,
    activityType: 'none',
    activities: [],
    createdAt: Date.now(),
  };

  const result = validateReportBeforeExport({
    students: SAMPLE_STUDENTS,
    attendance: validAttendance,
    feeding: validFeeding,
    checkType: 'combined',
  });

  assert.equal(result.isValid, true);
});

test('calculateWeeklySummary aggregates counts accurately', () => {
  const att: DayAttendance[] = [
    {
      date: '2026-10-20',
      records: { s1: 'present', s2: 'present', s3: 'permission' },
      updatedAt: 1,
    },
    {
      date: '2026-10-21',
      records: { s1: 'absent', s2: 'present', s3: 'present' },
      updatedAt: 1,
    },
  ];

  const feeding: DailyFeedingReport[] = [
    {
      id: 'f1',
      date: '2026-10-20',
      coordinatorName: 'Almaz',
      foodType: 'Rice',
      foodQuantityKg: 15,
      location: 'Hall',
      childrenCount: 30,
      volunteersCount: 3,
      activityType: 'lesson',
      activities: [],
      generalNotes: 'No issues today',
      createdAt: 1,
    },
  ];

  const summary = calculateWeeklySummary(
    '2026-10-19',
    '2026-10-25',
    SAMPLE_STUDENTS,
    att,
    feeding
  );

  assert.equal(summary.totalStudents, 3);
  assert.equal(summary.totalDays, 2);
  assert.equal(summary.totalPresent, 4); // 2 on Oct 20 + 2 on Oct 21
  assert.equal(summary.totalAbsent, 1);
  assert.equal(summary.totalPermission, 1);
  assert.equal(summary.feedingSummary.totalChildrenFed, 30);
  assert.equal(summary.feedingSummary.lessonCount, 1);
  assert.equal(summary.feedingSummary.gameCount, 0);
  assert.equal(summary.gapsAndChallenges.length, 1);
  assert.equal(summary.gapsAndChallenges[0].coordinator, 'Almaz');
});

test('calculateMonthlySummary computes Ethiopian month metrics including all 13 months', () => {
  // Tikimt (month 2) of year 2019 Eth: from 2026-10-12 to 2026-11-10
  const att: DayAttendance[] = [
    {
      date: '2026-10-20',
      records: { s1: 'present', s2: 'present', s3: 'present' },
      updatedAt: 1,
    },
  ];

  const summary = calculateMonthlySummary(
    2019,
    2, // Tikimt
    SAMPLE_STUDENTS,
    att,
    []
  );

  assert.equal(summary.ethMonthName, 'ጥቅምት');
  assert.equal(summary.totalPresent, 3);
  assert.equal(summary.attendanceRate, 100);
});

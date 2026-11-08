import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultFeedingActivities,
  validateFeedingReport,
  calculateFeedingSummaryStats,
} from './feeding.ts';
import type { DailyFeedingReport } from '../types.ts';

test('createDefaultFeedingActivities generates 4 default rows with blank times including መዝሙር', () => {
  const rows = createDefaultFeedingActivities();
  assert.equal(rows.length, 4);

  assert.equal(rows[0].orderNumber, 1);
  assert.equal(rows[0].activityName, 'አጠቃላይ አገልግሎቱ');
  assert.equal(rows[0].startTime, '');
  assert.equal(rows[0].endTime, '');

  assert.equal(rows[1].orderNumber, 2);
  assert.equal(rows[1].activityName, 'የተሰጠው ትምህርት / ጨዋታ');
  assert.equal(rows[1].startTime, '');
  assert.equal(rows[1].endTime, '');

  assert.equal(rows[2].orderNumber, 3);
  assert.equal(rows[2].activityName, 'ምገባ');
  assert.equal(rows[2].startTime, '');
  assert.equal(rows[2].endTime, '');

  assert.equal(rows[3].orderNumber, 4);
  assert.equal(rows[3].activityName, 'መዝሙር');
  assert.equal(rows[3].startTime, '');
  assert.equal(rows[3].endTime, '');
});

test('validateFeedingReport rejects empty required fields and negative numbers', () => {
  const invalid = validateFeedingReport({
    coordinatorName: '',
    foodType: '',
    foodQuantityKg: -5,
    childrenCount: -1,
    volunteersCount: -2,
    location: '',
  });

  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.coordinatorName);
  assert.ok(invalid.errors.foodType);
  assert.ok(invalid.errors.childrenCount);
  assert.ok(invalid.errors.volunteersCount);
  assert.ok(invalid.errors.location);
});

test('validateFeedingReport passes valid report', () => {
  const valid = validateFeedingReport({
    date: '2026-10-23',
    coordinatorName: 'Kassahun Bekele',
    foodType: 'እንጀራ በሽሮ እና ድንች (Injera with Shiro)',
    foodQuantityKg: 45,
    location: 'ዋናው ማዕከል አዳራሽ (Main Center Hall)',
    childrenCount: 120,
    volunteersCount: 8,
    activityType: 'lesson',
  });

  assert.equal(valid.isValid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

test('calculateFeedingSummaryStats aggregates reports correctly', () => {
  const reports: DailyFeedingReport[] = [
    {
      id: 'rep_1',
      date: '2026-10-20',
      coordinatorName: 'Abebe',
      foodType: 'ዳቦ እና ሻይ',
      foodQuantityKg: 20,
      location: 'አዳራሽ A',
      childrenCount: 50,
      volunteersCount: 4,
      activityType: 'lesson',
      activities: createDefaultFeedingActivities(),
      createdAt: 1,
    },
    {
      id: 'rep_2',
      date: '2026-10-21',
      coordinatorName: 'Almaz',
      foodType: 'እንጀራ በወጥ',
      foodQuantityKg: 30,
      location: 'አዳራሽ B',
      childrenCount: 70,
      volunteersCount: 6,
      activityType: 'game',
      activities: createDefaultFeedingActivities(),
      createdAt: 2,
    },
    {
      id: 'rep_3',
      date: '2026-10-22',
      coordinatorName: 'Dawit',
      foodType: 'ሩዝ በድንች',
      foodQuantityKg: 25,
      location: 'አዳራሽ C',
      childrenCount: 60,
      volunteersCount: 5,
      activityType: 'none',
      activities: createDefaultFeedingActivities(),
      createdAt: 3,
    },
  ];

  const stats = calculateFeedingSummaryStats(reports);
  assert.equal(stats.totalReports, 3);
  assert.equal(stats.totalChildrenFed, 180);
  assert.equal(stats.totalFoodKg, 75);
  assert.equal(stats.totalVolunteers, 15);
  assert.equal(stats.totalLessons, 1);
  assert.equal(stats.totalGames, 1);
  assert.equal(stats.totalNone, 1);
  assert.equal(stats.avgChildrenPerDay, 60);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  addMinutesToTime,
  calculateActivityDuration,
  validateManualTimeInput,
} from './timeUtils.ts';

test('parseTimeToMinutes correctly parses 24h and 12h strings', () => {
  assert.equal(parseTimeToMinutes('09:30'), 570);
  assert.equal(parseTimeToMinutes('14:15'), 855);
  assert.equal(parseTimeToMinutes('00:00'), 0);
  assert.equal(parseTimeToMinutes('23:59'), 1439);

  // 12h AM/PM
  assert.equal(parseTimeToMinutes('9:30 am'), 570);
  assert.equal(parseTimeToMinutes('1:15 pm'), 795);
  assert.equal(parseTimeToMinutes('12:00 pm'), 720);
  assert.equal(parseTimeToMinutes('12:00 am'), 0);

  // Invalid formats
  assert.equal(parseTimeToMinutes(''), null);
  assert.equal(parseTimeToMinutes('abc'), null);
  assert.equal(parseTimeToMinutes('25:00'), null);
  assert.equal(parseTimeToMinutes('12:65'), null);
});

test('formatMinutesToTime formats minutes into HH:MM', () => {
  assert.equal(formatMinutesToTime(570), '09:30');
  assert.equal(formatMinutesToTime(855), '14:15');
  assert.equal(formatMinutesToTime(0), '00:00');
});

test('addMinutesToTime calculates shifted time correctly', () => {
  assert.equal(addMinutesToTime('09:00', 45), '09:45');
  assert.equal(addMinutesToTime('09:30', 90), '11:00');
  assert.equal(addMinutesToTime('11:45', 30), '12:15');
});

test('calculateActivityDuration computes exact duration and bilingual labels', () => {
  // 45 minutes
  const r1 = calculateActivityDuration('09:00', '09:45');
  assert.equal(r1.isValid, true);
  assert.equal(r1.durationMinutes, 45);
  assert.equal(r1.formattedAm, '45 ደቂቃ');
  assert.equal(r1.formattedEn, '45 min');

  // 1 hour 30 minutes
  const r2 = calculateActivityDuration('09:30', '11:00');
  assert.equal(r2.isValid, true);
  assert.equal(r2.durationMinutes, 90);
  assert.equal(r2.formattedAm, '1 ሰዓት 30 ደቂቃ');
  assert.equal(r2.formattedEn, '1h 30m');

  // 2 hours exactly
  const r3 = calculateActivityDuration('10:00', '12:00');
  assert.equal(r3.isValid, true);
  assert.equal(r3.durationMinutes, 120);
  assert.equal(r3.formattedAm, '2 ሰዓት');
  assert.equal(r3.formattedEn, '2h');
});

test('calculateActivityDuration flags invalid time order when end is before start', () => {
  const r = calculateActivityDuration('10:30', '09:15');
  assert.equal(r.isValid, false);
  assert.equal(r.warning?.am, 'የማብቂያ ሰዓት ከመጀመሪያ ሰዓት ቀድሟል');
  assert.equal(r.warning?.en, 'End time is earlier than start time');
});

test('calculateActivityDuration supports legitimate overnight sessions', () => {
  const r = calculateActivityDuration('23:00', '01:30');
  assert.equal(r.isValid, true);
  assert.equal(r.crossesMidnight, true);
  assert.equal(r.durationMinutes, 150); // 2h 30m
});

test('validateManualTimeInput validates positive bounds and formats 24h string', () => {
  // Valid hours and minutes
  const v1 = validateManualTimeInput(9, 5);
  assert.equal(v1.isValid, true);
  assert.equal(v1.timeString, '09:05');
  assert.equal(v1.hours, 9);
  assert.equal(v1.minutes, 5);

  const v2 = validateManualTimeInput('14', '30');
  assert.equal(v2.isValid, true);
  assert.equal(v2.timeString, '14:30');

  // Out of range hours (>23)
  const v3 = validateManualTimeInput(25, 0);
  assert.equal(v3.isValid, false);
  assert.ok(v3.error?.en.includes('Hours must be an integer between 0 and 23'));

  // Out of range minutes (>59)
  const v4 = validateManualTimeInput(10, 65);
  assert.equal(v4.isValid, false);
  assert.ok(v4.error?.en.includes('Minutes must be an integer between 0 and 59'));

  // Negative hours
  const v5 = validateManualTimeInput(-2, 30);
  assert.equal(v5.isValid, false);

  // Negative minutes
  const v6 = validateManualTimeInput(10, -5);
  assert.equal(v6.isValid, false);

  // Empty values
  const v7 = validateManualTimeInput('', '');
  assert.equal(v7.isValid, true);
  assert.equal(v7.timeString, '');
});

test('updating activity time preserves orderNumber and does not duplicate row', () => {
  const activities = [
    { id: 'act_1', orderNumber: 1, activityName: 'እጅ መታጠብ', startTime: '09:00', endTime: '09:15' },
    { id: 'act_2', orderNumber: 2, activityName: 'ምግብ ማደል', startTime: '09:15', endTime: '09:30' },
  ];

  const updatedAct1 = { ...activities[0], startTime: '08:45', endTime: '09:10' };
  const updatedList = activities.map((a) => (a.id === updatedAct1.id ? updatedAct1 : a));

  assert.equal(updatedList.length, 2);
  assert.equal(updatedList[0].startTime, '08:45');
  assert.equal(updatedList[0].endTime, '09:10');
  assert.equal(updatedList[0].orderNumber, 1);
  assert.equal(updatedList[1].id, 'act_2');
});

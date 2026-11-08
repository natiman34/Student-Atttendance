import test from 'node:test';
import assert from 'node:assert/strict';
import {
  saveAttendanceDraft,
  getAttendanceDraft,
  clearAttendanceDraft,
  hasAttendanceDraft,
  saveFeedingDraft,
  getFeedingDraft,
  clearFeedingDraft,
  hasFeedingDraft,
  formatLastSaved,
  saveStudentAddDraft,
  getStudentAddDraft,
  clearStudentAddDraft,
  hasStudentAddDraft,
  saveStudentEditDraft,
  getStudentEditDraft,
  clearStudentEditDraft,
  getLatestFeedingDraft,
  setMockStorageFailure,
} from './draftStorage.ts';

test('Attendance draft saving, retrieval, and clearing', () => {
  const date = '2026-10-28';
  assert.equal(hasAttendanceDraft(date), false);

  saveAttendanceDraft(date, { s1: 'present', s2: 'absent' }, { s2: 'Sick' });
  assert.equal(hasAttendanceDraft(date), true);

  const draft = getAttendanceDraft(date);
  assert.ok(draft);
  assert.equal(draft.records.s1, 'present');
  assert.equal(draft.records.s2, 'absent');
  assert.equal(draft.notes?.s2, 'Sick');
  assert.ok(draft.updatedAt > 0);

  clearAttendanceDraft(date);
  assert.equal(hasAttendanceDraft(date), false);
  assert.equal(getAttendanceDraft(date), null);
});

test('Feeding draft saving, retrieval, and clearing', () => {
  const date = '2026-10-28';
  assert.equal(hasFeedingDraft(date), false);

  saveFeedingDraft(date, {
    coordinatorName: 'Alemayehu',
    foodType: 'Rice',
    foodQuantityKg: 40,
  });

  assert.equal(hasFeedingDraft(date), true);
  const draft = getFeedingDraft(date);
  assert.ok(draft);
  assert.equal(draft.report.coordinatorName, 'Alemayehu');
  assert.equal(draft.report.foodType, 'Rice');
  assert.equal(draft.report.foodQuantityKg, 40);

  clearFeedingDraft(date);
  assert.equal(hasFeedingDraft(date), false);
});

test('formatLastSaved returns readable strings', () => {
  const ts = Date.now();
  const res = formatLastSaved(ts);
  assert.ok(res.am.includes('ረቂቁ ተቀምጧል'));
  assert.ok(res.en.includes('Draft saved'));
});

test('Student Add and Edit draft saving, retrieval, and clearing', () => {
  // Test Add Draft
  clearStudentAddDraft();
  assert.equal(hasStudentAddDraft(), false);
  assert.equal(getStudentAddDraft(), null);

  const addSaved = saveStudentAddDraft({
    name: 'Tigist Haile',
    rollNumber: 15,
    gender: 'F',
    grade: 'Grade 4',
    section: 'B',
    notes: 'Transferred student',
  });
  assert.equal(addSaved, true);
  assert.equal(hasStudentAddDraft(), true);

  const addDraft = getStudentAddDraft();
  assert.ok(addDraft);
  assert.equal(addDraft.name, 'Tigist Haile');
  assert.equal(addDraft.rollNumber, 15);
  assert.equal(addDraft.gender, 'F');
  assert.equal(addDraft.grade, 'Grade 4');
  assert.equal(addDraft.section, 'B');
  assert.equal(addDraft.notes, 'Transferred student');
  assert.equal(addDraft.editingStudentId, null);
  assert.ok(addDraft.updatedAt > 0);

  clearStudentAddDraft();
  assert.equal(hasStudentAddDraft(), false);
  assert.equal(getStudentAddDraft(), null);

  // Test Edit Draft
  const studentId = 'student_test_123';
  clearStudentEditDraft(studentId);
  assert.equal(getStudentEditDraft(studentId), null);

  const editSaved = saveStudentEditDraft(studentId, {
    name: 'Tigist Haile Updated',
    rollNumber: 15,
    grade: 'Grade 5',
    section: 'A',
  });
  assert.equal(editSaved, true);

  const editDraft = getStudentEditDraft(studentId);
  assert.ok(editDraft);
  assert.equal(editDraft.name, 'Tigist Haile Updated');
  assert.equal(editDraft.rollNumber, 15);
  assert.equal(editDraft.grade, 'Grade 5');
  assert.equal(editDraft.editingStudentId, studentId);

  clearStudentEditDraft(studentId);
  assert.equal(getStudentEditDraft(studentId), null);
});

test('Feeding draft detects changes when ONLY activity manual time is entered', () => {
  const date = '2026-10-31';
  clearFeedingDraft(date);
  assert.equal(hasFeedingDraft(date), false);

  // User only entered time into the activity schedule
  const res = saveFeedingDraft(date, {
    activities: [
      {
        id: 'act_1',
        orderNumber: 1,
        activityName: 'አጠቃላይ አገልግሎቱ',
        startTime: '08:30',
        endTime: '09:15',
      },
    ],
  });

  assert.equal(res.success, true);
  assert.equal(hasFeedingDraft(date), true);

  const restored = getFeedingDraft(date);
  assert.ok(restored);
  assert.ok(restored.report.activities);
  assert.equal(restored.report.activities[0].startTime, '08:30');
  assert.equal(restored.report.activities[0].endTime, '09:15');

  clearFeedingDraft(date);
  assert.equal(hasFeedingDraft(date), false);
});

test('getLatestFeedingDraft finds the most recent unfinished draft across dates', () => {
  const date1 = '2026-10-25';
  const date2 = '2026-10-29';
  clearFeedingDraft(date1);
  clearFeedingDraft(date2);

  saveFeedingDraft(date1, { coordinatorName: 'First Coordinator' });
  // Add a slight delay for timestamp ordering
  saveFeedingDraft(date2, { coordinatorName: 'Latest Coordinator' });

  const latest = getLatestFeedingDraft();
  assert.ok(latest);
  assert.equal(latest.date, date2);
  assert.equal(latest.payload.report.coordinatorName, 'Latest Coordinator');

  clearFeedingDraft(date1);
  clearFeedingDraft(date2);
});

test('Simulated storage failure honestly returns success: false and error without false positive', () => {
  const date = '2026-10-30';
  setMockStorageFailure(true);

  const feedingRes = saveFeedingDraft(date, { coordinatorName: 'Test Name' });
  assert.equal(feedingRes.success, false);
  assert.ok(feedingRes.error);

  const attRes = saveAttendanceDraft(date, { s1: 'present' });
  assert.equal(attRes.success, false);
  assert.ok(attRes.error);

  // Restore normal operation
  setMockStorageFailure(false);
  const okRes = saveFeedingDraft(date, { coordinatorName: 'Test Name' });
  assert.equal(okRes.success, true);
  clearFeedingDraft(date);
});

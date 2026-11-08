import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// Set up mock in-memory localStorage for Node test runner
const memoryStore = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => memoryStore.get(k) || null,
  setItem: (k: string, v: string) => memoryStore.set(k, String(v)),
  removeItem: (k: string) => memoryStore.delete(k),
  clear: () => memoryStore.clear(),
};

import {
  getActiveStudents,
  getArchivedStudents,
  archiveStudent,
  unarchiveStudent,
  saveStudents,
  saveDayAttendance,
  loadAttendance,
  createBackupPayload,
  parseAndRestoreBackup,
  loadBackupHistory,
} from './storage.ts';
import type { Student, DayAttendance, AttendanceAuditEntry } from '../types.ts';

describe('Comprehensive System Upgrade Tests', () => {
  it('Student archiving and restoring logic', () => {
    const testStudents: Student[] = [
      { id: 's1', rollNumber: 1, name: 'Abebe Bikila', studentIdNumber: 'ID-001' },
      { id: 's2', rollNumber: 2, name: 'Derartu Tulu', studentIdNumber: 'ID-002' },
      { id: 's3', rollNumber: 3, name: 'Kenenisa Bekele', studentIdNumber: 'ID-003', isArchived: true, archiveReason: 'Transferred' },
    ];
    saveStudents(testStudents);

    const active = getActiveStudents();
    const archived = getArchivedStudents();

    assert.equal(active.length, 2);
    assert.equal(active.some((s) => s.id === 's3'), false);
    assert.equal(archived.length, 1);
    assert.equal(archived[0].id, 's3');
    assert.equal(archived[0].archiveReason, 'Transferred');

    // Archive student s1
    const afterArchive = archiveStudent('s1', 'Graduated');
    assert.equal(afterArchive.find((s) => s.id === 's1')?.isArchived, true);
    assert.equal(afterArchive.find((s) => s.id === 's1')?.archiveReason, 'Graduated');

    // Unarchive student s3
    const afterUnarchive = unarchiveStudent('s3');
    assert.equal(afterUnarchive.find((s) => s.id === 's3')?.isArchived, false);
    assert.equal(afterUnarchive.find((s) => s.id === 's3')?.archiveReason, undefined);
  });

  it('Attendance audit trail logging and persistence', () => {
    const testDate = '2025-02-15';
    const auditEntry: AttendanceAuditEntry = {
      timestamp: Date.now(),
      teacherName: 'Teacher Helen',
      reason: 'Late medical note submitted',
      previousStats: { present: 20, permission: 2, absent: 3 },
      newStats: { present: 21, permission: 2, absent: 2 },
    };

    const dayRecord: DayAttendance = {
      date: testDate,
      records: { s1: 'present', s2: 'permission' },
      auditLog: [auditEntry],
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
    };

    saveDayAttendance(dayRecord);
    const history = loadAttendance();
    const saved = history.find((a) => a.date === testDate);

    assert.ok(saved);
    assert.equal(saved?.auditLog?.length, 1);
    assert.equal(saved?.auditLog?.[0].reason, 'Late medical note submitted');
    assert.equal(saved?.auditLog?.[0].teacherName, 'Teacher Helen');
  });

  it('Backup payload creation, history logging, and validation', () => {
    const testStudents: Student[] = [
      { id: 'b1', rollNumber: 1, name: 'Almaz Ayana', studentIdNumber: 'ETH-100' },
    ];
    const testAttendance: DayAttendance[] = [
      { date: '2025-03-01', records: { b1: 'present' }, updatedAt: Date.now() },
    ];

    const payload = createBackupPayload(testStudents, testAttendance, []);
    assert.equal(payload.version, 4);
    assert.equal(payload.students.length, 1);
    assert.equal(payload.attendance.length, 1);

    // Verify backup history was appended
    const history = loadBackupHistory();
    assert.ok(history.length > 0);
    assert.equal(history[0]?.recordCount?.students, 1);

    // Test restoring
    const jsonStr = JSON.stringify(payload);
    const restoreResult = parseAndRestoreBackup(jsonStr);
    assert.equal(restoreResult.success, true);
    assert.ok(restoreResult.data);
    assert.equal(restoreResult.data?.students.length, 1);
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { Student } from '../types.ts';
import {
  saveStudentAddDraft,
  getStudentAddDraft,
  clearStudentAddDraft,
  hasStudentAddDraft,
  saveStudentEditDraft,
  getStudentEditDraft,
  clearStudentEditDraft,
} from './draftStorage.ts';

test('Student selection logic: select one, multiple, and select all toggle', () => {
  const students: Student[] = [
    { id: 's1', rollNumber: 1, name: 'Abebe' },
    { id: 's2', rollNumber: 2, name: 'Biruk' },
    { id: 's3', rollNumber: 3, name: 'Chala' },
  ];

  const selected = new Set<string>();

  // 1. Select one
  selected.add('s1');
  assert.equal(selected.size, 1);
  assert.equal(selected.has('s1'), true);

  // 2. Select another
  selected.add('s2');
  assert.equal(selected.size, 2);

  // 3. Deselect one
  selected.delete('s1');
  assert.equal(selected.size, 1);
  assert.equal(selected.has('s1'), false);
  assert.equal(selected.has('s2'), true);

  // 4. Select all
  students.forEach((s) => selected.add(s.id));
  assert.equal(selected.size, 3);
  const isAllSelected = students.every((s) => selected.has(s.id));
  assert.equal(isAllSelected, true);

  // 5. Deselect all
  selected.clear();
  assert.equal(selected.size, 0);
});

test('Bulk delete filters out selected students and preserves non-selected', () => {
  const students: Student[] = [
    { id: 's1', rollNumber: 1, name: 'Abebe' },
    { id: 's2', rollNumber: 2, name: 'Biruk' },
    { id: 's3', rollNumber: 3, name: 'Chala' },
    { id: 's4', rollNumber: 4, name: 'Dawit' },
  ];

  const toDelete = new Set(['s1', 's3']);
  const remaining = students.filter((s) => !toDelete.has(s.id));

  assert.equal(remaining.length, 2);
  assert.equal(remaining[0].id, 's2');
  assert.equal(remaining[1].id, 's4');
});

test('Delete All removes all students cleanly', () => {
  const students: Student[] = [
    { id: 's1', rollNumber: 1, name: 'Abebe' },
    { id: 's2', rollNumber: 2, name: 'Biruk' },
  ];

  const remaining = students.filter(() => false);
  assert.equal(remaining.length, 0);
});

test('Student Drafts: Auto-save, restore, and clear upon finalization', () => {
  clearStudentAddDraft();
  assert.equal(hasStudentAddDraft(), false);

  // User begins typing new student
  saveStudentAddDraft({
    name: 'Marta Tesfaye',
    rollNumber: 12,
    gender: 'F',
    grade: 'Grade 3',
    section: 'C',
    notes: 'Needs front row seating',
  });

  assert.equal(hasStudentAddDraft(), true);
  const draft = getStudentAddDraft();
  assert.ok(draft);
  assert.equal(draft.name, 'Marta Tesfaye');
  assert.equal(draft.rollNumber, 12);
  assert.equal(draft.notes, 'Needs front row seating');

  // When finalized, draft is cleared and added to student list
  const newStudent: Student = {
    id: 'student_marta_123',
    rollNumber: draft.rollNumber,
    name: draft.name,
    gender: draft.gender,
    grade: draft.grade,
    section: draft.section,
    notes: draft.notes,
  };
  clearStudentAddDraft();

  assert.equal(hasStudentAddDraft(), false);
  assert.equal(newStudent.name, 'Marta Tesfaye');
});

test('Student Edit Draft: Auto-save and restore for specific student', () => {
  const studentId = 's_existing_999';
  clearStudentEditDraft(studentId);

  saveStudentEditDraft(studentId, {
    name: 'Dawit Alemu (Updated)',
    rollNumber: 99,
    grade: 'Grade 6',
  });

  const editDraft = getStudentEditDraft(studentId);
  assert.ok(editDraft);
  assert.equal(editDraft.name, 'Dawit Alemu (Updated)');
  assert.equal(editDraft.editingStudentId, studentId);

  // Clear when finalized
  clearStudentEditDraft(studentId);
  assert.equal(getStudentEditDraft(studentId), null);
});

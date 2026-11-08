/**
 * Draft storage utility for automatic saving of partially completed
 * attendance sessions and daily feeding reports.
 */
import type { AttendanceStatus, DailyFeedingReport, StudentDraftPayload } from '../types.ts';

const DRAFT_KEY_ATTENDANCE = 'rollcall_draft_attendance_v1';
const DRAFT_KEY_FEEDING = 'rollcall_draft_feeding_v1';
const DRAFT_KEY_STUDENT_ADD = 'rollcall_draft_student_add_v1';
const DRAFT_KEY_STUDENT_EDIT = 'rollcall_draft_student_edit_v1';

export interface AttendanceDraftPayload {
  date: string;
  records: Record<string, AttendanceStatus>;
  notes?: Record<string, string>;
  updatedAt: number;
}

export interface FeedingDraftPayload {
  date: string;
  report: Partial<DailyFeedingReport>;
  updatedAt: number;
}

export interface StorageResult {
  success: boolean;
  error?: string;
  timestamp: number;
}

// In-memory fallback if localStorage is unavailable
const memoryDrafts: Record<string, string> = {};

let mockStorageFailure = false;

/**
 * Allows simulating storage failures for automated testing of honest status indicators.
 */
export function setMockStorageFailure(fail: boolean): void {
  mockStorageFailure = fail;
}

export function isMockStorageFailure(): boolean {
  return mockStorageFailure;
}

function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('localStorage getItem failed:', e);
  }
  return memoryDrafts[key] || null;
}

function safeSet(key: string, value: string): boolean {
  if (mockStorageFailure) {
    console.warn('Simulated storage failure active');
    return false;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      memoryDrafts[key] = value;
      return true;
    }
  } catch (e) {
    console.warn('localStorage setItem failed (quota or disabled):', e);
    // Still store in memory for volatile fallback, but return false to report honest failure
    memoryDrafts[key] = value;
    return false;
  }
  memoryDrafts[key] = value;
  return true;
}

function safeRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('localStorage removeItem failed:', e);
  }
  delete memoryDrafts[key];
}

let lastDraftTimestamp = 0;
function getMonotonicTimestamp(): number {
  const now = Date.now();
  lastDraftTimestamp = now > lastDraftTimestamp ? now : lastDraftTimestamp + 1;
  return lastDraftTimestamp;
}

// ----------------- ATTENDANCE DRAFTS -----------------

export function saveAttendanceDraft(
  date: string,
  records: Record<string, AttendanceStatus>,
  notes?: Record<string, string>
): StorageResult {
  const timestamp = getMonotonicTimestamp();
  if (!date) {
    return { success: false, error: 'No date provided', timestamp };
  }
  try {
    const raw = safeGet(DRAFT_KEY_ATTENDANCE);
    const store: Record<string, AttendanceDraftPayload> = raw ? JSON.parse(raw) : {};
    store[date] = {
      date,
      records: { ...records },
      notes: notes ? { ...notes } : undefined,
      updatedAt: timestamp,
    };
    const saved = safeSet(DRAFT_KEY_ATTENDANCE, JSON.stringify(store));
    if (!saved) {
      return { success: false, error: 'Storage quota exceeded or storage disabled', timestamp };
    }
    return { success: true, timestamp };
  } catch (err) {
    console.error('Failed to save attendance draft:', err);
    return { success: false, error: String(err), timestamp };
  }
}

export function getAttendanceDraft(date: string): AttendanceDraftPayload | null {
  if (!date) return null;
  try {
    const raw = safeGet(DRAFT_KEY_ATTENDANCE);
    if (!raw) return null;
    const store: Record<string, AttendanceDraftPayload> = JSON.parse(raw);
    return store[date] || null;
  } catch (err) {
    console.error('Failed to get attendance draft:', err);
    return null;
  }
}

export function getLatestAttendanceDraft(): { date: string; payload: AttendanceDraftPayload } | null {
  try {
    const raw = safeGet(DRAFT_KEY_ATTENDANCE);
    if (!raw) return null;
    const store: Record<string, AttendanceDraftPayload> = JSON.parse(raw);
    const entries = Object.entries(store);
    if (entries.length === 0) return null;

    let latestEntry: { date: string; payload: AttendanceDraftPayload } | null = null;
    for (const [dateKey, payload] of entries) {
      if (payload && payload.records && Object.keys(payload.records).length > 0) {
        if (!latestEntry || payload.updatedAt >= latestEntry.payload.updatedAt) {
          latestEntry = { date: dateKey, payload };
        }
      }
    }
    return latestEntry;
  } catch {
    return null;
  }
}

export function clearAttendanceDraft(date: string): void {
  if (!date) return;
  try {
    const raw = safeGet(DRAFT_KEY_ATTENDANCE);
    if (!raw) return;
    const store: Record<string, AttendanceDraftPayload> = JSON.parse(raw);
    delete store[date];
    safeSet(DRAFT_KEY_ATTENDANCE, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to clear attendance draft:', err);
  }
}

export function hasAttendanceDraft(date: string): boolean {
  const d = getAttendanceDraft(date);
  if (!d) return false;
  const hasRecords = d.records && Object.keys(d.records).length > 0;
  const hasNotes = d.notes && Object.values(d.notes).some((n) => n && n.trim().length > 0);
  return Boolean(hasRecords || hasNotes);
}

// ----------------- FEEDING DRAFTS -----------------

export function saveFeedingDraft(
  date: string,
  report: Partial<DailyFeedingReport>
): StorageResult {
  const timestamp = getMonotonicTimestamp();
  if (!date) {
    return { success: false, error: 'No date provided', timestamp };
  }
  try {
    const raw = safeGet(DRAFT_KEY_FEEDING);
    const store: Record<string, FeedingDraftPayload> = raw ? JSON.parse(raw) : {};
    store[date] = {
      date,
      report: { ...report },
      updatedAt: timestamp,
    };
    const saved = safeSet(DRAFT_KEY_FEEDING, JSON.stringify(store));
    if (!saved) {
      return {
        success: false,
        error: 'Storage quota exceeded or storage disabled',
        timestamp,
      };
    }
    return { success: true, timestamp };
  } catch (err) {
    console.error('Failed to save feeding draft:', err);
    return { success: false, error: String(err), timestamp };
  }
}

export function getFeedingDraft(date: string): FeedingDraftPayload | null {
  if (!date) return null;
  try {
    const raw = safeGet(DRAFT_KEY_FEEDING);
    if (!raw) return null;
    const store: Record<string, FeedingDraftPayload> = JSON.parse(raw);
    return store[date] || null;
  } catch (err) {
    console.error('Failed to get feeding draft:', err);
    return null;
  }
}

export function getAllFeedingDrafts(): Record<string, FeedingDraftPayload> {
  try {
    const raw = safeGet(DRAFT_KEY_FEEDING);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Retrieves the most recent unfinished feeding draft across all dates.
 */
export function getLatestFeedingDraft(): { date: string; payload: FeedingDraftPayload } | null {
  try {
    const drafts = getAllFeedingDrafts();
    const entries = Object.entries(drafts);
    if (entries.length === 0) return null;

    let latest: { date: string; payload: FeedingDraftPayload } | null = null;
    for (const [dateKey, payload] of entries) {
      if (hasFeedingDraft(dateKey)) {
        if (!latest || payload.updatedAt >= latest.payload.updatedAt) {
          latest = { date: dateKey, payload };
        }
      }
    }
    return latest;
  } catch {
    return null;
  }
}

export function clearFeedingDraft(date: string): void {
  if (!date) return;
  try {
    const raw = safeGet(DRAFT_KEY_FEEDING);
    if (!raw) return;
    const store: Record<string, FeedingDraftPayload> = JSON.parse(raw);
    delete store[date];
    safeSet(DRAFT_KEY_FEEDING, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to clear feeding draft:', err);
  }
}

export function clearAllFeedingDrafts(): void {
  safeRemove(DRAFT_KEY_FEEDING);
}

/**
 * Checks whether a feeding draft has any meaningful content entered.
 * Inspects all textual fields, numeric fields, and activity schedules (names, start time, end time).
 */
export function hasFeedingDraft(date: string): boolean {
  const d = getFeedingDraft(date);
  if (!d || !d.report) return false;
  const rep = d.report;

  const hasActivityContent =
    Array.isArray(rep.activities) &&
    rep.activities.some(
      (a) =>
        (a.activityName && a.activityName.trim().length > 0) ||
        (a.startTime && a.startTime.trim().length > 0) ||
        (a.endTime && a.endTime.trim().length > 0)
    );

  return Boolean(
    (rep.coordinatorName && rep.coordinatorName.trim().length > 0) ||
    (rep.foodType && rep.foodType.trim().length > 0) ||
    (rep.location && rep.location.trim().length > 0) ||
    (rep.generalNotes && rep.generalNotes.trim().length > 0) ||
    (rep.foodQuantityKg !== undefined && rep.foodQuantityKg > 0) ||
    (rep.childrenCount !== undefined && rep.childrenCount > 0) ||
    (rep.volunteersCount !== undefined && rep.volunteersCount > 0) ||
    (rep.activityType && rep.activityType !== 'lesson') ||
    hasActivityContent
  );
}

/**
 * Formats a timestamp into a human-friendly last-saved time indicator.
 */
export function formatLastSaved(timestamp: number): { am: string; en: string } {
  if (!timestamp) return { am: '', en: '' };
  const d = new Date(timestamp);
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    am: `ረቂቁ ተቀምጧል ${timeStr}`,
    en: `Draft saved ${timeStr}`,
  };
}

// ----------------- STUDENT DRAFTS -----------------

/**
 * Saves a new student entry draft to persistent storage.
 * Returns true on success, false on failure (e.g. storage quota exceeded).
 */
export function saveStudentAddDraft(
  payload: Omit<StudentDraftPayload, 'editingStudentId' | 'updatedAt'>
): boolean {
  try {
    const draft: StudentDraftPayload = {
      ...payload,
      editingStudentId: null,
      updatedAt: getMonotonicTimestamp(),
    };
    safeSet(DRAFT_KEY_STUDENT_ADD, JSON.stringify(draft));
    return true;
  } catch (err) {
    console.error('Failed to save student add draft:', err);
    return false;
  }
}

/**
 * Retrieves the currently saved new student draft, or null if none exists.
 */
export function getStudentAddDraft(): StudentDraftPayload | null {
  try {
    const raw = safeGet(DRAFT_KEY_STUDENT_ADD);
    if (!raw) return null;
    const parsed: StudentDraftPayload = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Failed to get student add draft:', err);
    return null;
  }
}

/**
 * Clears the new student draft.
 */
export function clearStudentAddDraft(): void {
  safeRemove(DRAFT_KEY_STUDENT_ADD);
}

/**
 * Returns true if a non-empty new student draft exists.
 */
export function hasStudentAddDraft(): boolean {
  const draft = getStudentAddDraft();
  if (!draft) return false;
  return Boolean(
    (draft.name && draft.name.trim().length > 0) ||
    (draft.grade && draft.grade.trim().length > 0) ||
    (draft.section && draft.section.trim().length > 0) ||
    (draft.notes && draft.notes.trim().length > 0)
  );
}

/**
 * Saves in-progress edits for an existing student to persistent storage.
 */
export function saveStudentEditDraft(
  studentId: string,
  payload: Omit<StudentDraftPayload, 'editingStudentId' | 'updatedAt'>
): boolean {
  if (!studentId) return false;
  try {
    const raw = safeGet(DRAFT_KEY_STUDENT_EDIT);
    const store: Record<string, StudentDraftPayload> = raw ? JSON.parse(raw) : {};
    store[studentId] = {
      ...payload,
      editingStudentId: studentId,
      updatedAt: getMonotonicTimestamp(),
    };
    safeSet(DRAFT_KEY_STUDENT_EDIT, JSON.stringify(store));
    return true;
  } catch (err) {
    console.error('Failed to save student edit draft:', err);
    return false;
  }
}

/**
 * Retrieves an in-progress edit draft for a specific student ID.
 */
export function getStudentEditDraft(studentId: string): StudentDraftPayload | null {
  if (!studentId) return null;
  try {
    const raw = safeGet(DRAFT_KEY_STUDENT_EDIT);
    if (!raw) return null;
    const store: Record<string, StudentDraftPayload> = JSON.parse(raw);
    return store[studentId] || null;
  } catch (err) {
    console.error('Failed to get student edit draft:', err);
    return null;
  }
}

/**
 * Clears an in-progress edit draft for a specific student ID.
 */
export function clearStudentEditDraft(studentId: string): void {
  if (!studentId) return;
  try {
    const raw = safeGet(DRAFT_KEY_STUDENT_EDIT);
    if (!raw) return;
    const store: Record<string, StudentDraftPayload> = JSON.parse(raw);
    delete store[studentId];
    safeSet(DRAFT_KEY_STUDENT_EDIT, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to clear student edit draft:', err);
  }
}

/**
 * Clears all edit drafts.
 */
export function clearAllStudentEditDrafts(): void {
  safeRemove(DRAFT_KEY_STUDENT_EDIT);
}

/**
 * Returns all current edit drafts keyed by student ID.
 */
export function getAllStudentEditDrafts(): Record<string, StudentDraftPayload> {
  try {
    const raw = safeGet(DRAFT_KEY_STUDENT_EDIT);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

# RollCall – Testing Strategy & Test Suite Breakdown

RollCall enforces a test suite covering pure business logic, calendar arithmetic, duration math, draft auto-save persistence, and export validation.

---

## 🧪 Test Runner & Execution

All tests are authored using Node.js native test runner (`node:test`) and executed via `tsx`:

```bash
# Run all tests
npm test

# Run a specific test suite
npx tsx --test src/utils/timeUtils.test.ts
```

---

## 📊 Test Suite Coverage (35 Unit Tests)

### 1. Ethiopian Calendar Engine (`src/utils/ethiopianCalendar.test.ts`)
- `isEthiopianLeapYear`: Correctly identifies leap years where `year % 4 === 3`.
- `getDaysInEthiopianMonth`: Validates months 1..12 have 30 days, and Pagume (month 13) has 5 days (common) or 6 days (leap).
- `gregorianToEthiopian`: Validates historical known dates (e.g. Enkutatash New Year Sep 11/12, leap transitions).
- `ethiopianToGregorian`: Inverse conversion accuracy tests.
- `formatEthiopianDisplay`: Validates correct Amharic month names and year markers.
- `ETHIOPIAN_MONTHS`: Confirms all 13 Ethiopian months have standard Amharic spellings.

### 2. Time & Activity Duration Engine (`src/utils/timeUtils.test.ts`)
- `parseTimeToMinutes`: Parses 24-hour (`09:30`, `14:15`) and 12-hour (`9:30 AM`, `2:15 PM`) formats.
- `formatMinutesToTime`: Formats minutes from midnight to `HH:MM`.
- `addMinutesToTime`: Offsets time values accurately (`09:30 + 45m = 10:15`).
- `calculateActivityDuration`: Returns exact duration minutes and bilingual labels (`45 ደቂቃ (45 min)`).
- Time order validation: Flags invalid entries when end time is earlier than start time and generates warnings.
- Legitimate overnight sessions: Verifies overnight spans (e.g., `21:00` to `02:00`).

### 3. Draft Auto-Saving System (`src/utils/draftStorage.test.ts`)
- `saveAttendanceDraft`: Saves in-progress attendance records and notes.
- `getAttendanceDraft`: Retrieves saved drafts.
- `clearAttendanceDraft`: Removes draft upon official commit.
- `saveFeedingDraft`: Persists partial feeding report fields.
- `clearFeedingDraft`: Cleans feeding drafts.
- `formatLastSaved`: Verifies formatted bilingual timestamp strings.

### 4. Report Validation & Aggregations (`src/utils/reportValidation.test.ts`)
- Student Registration Guard: Rejects export when student count is 0.
- Report Completeness Guard: Rejects export when neither attendance nor feeding was recorded.
- Partial Feeding Guard: Identifies missing required fields (coordinator name, food type).
- Complete Report Approval: Validates complete submissions pass without warnings.
- `calculateWeeklySummary`: Confirms weekly bucketing arithmetic.
- `calculateMonthlySummary`: Confirms aggregation across all 13 Ethiopian months.

### 5. Attendance & Student Roster Utils (`src/utils/attendance.test.ts`)
- `formatRollNumber`: Zero-pads 1, 12, 120 to `001`, `012`, `120`.
- `calculateDayStats`: Accurately aggregates Present, Absent, Permission, and Late counts with percentage calculations.
- `calculateStudentStats`: Aggregates multi-day histories and attaches student notes.
- `exportAttendanceToCSV`: Generates Excel-compliant CSV strings.
- `parseStudentsFromCSV`: Parses roster headers, quotes, and commas.
- `validateBackupData`: Validates JSON backup integrity.

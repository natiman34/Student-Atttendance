# RollCall – Complete Project Hierarchy & File Architecture

This document outlines the real filesystem directory tree, file responsibilities, and architectural connections across the application.

---

## 🗂️ File System Hierarchy Tree

```text
/
├── index.html                           # HTML entry point (manifest links, viewport, PWA meta)
├── metadata.json                        # Applet metadata, title, description, permissions
├── package.json                         # Dependencies, build scripts, test script
├── tsconfig.json                        # TypeScript compiler options (ES2022, JSX react-jsx)
├── vite.config.ts                       # Vite configuration, Tailwind CSS plugin, dev port 3000
│
├── public/
│   ├── favicon.svg                      # RollCall SVG emblem
│   ├── icon-192.png                     # PWA 192x192 launcher icon
│   ├── icon-512.png                     # PWA 512x512 splash screen icon
│   ├── manifest.json                    # Web App Manifest (standalone, theme color, icons)
│   └── sw.js                            # Service Worker for offline asset caching
│
└── src/
    ├── main.tsx                         # React 19 root bootstrap & Service Worker registration
    ├── App.tsx                          # Root controller, tab router, state hydration, toast alerts
    ├── types.ts                         # Core TypeScript data interfaces and domain models
    │
    ├── components/
    │   ├── EthiopianDatePicker.tsx      # Interactive 13-month Geez calendar picker popover
    │   ├── TimePickerWidget.tsx         # Mobile-friendly time-entry widget with presets & offsets
    │   ├── FeedingActivityTable.tsx     # Activity schedule table with start/end time widgets & duration
    │   ├── ExportCompleteReportFab.tsx  # Floating export action button with collapsible minimization
    │   ├── DailyFeedingReportForm.tsx   # Feeding entry form with real-time draft auto-save
    │   ├── TakeAttendanceScreen.tsx     # Attendance marking screen with 1-tap buttons & auto-save
    │   ├── ExportReportsHub.tsx         # Dedicated reports export center with validation
    │   ├── AttendanceHistoryScreen.tsx  # Historical attendance explorer with weekly/monthly Ethiopian aggregations
    │   ├── HomeScreen.tsx               # Primary dashboard with roll-call counters, status, & actions
    │   ├── StudentsScreen.tsx           # Student roster manager (add, edit, delete, search, roll numbers)
    │   ├── SettingsScreen.tsx           # Preferences, dark mode, default statuses, backup/restore
    │   ├── ReportStorageSettings.tsx    # Storage statistics and local cache cleaner
    │   ├── ReportValidationModal.tsx    # Pre-export validation dialog with redirect buttons
    │   ├── ConfirmModal.tsx             # Reusable accessible confirmation dialog
    │   ├── AddStudentModal.tsx          # Student registration dialog modal
    │   ├── EditStudentModal.tsx         # Student updating dialog modal
    │   ├── ImportExcelModal.tsx         # Excel / CSV student roster batch importer
    │   ├── AttendanceModal.tsx          # Single-student attendance adjustment modal
    │   └── PwaInstallBanner.tsx         # Install prompt banner for mobile Chrome / WebAPK
    │
    └── utils/
        ├── attendance.ts                # Attendance stats calculations, roll padding, date helpers
        ├── attendance.test.ts           # Unit tests for attendance stats and CSV parsers
        ├── ethiopianCalendar.ts         # Bidirectional Geez / Gregorian converter (all 13 months)
        ├── ethiopianCalendar.test.ts    # Unit tests for Ethiopian leap years, months, and dates
        ├── feeding.ts                   # Feeding program defaults and schema validation
        ├── feeding.test.ts              # Unit tests for feeding records and aggregations
        ├── timeUtils.ts                 # Time parsing (12h/24h), duration math, and bilingual labels
        ├── timeUtils.test.ts            # Unit tests for time calculation, order validation, & offsets
        ├── draftStorage.ts              # LocalStorage draft persistence for attendance & feeding forms
        ├── draftStorage.test.ts         # Unit tests for draft saving, loading, clearing, and timestamps
        ├── reportExports.ts             # PDF, Word (.docx), and Excel (.xlsx) single-report generators
        ├── combinedExports.ts           # Combined all-in-one multi-section report generators
        ├── reportAggregations.ts        # Weekly and Ethiopian monthly report metric aggregations
        ├── reportValidation.test.ts     # Unit tests for pre-export validation rules
        └── storage.ts                   # Persistent LocalStorage / IndexedDB repository for rosters & history
```

---

## 🔍 Detailed Component & Utility Responsibilities

### 1. Root & Shell Components
- **`src/main.tsx`**: Renders `<App />` into the DOM and registers `/sw.js` for offline caching and PWA service worker lifecycle management.
- **`src/App.tsx`**: Central orchestrator. Manages `students`, `attendanceHistory`, `feedingReports`, and `settings` in reactive state. Handles active tab switching (`home`, `attendance`, `reports`, `history`, `students`, `settings`), handles global toasts, and renders the sticky responsive bottom navigation bar.
- **`src/types.ts`**: The canonical contract defining `Student`, `DayAttendance`, `AttendanceStatus`, `DailyFeedingReport`, `FeedingActivityRow`, `LessonOrGameType`, and `AppSettings`.

### 2. Time & Activity Scheduling
- **`src/utils/timeUtils.ts`**: Converts time strings into minutes from midnight, adds minutes, calculates durations, handles legitimate overnight sessions, and returns bilingual labels (`45 ደቂቃ (45 min)`).
- **`src/components/TimePickerWidget.tsx`**: Touch-optimized time picker popover with direct text editing, "አሁን (Now)", preset chips (`08:30`, `09:00`, `09:30`, `10:00`, `10:30`, `11:00`, `11:30`, `12:00`), and duration offset buttons (`+15m`, `+30m`, `+45m`, `+60m`).
- **`src/components/FeedingActivityTable.tsx`**: Renders the Activity Schedule table matching official Ethiopian reporting formats with order numbers, activity descriptions, start time, end time, and live duration badges with invalid time order alerts.

### 3. Draft Auto-Saving System
- **`src/utils/draftStorage.ts`**: Provides low-latency local storage for unsubmitted work (`rollcall_draft_attendance_v1` and `rollcall_draft_feeding_v1`). Debounces inputs, guarantees zero data loss across page reloads or device lock, and formats relative timestamps.
- **`src/components/DailyFeedingReportForm.tsx`**: Feeding report entry. Automatically saves draft upon typing, displays visual status indicators (`በማስቀመጥ ላይ...` / `ተቀምጧል`), restores unsaved drafts upon opening, and includes a "ረቂቁን ሰርዝ (Discard Draft)" button with `ConfirmModal`.
- **`src/components/TakeAttendanceScreen.tsx`**: Roll-call screen. Automatically saves marked records and notes to draft storage, restores uncommitted drafts on date navigation, and cleans drafts upon formal save.

### 4. Export & Validation Engine
- **`src/components/ExportCompleteReportFab.tsx`**: Floating action button with a minimize/collapse button that docks into a safe corner of the screen without covering input fields or the bottom navigation bar. Opens a comprehensive modal with PDF, Word, and Excel generation options.
- **`src/components/ReportValidationModal.tsx`**: Pre-export guard. Prevents empty exports when students are unregistered or reports are blank, showing Amharic/English instructions with one-click navigation buttons.
- **`src/utils/combinedExports.ts`**: Generates unified multi-section documents (Attendance + Feeding Program + Activity Schedule + Gaps) in PDF, Word (`.docx`), and Excel (`.xlsx`).

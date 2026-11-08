# RollCall – Architectural Overview & System Design

RollCall is built upon a **Local-First, Offline-Authoritative Architecture**. It executes entirely on the user's client device with zero external server dependencies for data persistence or report document generation.

---

## 🏛️ System Architecture Diagram

```mermaid
graph TD
    subgraph UI_Layer["User Interface Layer (React 19 + Tailwind CSS)"]
        Nav[Bottom Navigation & Safe Area Manager]
        Home[Dashboard HomeScreen]
        Att[TakeAttendanceScreen]
        Feed[DailyFeedingReportForm]
        Table[FeedingActivityTable + TimePickerWidget]
        Reports[ExportReportsHub + ExportCompleteReportFab]
        Hist[AttendanceHistoryScreen]
        Students[StudentsScreen]
    end

    subgraph State_Layer["Reactive Application State (App.tsx)"]
        S_Students["students: Student[]"]
        S_Att["attendanceHistory: DayAttendance[]"]
        S_Feed["feedingReports: DailyFeedingReport[]"]
        S_Settings["settings: AppSettings"]
    end

    subgraph Storage_Layer["Local-First Persistence Layer"]
        LS_Main[("LocalStorage: Permanent Records")]
        LS_Draft[("LocalStorage: Draft Buffers")]
        SW[("Service Worker Cache: sw.js")]
    end

    subgraph Engine_Layer["Domain Engines & Utilities"]
        Cal["Ethiopian Calendar Engine (13 Months)"]
        TimeEngine["Time Entry & Duration Engine"]
        DraftEngine["Auto-Save Draft Manager"]
        Val["Pre-Export Validation Guard"]
        Exp["Document Pipeline (PDF, Word, Excel)"]
    end

    UI_Layer --> State_Layer
    State_Layer --> Storage_Layer
    Table --> TimeEngine
    Att --> DraftEngine
    Feed --> DraftEngine
    DraftEngine --> LS_Draft
    State_Layer --> LS_Main
    Reports --> Val
    Val --> Exp
    Att --> Cal
    Hist --> Cal
```

---

## 🔄 Unidirectional Data Flow

1. **User Interaction**:
   The user enters data via touch-friendly inputs (e.g., student attendance status toggles, Ethiopian date picker, time-picker presets, coordinator details).
2. **Immediate Local Draft Auto-Save**:
   Before official submission, input changes are debounced (450ms) and streamed into `draftStorage.ts`. This ensures no data is lost even if the browser crashes, the phone reboots, or the app is closed.
3. **Commit & Validation**:
   When the user submits the form ("Save Report" or "Save Attendance"):
   - Pure domain validators verify constraints (e.g. valid names, positive numbers, non-reversed time orders).
   - If valid, the committed object updates central state in `App.tsx` and writes to permanent storage.
   - The associated draft buffer for that date is safely cleared.
4. **Document Generation Pipeline**:
   When exporting reports:
   - `ReportValidationModal` checks for existing student records and populated sections.
   - Pure data models are converted in-memory into binary document streams:
     - PDF: vector rendering via `jspdf` and `jspdf-autotable`.
     - Word: OpenXML `.docx` generation via `docx`.
     - Excel: SpreadsheetML `.xlsx` generation via `xlsx`.
   - Browser downloads are triggered immediately without backend roundtrips.

---

## ⏱️ Activity Schedule & Duration Calculation Architecture

```mermaid
sequenceDiagram
    participant User
    participant TimePicker as TimePickerWidget
    participant Table as FeedingActivityTable
    participant TimeUtils as timeUtils.ts
    participant Draft as draftStorage.ts

    User->>TimePicker: Select Start Time (09:30) or tap "አሁን (Now)"
    TimePicker->>Table: onChange("09:30")
    User->>TimePicker: Select End Time (+45m quick offset -> 10:15)
    TimePicker->>Table: onChange("10:15")
    Table->>TimeUtils: calculateActivityDuration("09:30", "10:15")
    TimeUtils-->>Table: { durationMinutes: 45, formattedAm: "45 ደቂቃ (45 min)", isValid: true }
    Table->>Table: Render live duration badge & update total duration
    Table->>Draft: saveFeedingDraft(date, draftData)
```

If the user mistakenly enters an end time earlier than start time (e.g., Start: `10:30`, End: `09:15`):
`calculateActivityDuration` detects the inverted order, flags `isValid: false`, and supplies the bilingual alert `የማብቂያ ሰዓት ከመጀመሪያ ሰዓት ቀድሟል (End time is earlier than start time)`. The row is highlighted in light red, alerting the user immediately.

---

## 🛡️ Standalone PWA Architecture

- **Manifest (`public/manifest.json`)**: Configured with `display: "standalone"`, `orientation: "any"`, custom app theme colors, and multi-size launcher icons.
- **Service Worker (`public/sw.js`)**: Implements cache-first strategy for static assets and offline navigation fallbacks, guaranteeing full application functionality when disconnected from the internet.
- **Hardware Safe-Area Compatibility**: Respects CSS environment variables (`env(safe-area-inset-bottom)`) so bottom action bars and floating export buttons never collide with Android system navigation bars or iPhone gesture indicators.

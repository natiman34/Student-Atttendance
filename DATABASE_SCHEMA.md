# RollCall – Database Schema & Data Models

RollCall utilizes a client-side, local-first storage repository backed by browser `LocalStorage` and `IndexedDB` with strict TypeScript data models.

---

## 🗄️ Storage Keys & Namespaces

| Storage Key | Type | Description |
| :--- | :--- | :--- |
| `rollcall_students` | `Student[]` | Active student roster records |
| `rollcall_attendance` | `DayAttendance[]` | Historical attendance sessions indexed by ISO date |
| `rollcall_feeding_reports` | `DailyFeedingReport[]` | Daily child nutrition and activity program logs |
| `rollcall_settings` | `AppSettings` | User preferences, theme, and language configuration |
| `rollcall_draft_attendance_v1` | `Record<string, AttendanceDraftPayload>` | Debounced auto-save buffers for attendance |
| `rollcall_draft_feeding_v1` | `Record<string, FeedingDraftPayload>` | Debounced auto-save buffers for feeding reports |
| `rollcall_export_fab_minimized` | `boolean` | User preference for floating export button minimized state |

---

## 📋 Data Model Definitions

### 1. Student (`Student`)
```typescript
interface Student {
  id: string;               // Unique ID: "std_" + timestamp + random
  name: string;             // Student full name (e.g. "አበበ ከበደ / Abebe Kebede")
  rollNumber: number;       // Integer roll number (1..N), formatted as 3-digit "001"
  gender?: 'M' | 'F';       // Optional gender identifier
  grade?: string;           // Optional grade/section identifier
  notes?: string;           // Optional notes (e.g. allergies, contact info)
  active: boolean;          // Active status (true = included in roll-call)
  createdAt: number;        // Unix epoch timestamp in milliseconds
  updatedAt?: number;       // Unix epoch timestamp of last modification
}
```

### 2. Day Attendance (`DayAttendance`)
```typescript
type AttendanceStatus = 'present' | 'absent' | 'permission' | 'late';

interface DayAttendance {
  date: string;                             // ISO date string format "YYYY-MM-DD"
  records: Record<string, AttendanceStatus>;// Map: { [studentId]: status }
  notes?: Record<string, string>;           // Map: { [studentId]: noteText }
  updatedAt: number;                        // Unix epoch timestamp in milliseconds
}
```

### 3. Daily Feeding Report (`DailyFeedingReport`)
```typescript
type LessonOrGameType = 'lesson' | 'game' | 'none';

interface FeedingActivityRow {
  id: string;               // Unique row ID
  orderNumber: number;      // Sequence position (1, 2, 3...)
  activityName: string;     // Activity description (e.g. "ምገባ", "መዝሙር", "የተሰጠው ትምህርት")
  startTime: string;        // Start time string ("09:30" or "09:30 am")
  endTime: string;          // End time string ("10:15" or "10:15 am")
}

interface DailyFeedingReport {
  id: string;                         // Unique ID: "feed_" + timestamp
  date: string;                       // ISO date string format "YYYY-MM-DD"
  coordinatorName: string;            // Duty coordinator name (ተረኛ አስተባባሪ)
  foodType: string;                   // Food description (የምግቡ አይነት)
  foodQuantityKg: number;             // Food weight in kilograms (መጠን በኪሎ)
  location: string;                   // Location (ምገባው የተከናወነበት ቦታ)
  childrenCount: number;              // Children fed count (የተሳተፉ ህፃናት ቁጥር)
  volunteersCount: number;            // Volunteers count (የተሳተፉ አገልጋዮች ቁጥር)
  activityType: LessonOrGameType;     // 'lesson' | 'game' | 'none'
  activities: FeedingActivityRow[];   // Activity schedule rows
  generalNotes?: string;              // Gaps or challenges encountered (ክፍተቶች/ተግዳሮቶች)
  createdAt: number;                  // Unix epoch timestamp
  updatedAt: number;                  // Unix epoch timestamp
}
```

### 4. Auto-Save Draft Storage Models
```typescript
interface AttendanceDraftPayload {
  date: string;                             // "YYYY-MM-DD"
  records: Record<string, AttendanceStatus>;// Active markings
  notes?: Record<string, string>;           // Active notes
  updatedAt: number;                        // Last auto-saved timestamp
}

interface FeedingDraftPayload {
  date: string;                             // "YYYY-MM-DD"
  report: Partial<DailyFeedingReport>;      // In-progress feeding fields
  updatedAt: number;                        // Last auto-saved timestamp
}
```

### 5. Application Settings (`AppSettings`)
```typescript
interface AppSettings {
  schoolName: string;                       // Organization / School title
  academicYear: string;                     // Academic year (e.g. "2017 ዓ.ም")
  language: 'am' | 'en' | 'bilingual';      // Language mode
  calendarType: 'ethiopian' | 'gregorian';  // Primary calendar preference
  defaultStatus: 'present' | 'none';        // Default roll-call status on start
  theme: 'light' | 'dark' | 'system';       // UI theme preference
  enableLateStatus?: boolean;               // Toggle Late status support
}
```

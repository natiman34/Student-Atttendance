# RollCall – Complete Feature Matrix

This document provides a comprehensive review of the implemented features, validation constraints, and user workflows in the Student Attendance & Feeding Management System.

---

## 📋 Core Modules & Capabilities

### 1. Student Roster Management
- **Add / Edit / Remove Students**: Instant modal dialogs with input validation for unique roll numbers and full names.
- **Roll Number Formatting**: Automatic 3-digit zero-padding (`001`, `012`, `120`).
- **Excel Roster Importer**: Drag-and-drop or file upload supporting `.xlsx`, `.xls`, and `.csv` files with automatic column header detection (`Name / ስም`, `Roll / ተ.ቁ`, `Gender / ጾታ`).
- **Instant Search & Filter**: Real-time filtering by student name, roll number, or status.

### 2. Fast Attendance Roll-Call
- **3-State Status Toggle**: *ተገኝቷል (Present)*, *ቀሪ (Absent)*, *ፈቃድ (Permission)*, and optional *አርፍዷል (Late)*.
- **One-Tap "Mark All Present"**: Sets the entire class roster to present in 1 tap for rapid morning roll-call.
- **Student Quick Notes & Chips**: One-tap tags (*ታሟል - Sick*, *ፈቃድ - Permitted*, *ያረፈደ - Late*, *ልዩ - Special*) or custom text notes attached to individual student records.
- **Live Counters**: Real-time counters displaying Present count, Absent count, Permission count, and Attendance percentage.
- **Dual Calendar Selector**: Ethiopian Date Picker and Gregorian date selector.

### 3. Daily Feeding Program Tracking
- **Food Type & Supply**: Tracks food description (e.g. *ዳቦ በወተት*, *እንጀራ በሽሮ*) and precise quantity in kilograms (`kg`).
- **Coordinator on Duty**: Records the responsible coordinator for accountability.
- **Participants**: Tracks both children fed and volunteer staff count.
- **Activity Option Selector**:
  1. *ትምህርት (Lesson)*: Educational session.
  2. *ጨዋታ (Game)*: Recreation / physical game.
  3. *ምንም (Nothing)*: No activity held (disables schedule times).
- **Gaps & Challenges (ክፍተቶች/ተግዳሮቶች)**: Dedicated text section for operational observations and hurdles.

### 4. Interactive Activity Schedule & Time Picker
- **Touch-Friendly Time Picker**: Direct input, "አሁን (Now)" shortcut button, preset chips (`08:30`, `09:00`, `09:30`, `10:00`, `10:30`, `11:00`, `11:30`, `12:00`), and relative duration offsets (`+15m`, `+30m`, `+45m`, `+60m`).
- **Automatic Duration Calculation**: Live duration badge (e.g., `45 ደቂቃ (45 min)`) calculated per row.
- **Time Validation Alert**: Detects invalid time order (when end time precedes start time during daytime hours) and highlights row in red with Amharic error text.
- **Total Duration Aggregation**: Live counter of total scheduled minutes/hours for the program.

### 5. Automatic Draft Saving
- **Zero Loss Local Persistence**: Automatically writes changes to `LocalStorage` within 450ms of typing.
- **Live Status Badges**: Displays `በማስቀመጥ ላይ... (Saving...)` and `ተቀምጧል (Saved)` with timestamp.
- **Draft Recovery Banner**: Alerts user when an unsubmitted draft has been restored upon returning to the page.
- **Safe Discard Action**: Confirmation modal allowing users to safely discard uncommitted drafts.

### 6. Multi-Format Report Document Generation
- **Client-Side PDF Generation**: Formatted PDF document with bilingual headers, statistics tables, feeding breakdown, and signature lines.
- **Microsoft Word (.docx)**: Word document with formatted tables and official header blocks.
- **Microsoft Excel (.xlsx)**: Multi-sheet spreadsheet export for administrative data analysis.
- **Pre-Export Validation Guard**: Prevents generating misleading blank documents when students or report data are missing, redirecting the user to the appropriate screen.
- **Collapsible Floating Action Button (FAB)**: Floating export button that can be collapsed into a compact 42px icon so it never obstructs input fields or bottom navigation bars.

### 7. Ethiopian Calendar System (ባሕረ ሃሳብ)
- Support for all **13 Ethiopian Months**:
  1. መስከረም (Meskerem)
  2. ጥቅምት (Tikimt)
  3. ኅዳር (Hidar)
  4. ታኅሣሥ (Tahsas)
  5. ጥር (Tir)
  6. የካቲት (Yekatit)
  7. መጋቢት (Megabit)
  8. ሚያዝያ (Miazia)
  9. ግንቦት (Ginbot)
  10. ሰኔ (Sene)
  11. ሐምሌ (Hamle)
  12. ነሐሴ (Nehase)
  13. ጳጉሜን (Pagume - 5 or 6 leap days)
- Accurate leap year formula (`year % 4 === 3`).

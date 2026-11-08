# RollCall – Student Attendance & Daily Feeding Management System
### የተማሪዎች አቴንዳንስ እና የዕለት ምገባ ሪፖርት አስተዳደር ስርዓት

A high-performance, offline-first Progressive Web Application (PWA) designed for educational centers, schools, and charitable child-feeding programs in Ethiopia and bilingual environments. Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Vite**.

---

## 🌟 Key Features

1. **📱 100% Mobile-First & Standalone Responsive Design**
   - Optimized for all smartphone screen sizes (320px to 430px+), tablets, and desktop displays.
   - Installable directly to Android and desktop home screens as a standalone app with its own app icon, splash screen, and offline service worker.
   - Bottom navigation bar with safe-area insetting for Android navigation gestures.

2. **🇪🇹 Complete Ethiopian Calendar Integration (ባሕረ ሃሳብ)**
   - Bidirectional Ethiopian (Geez) and Gregorian calendar conversion.
   - Interactive Ethiopian date picker supporting all **13 Ethiopian months** (*መስከረም* through *ጳጉሜን*) with 5 or 6 leap days (`year % 4 === 3`).
   - Dual calendar displays across all screens: Home, Attendance, Reports, Feeding, and History.

3. **✅ Fast 1-Tap Attendance Marking**
   - 3-status toggle (*Present*, *Absent*, *Permission / ፈቃድ*, with optional *Late*).
   - "Mark All Present" fast-track action for rapid roll-call.
   - Quick student notes with one-tap chips (*ታሟል*, *ፈቃድ*, *ያረፈደ*, *ልዩ ሁኔታ*).
   - Instant real-time filtering and live stats counters.

4. **🍲 Daily Feeding Program & Activity Schedule**
   - Full tracking of coordinator on duty, food type, food quantity in kg, feeding location, children fed count, and volunteer numbers.
   - Activity schedule selector: **ትምህርት (Lesson)**, **ጨዋታ (Game)**, or **ምንም (Nothing)**.
   - **Interactive Time-Entry Widget**: Tap-friendly time selector with 24-hour and Ethiopian time support, quick presets, "አሁን (Now)" shortcut, and relative offset increments (`+15m`, `+30m`, `+45m`, `+60m`).
   - **Automatic Activity Duration Calculation**: Calculates duration badges (e.g., `45 ደቂቃ (45 min)`) and highlights invalid time order warnings in red if end time precedes start time.
   - Total scheduled duration aggregation in real time.

5. **🛡️ Automatic Draft Saving (Zero Data Loss Protection)**
   - Protects against accidental browser closing, tab switches, or battery shutoffs.
   - Automatically debounces and persists in-progress attendance records, notes, coordinator details, food weights, and activity schedules to local storage.
   - Visual status indicators: `በማስቀመጥ ላይ... (Saving...)` and `ተቀምጧል (Saved)`.
   - Restores the most recent draft automatically upon reopening with a "ረቂቁን ሰርዝ (Discard Draft)" button with user confirmation modal.

6. **📑 Complete Multi-Format Report Generation**
   - **PDF Generation**: Native client-side PDF export via `jspdf` and `jspdf-autotable`.
   - **Microsoft Word (.docx)**: Word document generation with formatted tables and official header blocks via `docx`.
   - **Microsoft Excel (.xlsx)**: Multi-sheet spreadsheets with styling and summaries via `xlsx`.
   - **Pre-Export Validation**: Stops empty or misleading exports with bilingual warnings (Amharic & English) guiding users directly to student registration or report entry.
   - **Non-Obstructive Floating Export Button**: Collapsible floating action button with minimize toggle (compact 42px badge) that prevents covering inputs or bottom navigation.

7. **💾 Local-First Security & Portability**
   - Zero external cloud or server dependencies required to run or store records.
   - Full JSON backup export and restore with cryptographic schema validation.
   - Excel roster import and CSV attendance exports.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (or Bun / PNPM)
- Modern web browser (Google Chrome, Microsoft Edge, Safari, Firefox)

### Installation & Development
```bash
# Clone or navigate to the repository
cd rollcall

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile or desktop browser.

### Building for Production
```bash
# Build optimized production assets
npm run build

# Preview production build locally
npm run preview
```

### Running Automated Tests
```bash
# Run the complete test suite (35 unit tests)
npm test
```

---

## 📱 Mobile Installation (Android Chrome & Desktop)

1. Open the deployed application URL in **Google Chrome** on your Android smartphone.
2. Tap the Chrome menu (⋮) at the top right, or click the **"Install App"** prompt banner at the top of the screen.
3. Select **"Add to Home screen"** or **"Install App"**.
4. Confirm installation. The application icon **RollCall** will appear on your mobile home screen.
5. Launching the app opens it in standalone mode without Chrome URL bars, navigation controls, or browser tabs.

---

## 📄 License
MIT License. Built for community educational and child nutrition initiatives.

# RollCall – Developer Guide & Engineering Handbook

This guide details the development workflow, coding standards, local scripts, and patterns for extending RollCall.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime & Build**: Node.js v18+, Vite 6, TypeScript 5.7
- **Frontend Framework**: React 19 (functional components, hooks)
- **Styling**: Tailwind CSS 4 with CSS environment variables for hardware safe areas
- **Document Generation**:
  - `jspdf` & `jspdf-autotable`: Client-side PDF rendering
  - `docx`: OpenXML Word document creation
  - `xlsx`: Spreadsheet creation and CSV parsing
- **Icons**: `lucide-react`
- **Testing**: Node.js native test runner (`node:test`) executed via `tsx`

---

## 📜 NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local development server on port 3000 |
| `npm run build` | `tsc -b && vite build` | Type-checks codebase and builds optimized bundle in `dist/` |
| `npm run preview` | `vite preview` | Previews the production build locally |
| `npm run lint` | `tsc --noEmit` | Validates TypeScript types across all source files |
| `npm test` | `tsx --test src/**/*.test.ts` | Runs the full 35-unit test suite |

---

## 📐 Architecture & Coding Conventions

### 1. Zero Server Dependencies
Never introduce external server or API requirements for basic app functions. Data must always be persisted to `localStorage` or `IndexedDB` first. All exports must generate directly in the client browser.

### 2. Mobile-First & Touch Targets
- All interactive buttons must have minimum touch areas of `44x44px` on mobile screens.
- Use `px-3.5 py-2.5` to `px-4 py-3` for mobile buttons with `active:scale-95` tactile feedback.
- Fixed or floating elements must respect safe areas:
  ```css
  bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
  ```

### 3. Dual Calendar & Bilingual Amharic Support
- Always preserve Amharic labels alongside English translations:
  ```tsx
  <span>ተገኝቷል (Present)</span>
  ```
- Use `ethiopianCalendar.ts` for any date representation intended for Ethiopian users.

### 4. Adding a New Report Export Format
To introduce a new export format:
1. Define the generator in `src/utils/reportExports.ts` or `src/utils/combinedExports.ts`.
2. Connect it to `ExportCompleteReportFab.tsx` and `ExportReportsHub.tsx`.
3. Wrap execution in `ReportValidationModal` checks so incomplete reports cannot be exported.
4. Add unit test assertions in `src/utils/reportValidation.test.ts`.

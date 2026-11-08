export type Language = 'en' | 'am';

export interface Translations {
  // Navigation & General
  navHome: string;
  navStudents: string;
  navAttendance: string;
  navReports: string;
  navHistory: string;
  navStats: string;
  navSettings: string;
  appTitle: string;
  appSubtitle: string;
  installApp: string;
  switchDarkMode: string;
  switchLightMode: string;
  language: string;
  english: string;
  amharic: string;

  // Common Actions
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  close: string;
  done: string;
  search: string;
  clear: string;
  filter: string;
  exportAction: string;
  importAction: string;
  download: string;
  add: string;
  resume: string;
  print: string;
  back: string;
  copy: string;
  copied: string;
  actions: string;
  select: string;
  selectAll: string;
  deselectAll: string;
  deleteAll: string;
  reorder: string;
  or: string;

  // Statuses
  present: string;
  absent: string;
  permission: string;
  late: string;
  unmarked: string;
  blank: string;
  rate: string;
  all: string;
  recorded: string;
  notRecorded: string;
  logged: string;
  notLogged: string;
  ready: string;

  // Dashboard / Home
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  teacherLabel: string;
  totalEnrolled: string;
  activeMembers: string;
  presentToday: string;
  absentToday: string;
  markedAbsent: string;
  feedingStatus: string;
  childrenFed: string;
  todayAttendance: string;
  todayAttendanceDesc: string;
  viewRecord: string;
  editAttendance: string;
  takeAttendance: string;
  dailyFeeding: string;
  dailyFeedingDesc: string;
  viewDetails: string;
  editReport: string;
  logFeeding: string;
  coordinator: string;
  location: string;
  foodType: string;
  combinedReportTitle: string;
  combinedReportDesc: string;
  downloadPdf: string;
  downloadWord: string;
  downloadExcel: string;
  quickActionFeedingLogs: string;
  quickActionFeedingDesc: string;
  quickActionAttReports: string;
  quickActionAttDesc: string;
  quickActionExportCenter: string;
  quickActionExportDesc: string;

  // Attendance Screen
  attendanceTitle: string;
  studentsEnrolled: string;
  allPresent: string;
  clearAll: string;
  attendanceLiveStatus: string;
  blankAbsentNotice: string;
  exportAttendanceReport: string;
  addNotePlaceholder: string;
  clearNote: string;
  tagSick: string;
  tagExcused: string;
  tagLate: string;
  tagAppointment: string;
  draftSaved: string;
  discardDraft: string;
  attendanceSavedSuccess: string;
  togglePresentTooltip: string;
  togglePermissionTooltip: string;
  unmarkedFilter: string;

  // Students Screen
  studentsTitle: string;
  studentRoster: string;
  studentsSelected: string;
  addStudentBtn: string;
  importRosterBtn: string;
  searchStudentsPlaceholder: string;
  showingStudentsOf: string;
  clearSearch: string;
  noStudentsEnrolled: string;
  noStudentsEnrolledDesc: string;
  addStudentManually: string;
  loadDemoRoster: string;
  reorderActiveNotice: string;

  // Student Modals
  addNewStudentTitle: string;
  editStudentTitle: string;
  draftAutoSavedNotice: string;
  rollNumberLabel: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  gradeLabel: string;
  gradePlaceholder: string;
  sectionLabel: string;
  sectionPlaceholder: string;
  notesLabel: string;
  notesPlaceholder: string;
  registerStudentBtn: string;
  saveChangesBtn: string;
  keepDraftBtn: string;
  deleteStudentConfirmTitle: string;
  deleteStudentConfirmMsg: string;
  bulkDeleteConfirmTitle: string;
  bulkDeleteConfirmMsg: string;
  deleteAllConfirmTitle: string;
  deleteAllConfirmMsg: string;

  // Daily Feeding Form
  feedingReportTitle: string;
  feedingReportSubtitle: string;
  reportDateLabel: string;
  changeDateBtn: string;
  coordinatorNameLabel: string;
  coordinatorPlaceholder: string;
  foodTypeLabel: string;
  foodTypePlaceholder: string;
  feedingLocationLabel: string;
  feedingLocationPlaceholder: string;
  childrenCountLabel: string;
  volunteersCountLabel: string;
  activityOptionLabel: string;
  activityLesson: string;
  activityLessonDesc: string;
  activityGame: string;
  activityGameDesc: string;
  activityNone: string;
  activityNoneDesc: string;
  activityScheduleTitle: string;
  activityScheduleDesc: string;
  manualTimeBtn: string;
  resetBtn: string;
  addRowBtn: string;
  tableNo: string;
  tableActivity: string;
  tableSchedule: string;
  tableStart: string;
  tableEnd: string;
  tableDuration: string;
  gapsChallengesLabel: string;
  gapsChallengesPlaceholder: string;
  clearFormBtn: string;
  saveReportBtn: string;
  feedingSavedSuccess: string;

  // Reports Screen & History
  tabFeedingReport: string;
  tabAttendanceReport: string;
  tabReportHistory: string;
  tabExportReports: string;
  historyTitle: string;
  historySubtitle: string;
  selectDateRange: string;
  dailyReports: string;
  weeklyReports: string;
  monthlyReports: string;
  noReportsFound: string;
  printForm: string;

  // Settings Screen
  settingsTitle: string;
  languageSectionTitle: string;
  languageSectionDesc: string;
  appearanceSectionTitle: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  schoolInfoSectionTitle: string;
  classNameLabel: string;
  classNamePlaceholder: string;
  academicYearLabel: string;
  academicYearPlaceholder: string;
  targetAttendanceLabel: string;
  defaultStatusLabel: string;
  backupSectionTitle: string;
  backupSectionDesc: string;
  exportBackupBtn: string;
  importBackupBtn: string;
  clearAllDataBtn: string;
  preferencesSavedToast: string;

  // Install Modal
  installModalTitle: string;
  installModalSubtitle: string;
  oneClickInstallAvail: string;
  oneClickInstallDesc: string;
  installAppAction: string;
  standaloneFeatureTitle: string;
  standaloneFeatureDesc: string;
  appWebLinkLabel: string;
  openInNewTab: string;
  installationStepsTitle: string;
  tabAndroidMobile: string;
  tabDesktop: string;
  tabIos: string;
  step1Mobile: string;
  step2Mobile: string;
  step3Mobile: string;
  step4Mobile: string;
  step1Desktop: string;
  step2Desktop: string;
  step3Desktop: string;
  step1Ios: string;
  step2Ios: string;
  step3Ios: string;

  // Student Archiving & Details
  activeStudents: string;
  archivedStudents: string;
  archiveStudent: string;
  unarchiveStudent: string;
  archiveConfirmTitle: string;
  archiveConfirmMsg: string;
  archiveReasonLabel: string;
  studentIdNumberLabel: string;
  studentIdNumberPlaceholder: string;
  duplicateIdError: string;
  filterArchived: string;
  noArchivedStudents: string;

  // Attendance Summary & Audit Trail
  attendanceSummaryTitle: string;
  attendanceSummaryDesc: string;
  studentsMarkedPresent: string;
  studentsMarkedPermission: string;
  studentsMarkedAbsent: string;
  studentsTotal: string;
  confirmAndSaveAttendance: string;
  editSavedAttendanceTitle: string;
  editSavedAttendanceWarning: string;
  editReasonLabel: string;
  editReasonPlaceholder: string;
  attendanceAuditLogTitle: string;
  noAuditLogs: string;
  modifiedAtLabel: string;
  modifiedByLabel: string;
  changeSummaryLabel: string;

  // Feeding Roster & Grade/Section
  filterGrade: string;
  allGrades: string;
  filterSection: string;
  allSections: string;
  attendanceReport: string;
  totalStudents: string;
  selectGrade: string;
  selectSection: string;
  trackIndividualStudents: string;
  trackIndividualStudentsDesc: string;
  allStudentsAte: string;
  clearRoster: string;
  rosterStudentsFedCount: string;
  duplicateFeedingDateGradeSection: string;

  // Dashboard & Analytics
  gradeSectionBreakdown: string;
  weeklyAttendanceTrend: string;
  monthlyComparison: string;
  frequentAbsencesAlert: string;
  frequentAbsencesDesc: string;
  noFrequentAbsentees: string;
  absentDaysCount: string;
  recentActivity: string;
  noRecentActivity: string;
  attendanceSavedActivity: string;
  feedingSavedActivity: string;
  onlineStatus: string;
  offlineStatus: string;

  // Reporting, Ethiopian Calendar & Backup
  termlyReport: string;
  annualReport: string;
  individualStudentReport: string;
  selectTerm: string;
  schoolTerms: string;
  ethiopianHolidays: string;
  addHoliday: string;
  holidayName: string;
  holidayDate: string;
  academicCalendarTitle: string;
  academicCalendarDesc: string;
  backupHistory: string;
  noBackupHistory: string;
  createdOn: string;
  backupSize: string;
  storageNoticeTitle: string;
  storageNoticeDesc: string;
  preparedBy: string;
  verifiedBy: string;
  signature: string;
  officialSchoolStamp: string;
  schoolNameLabel: string;
  schoolNamePlaceholder: string;
  enableLateStatusLabel: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation & General
    navHome: 'Dashboard',
    navStudents: 'Students',
    navAttendance: 'Attendance',
    navReports: 'Reports',
    navHistory: 'History',
    navStats: 'Stats',
    navSettings: 'Settings',
    appTitle: 'RollCall',
    appSubtitle: 'Student Attendance & Feeding',
    installApp: 'Install App',
    switchDarkMode: 'Switch to Dark Mode',
    switchLightMode: 'Switch to Light Mode',
    language: 'Language',
    english: 'English',
    amharic: 'አማርኛ (Amharic)',

    // Common Actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    done: 'Done',
    search: 'Search',
    clear: 'Clear',
    filter: 'Filter',
    exportAction: 'Export',
    importAction: 'Import',
    download: 'Download',
    add: 'Add',
    resume: 'Resume Editing',
    print: 'Print',
    back: 'Back',
    copy: 'Copy Link',
    copied: 'Copied!',
    actions: 'Actions',
    select: 'Select',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    deleteAll: 'Delete All',
    reorder: 'Reorder',
    or: 'or',

    // Statuses
    present: 'Present',
    absent: 'Absent',
    permission: 'Permission',
    late: 'Late',
    unmarked: 'Unmarked / Blank',
    blank: 'Blank',
    rate: 'Rate',
    all: 'All',
    recorded: 'Recorded',
    notRecorded: 'Not Recorded',
    logged: 'Logged',
    notLogged: 'Not Logged',
    ready: 'Ready',

    // Dashboard / Home
    greetingMorning: 'Good Morning 👋',
    greetingAfternoon: 'Good Afternoon 👋',
    greetingEvening: 'Good Evening 👋',
    teacherLabel: 'Teacher',
    totalEnrolled: 'Total Enrolled',
    activeMembers: 'active roster members',
    presentToday: 'Present Today',
    absentToday: 'Absent Today',
    markedAbsent: 'marked absent',
    feedingStatus: 'Feeding Status',
    childrenFed: 'children fed',
    todayAttendance: "Today's Attendance",
    todayAttendanceDesc: 'Record and track presence, absences, and permissions.',
    viewRecord: 'View Record',
    editAttendance: 'Edit Attendance',
    takeAttendance: 'Take Attendance',
    dailyFeeding: 'Daily Feeding Program',
    dailyFeedingDesc: 'Nutritional supply, coordinator, and activity schedule.',
    viewDetails: 'View Details',
    editReport: 'Edit Report',
    logFeeding: 'Log Feeding',
    coordinator: 'Duty Coordinator',
    location: 'Location',
    foodType: 'Food',
    combinedReportTitle: "Export Today's Complete Report",
    combinedReportDesc: 'Combined Section 1 (Attendance) & Section 2 (Feeding with Activity Schedule) in one document.',
    downloadPdf: 'Download PDF',
    downloadWord: 'Download Word (.docx)',
    downloadExcel: 'Download Excel (.xlsx)',
    quickActionFeedingLogs: 'Feeding Logs',
    quickActionFeedingDesc: 'Food supplies, activities & coordinator logs',
    quickActionAttReports: 'Attendance Reports',
    quickActionAttDesc: 'Daily roll-calls & weekly breakdowns',
    quickActionExportCenter: 'Export Center',
    quickActionExportDesc: 'Batch export and historical files',

    // Attendance Screen
    attendanceTitle: 'Attendance',
    studentsEnrolled: 'students enrolled',
    allPresent: 'All Present',
    clearAll: 'Clear All',
    attendanceLiveStatus: 'Attendance Live Status (Blank = Absent)',
    blankAbsentNotice: '(Blank / Default Absent)',
    exportAttendanceReport: 'Export Attendance Report',
    addNotePlaceholder: 'Add note (sick, appointment, excused)...',
    clearNote: 'Clear note',
    tagSick: '+Sick',
    tagExcused: '+Excused',
    tagLate: '+Late',
    tagAppointment: '+Appointment',
    draftSaved: 'Draft saved',
    discardDraft: 'Discard Draft',
    attendanceSavedSuccess: 'Attendance saved successfully',
    togglePresentTooltip: 'Toggle Present (click to select or unselect)',
    togglePermissionTooltip: 'Toggle Permission (click to select or unselect)',
    unmarkedFilter: 'Unmarked / Blank',

    // Students Screen
    studentsTitle: 'Students Roster',
    studentRoster: 'Student Roster',
    studentsSelected: 'students selected',
    addStudentBtn: 'Add Student',
    importRosterBtn: 'Import Roster',
    searchStudentsPlaceholder: 'Search students by name, roll number, grade, or section...',
    showingStudentsOf: 'Showing',
    clearSearch: 'Clear search',
    noStudentsEnrolled: 'No students enrolled yet',
    noStudentsEnrolledDesc: 'Add students manually or import from an Excel (.xlsx / .csv) file to begin tracking attendance.',
    addStudentManually: '+ Add Students Manually',
    loadDemoRoster: 'Load Demo Class & Records',
    reorderActiveNotice: 'Reorder mode active. Use arrows to move student positions.',

    // Student Modals
    addNewStudentTitle: 'Add New Student',
    editStudentTitle: 'Edit Student',
    draftAutoSavedNotice: 'Changes are auto-saved as a draft',
    rollNumberLabel: 'Roll #',
    fullNameLabel: 'Full Name *',
    fullNamePlaceholder: 'e.g. Abebe Kebede',
    gradeLabel: 'Grade',
    gradePlaceholder: 'e.g. Grade 4',
    sectionLabel: 'Section',
    sectionPlaceholder: 'e.g. A',
    notesLabel: 'Notes (Optional)',
    notesPlaceholder: 'Special instructions, contact, or guardian notes...',
    registerStudentBtn: 'Register Student',
    saveChangesBtn: 'Save Changes',
    keepDraftBtn: 'Close & Keep Draft',
    deleteStudentConfirmTitle: 'Delete Student',
    deleteStudentConfirmMsg: 'Are you sure you want to delete this student? This action cannot be undone.',
    bulkDeleteConfirmTitle: 'Delete Selected Students',
    bulkDeleteConfirmMsg: 'Are you sure you want to delete the selected students?',
    deleteAllConfirmTitle: 'Delete All Students',
    deleteAllConfirmMsg: 'Are you sure you want to delete all students from the roster?',

    // Daily Feeding Form
    feedingReportTitle: 'Daily Feeding Report',
    feedingReportSubtitle: 'Fill in coordinator details, food supply, participant count, and activity schedule.',
    reportDateLabel: 'Report Date *',
    changeDateBtn: 'Change',
    coordinatorNameLabel: 'Duty Coordinator Name *',
    coordinatorPlaceholder: 'e.g. Mrs. Almaz or Mr. Tadesse',
    foodTypeLabel: 'Food Type *',
    foodTypePlaceholder: 'e.g. Bread with milk, Injera with Shiro, Pasta',
    feedingLocationLabel: 'Feeding Location *',
    feedingLocationPlaceholder: 'e.g. Main Dining Hall / School Compound',
    childrenCountLabel: 'Number of Children Fed',
    volunteersCountLabel: 'Volunteers / Servers Count *',
    activityOptionLabel: 'Educational or Game Activity Option *',
    activityLesson: '1. Lesson (ትምህርት)',
    activityLessonDesc: 'Teaching / study session',
    activityGame: '2. Game (ጨዋታ)',
    activityGameDesc: 'Organized play & recreational activities',
    activityNone: '3. None (ምንም)',
    activityNoneDesc: 'No activity conducted',
    activityScheduleTitle: 'Feeding Activity Schedule',
    activityScheduleDesc: 'Select start and end times for each scheduled activity',
    manualTimeBtn: 'Manual Time',
    resetBtn: 'Reset',
    addRowBtn: 'Add Row',
    tableNo: 'No.',
    tableActivity: 'Activity',
    tableSchedule: 'Time Schedule',
    tableStart: 'Start',
    tableEnd: 'End',
    tableDuration: 'Duration',
    gapsChallengesLabel: 'Gaps, Challenges or Observations',
    gapsChallengesPlaceholder: 'Describe any shortages, problems or observations encountered today...',
    clearFormBtn: 'Clear Form',
    saveReportBtn: 'Save Report',
    feedingSavedSuccess: 'Feeding report saved successfully',

    // Reports Screen & History
    tabFeedingReport: 'Feeding Report',
    tabAttendanceReport: 'Attendance Report',
    tabReportHistory: 'Report History',
    tabExportReports: 'Export Reports',
    historyTitle: 'Report History',
    historySubtitle: 'Browse and review past attendance and feeding records.',
    selectDateRange: 'Select Date Range',
    dailyReports: 'Daily Reports',
    weeklyReports: 'Weekly Reports',
    monthlyReports: 'Monthly Reports',
    noReportsFound: 'No reports found for this period',
    printForm: 'Print Form',

    // Settings Screen
    settingsTitle: 'Settings & Preferences',
    languageSectionTitle: 'Language / ቋንቋ',
    languageSectionDesc: 'Select your preferred application language. Updates interface and reports immediately.',
    appearanceSectionTitle: 'Appearance & Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    schoolInfoSectionTitle: 'School & Class Information',
    classNameLabel: 'Class / Grade Name',
    classNamePlaceholder: 'e.g. Grade 4 - Section B',
    academicYearLabel: 'Academic Year',
    academicYearPlaceholder: 'e.g. 2026 - 2027',
    targetAttendanceLabel: 'Target Attendance Rate (%)',
    defaultStatusLabel: 'Default Status on New Day',
    backupSectionTitle: 'Data Management & Backup',
    backupSectionDesc: 'Export a secure JSON backup of your records or restore from a previous backup.',
    exportBackupBtn: 'Export JSON Backup',
    importBackupBtn: 'Restore from Backup',
    clearAllDataBtn: 'Clear All App Data',
    preferencesSavedToast: 'Preferences updated successfully',

    // Install Modal
    installModalTitle: 'Install RollCall App',
    installModalSubtitle: 'Standalone offline app for Android, Windows, Mac & iOS',
    oneClickInstallAvail: '1-Click Install Available',
    oneClickInstallDesc: 'Your device supports direct installation to home screen or desktop!',
    installAppAction: 'Install App',
    standaloneFeatureTitle: 'Standalone Native Application',
    standaloneFeatureDesc: 'Once installed, RollCall appears on your home screen or desktop with its own icon. It launches in full standalone mode without browser bars.',
    appWebLinkLabel: 'Application Web Link',
    openInNewTab: 'Open in new tab',
    installationStepsTitle: 'Installation Steps',
    tabAndroidMobile: 'Android / Chrome',
    tabDesktop: 'Desktop (PC/Mac)',
    tabIos: 'iPhone / iPad',
    step1Mobile: 'Open the link in Google Chrome on your Android phone.',
    step2Mobile: "Tap the three-dots menu (⋮) in the top-right corner of Chrome.",
    step3Mobile: "Select 'Install app' or 'Add to Home screen'.",
    step4Mobile: "Confirm 'Install'. RollCall will be added to your home screen and app drawer in standalone mode!",
    step1Desktop: 'Open the link on your computer in Google Chrome, Edge, or Brave.',
    step2Desktop: 'Click the install icon in the browser address bar, or open the browser menu.',
    step3Desktop: "Click 'Install'. A dedicated desktop window and app shortcut will be created!",
    step1Ios: 'Open the link in Safari on your iPhone or iPad.',
    step2Ios: "Tap the Share button at the bottom of the screen.",
    step3Ios: "Scroll down and tap 'Add to Home Screen', then tap 'Add' in the top right.",

    // Student Archiving & Details
    activeStudents: 'Active Students',
    archivedStudents: 'Archived Students',
    archiveStudent: 'Archive Student',
    unarchiveStudent: 'Restore Student',
    archiveConfirmTitle: 'Archive Student?',
    archiveConfirmMsg: 'This student will be moved to the archive and excluded from daily attendance, but past attendance records will be preserved.',
    archiveReasonLabel: 'Reason for Archiving (e.g., Transferred, Graduated, Withdrawn)',
    studentIdNumberLabel: 'Student ID Number',
    studentIdNumberPlaceholder: 'e.g. STU-2026-001',
    duplicateIdError: 'This Student ID is already assigned to another student.',
    filterArchived: 'Archived',
    noArchivedStudents: 'No archived students.',

    // Attendance Summary & Audit Trail
    attendanceSummaryTitle: 'Confirm Attendance Summary',
    attendanceSummaryDesc: "Please review the attendance breakdown before finalizing and saving today's record.",
    studentsMarkedPresent: 'Marked Present',
    studentsMarkedPermission: 'Marked Permission',
    studentsMarkedAbsent: 'Marked Absent (Auto)',
    studentsTotal: 'Total Students',
    confirmAndSaveAttendance: 'Confirm & Save Attendance',
    editSavedAttendanceTitle: 'Confirm Editing Saved Attendance',
    editSavedAttendanceWarning: 'You are modifying attendance for a previously recorded day. An audit entry will be logged.',
    editReasonLabel: 'Reason for Modification',
    editReasonPlaceholder: 'e.g., Medical excuse submitted, clerical correction...',
    attendanceAuditLogTitle: 'Modification History & Audit Log',
    noAuditLogs: 'No previous modifications logged for this date.',
    modifiedAtLabel: 'Modified at',
    modifiedByLabel: 'By',
    changeSummaryLabel: 'Changes',

    // Feeding Roster & Grade/Section
    filterGrade: 'Grade',
    allGrades: 'All Grades',
    filterSection: 'Section',
    allSections: 'All Sections',
    attendanceReport: 'Attendance Report',
    totalStudents: 'Total Students',
    selectGrade: 'Select Grade',
    selectSection: 'Select Section',
    trackIndividualStudents: 'Track Individual Student Roster',
    trackIndividualStudentsDesc: 'Check off students who received meals today to automatically calculate the total count.',
    allStudentsAte: 'Mark All as Fed',
    clearRoster: 'Clear Roster Selection',
    rosterStudentsFedCount: 'Students Checked',
    duplicateFeedingDateGradeSection: 'A feeding report for this date, grade, and section already exists. Saving will update it.',

    // Dashboard & Analytics
    gradeSectionBreakdown: 'Class & Section Summary',
    weeklyAttendanceTrend: 'Weekly Attendance Trend',
    monthlyComparison: 'Monthly Comparison',
    frequentAbsencesAlert: 'Chronic Absenteeism Alert',
    frequentAbsencesDesc: 'Active students with attendance rate below 80%',
    noFrequentAbsentees: 'All active students maintain good attendance (above 80%)!',
    absentDaysCount: 'absent days',
    recentActivity: 'Recent Activity',
    noRecentActivity: 'No recent attendance or feeding logs recorded yet.',
    attendanceSavedActivity: 'Attendance saved for',
    feedingSavedActivity: 'Feeding report saved for',
    onlineStatus: 'Online',
    offlineStatus: 'Offline (Saved locally)',

    // Reporting, Ethiopian Calendar & Backup
    termlyReport: 'Termly Report',
    annualReport: 'Annual Report',
    individualStudentReport: 'Student Attendance Profile',
    selectTerm: 'Select Term / Semester',
    schoolTerms: 'School Terms / Semesters',
    ethiopianHolidays: 'School Holidays',
    addHoliday: 'Add Holiday',
    holidayName: 'Holiday Name',
    holidayDate: 'Holiday Date',
    academicCalendarTitle: 'Ethiopian Academic Calendar',
    academicCalendarDesc: 'Manage semesters, terms, and holidays aligned with the Ethiopian calendar',
    backupHistory: 'Backup History',
    noBackupHistory: 'No backups created yet.',
    createdOn: 'Created on',
    backupSize: 'Items',
    storageNoticeTitle: 'Local Storage & Cloud Sync',
    storageNoticeDesc: "Data is securely stored in your browser's private local storage. For multi-device sync or permanent cloud storage, export regular JSON backups or connect cloud services.",
    preparedBy: 'Prepared by',
    verifiedBy: 'Verified / Approved by',
    signature: 'Signature',
    officialSchoolStamp: 'Official School Seal / Stamp',
    schoolNameLabel: 'School Name',
    schoolNamePlaceholder: 'e.g. Primary & Secondary School',
    enableLateStatusLabel: 'Enable Late Status (3-state attendance)',
  },

  am: {
    // Navigation & General
    navHome: 'መነሻ',
    navStudents: 'ተማሪዎች',
    navAttendance: 'አቴንዳንስ',
    navReports: 'ሪፖርቶች',
    navHistory: 'ታሪክ',
    navStats: 'ስታትስቲክስ',
    navSettings: 'ቅንብሮች',
    appTitle: 'ሮልኮል',
    appSubtitle: 'የተማሪዎች አቴንዳንስ እና የምገባ አስተዳደር',
    installApp: 'አፕ ጫን',
    switchDarkMode: 'ወደ ጨለማ ገጽታ ቀይር',
    switchLightMode: 'ወደ ብርሃን ገጽታ ቀይር',
    language: 'ቋንቋ',
    english: 'English (እንግሊዝኛ)',
    amharic: 'አማርኛ',

    // Common Actions
    save: 'መዝግብ',
    cancel: 'ሰርዝ',
    delete: 'አጥፋ',
    edit: 'አርትዕ',
    close: 'ዝጋ',
    done: 'ተጠናቀቀ',
    search: 'ፈልግ',
    clear: 'አጽዳ',
    filter: 'አጣራ',
    exportAction: 'አውርድ',
    importAction: 'አስገባ',
    download: 'አውርድ',
    add: 'አክል',
    resume: 'ረቂቅ ቀጥል',
    print: 'አትም',
    back: 'ተመለስ',
    copy: 'ሊንክ ቅዳ',
    copied: 'ተቀድቷል!',
    actions: 'ተግባራት',
    select: 'ምረጥ',
    selectAll: 'ሁሉንም ምረጥ',
    deselectAll: 'ምርጫን አጽዳ',
    deleteAll: 'ሁሉንም አጥፋ',
    reorder: 'ቅደም ተከተል ቀይር',
    or: 'ወይም',

    // Statuses
    present: 'ተገኝቷል',
    absent: 'ቀሪ',
    permission: 'ፈቃድ',
    late: 'ያረፈደ',
    unmarked: 'ያልተመዘገበ / ባዶ',
    blank: 'ባዶ',
    rate: 'መቶኛ',
    all: 'ሁሉም',
    recorded: 'ተመዝግቧል',
    notRecorded: 'አልተመዘገበም',
    logged: 'ተመዝግቧል',
    notLogged: 'አልተመዘገበም',
    ready: 'ዝግጁ',

    // Dashboard / Home
    greetingMorning: 'እንደምን አደሩ 👋',
    greetingAfternoon: 'እንደምን ዋሉ 👋',
    greetingEvening: 'እንደምን አመሹ 👋',
    teacherLabel: 'አስተማሪ',
    totalEnrolled: 'አጠቃላይ ተማሪዎች',
    activeMembers: 'የተመዘገቡ ተማሪዎች',
    presentToday: 'የዛሬ ተገኝተዋል',
    absentToday: 'የዛሬ ቀሪዎች',
    markedAbsent: 'ቀሪ የተደረጉ',
    feedingStatus: 'የምገባ ሁኔታ',
    childrenFed: 'የተመገቡ ህፃናት',
    todayAttendance: 'የዛሬ አቴንዳንስ',
    todayAttendanceDesc: 'የተማሪዎችን መገኘት፣ መቅረት እና የፈቃድ ሁኔታ መዝግብ።',
    viewRecord: 'መዝገብ ተመልከት',
    editAttendance: 'አቴንዳንስ አርትዕ',
    takeAttendance: 'አቴንዳንስ መዝግብ',
    dailyFeeding: 'የዕለት ምገባ ፕሮግራም',
    dailyFeedingDesc: 'የምግብ ዝግጅት፣ አስተባባሪ እና የተግባራት የጊዜ ሰሌዳ።',
    viewDetails: 'ዝርዝር ተመልከት',
    editReport: 'ሪፖርት አርትዕ',
    logFeeding: 'ምገባ መዝግብ',
    coordinator: 'ተረኛ አስተባባሪ',
    location: 'ቦታ',
    foodType: 'ምግብ',
    combinedReportTitle: 'የተሟላ የዕለት ሪፖርት ማውረጃ',
    combinedReportDesc: 'ክፍል 1 (አቴንዳንስ) እና ክፍል 2 (የዕለት ምገባ ከተግባራት ሰሌዳ ጋር) በአንድ ሰነድ።',
    downloadPdf: 'በፒዲኤፍ (PDF) አውርድ',
    downloadWord: 'በዎርድ (.docx) አውርድ',
    downloadExcel: 'በኤክሴል (.xlsx) አውርድ',
    quickActionFeedingLogs: 'የምገባ ታሪክ',
    quickActionFeedingDesc: 'የዕለት ምገባ፣ ተግባራት እና የአስተባባሪ መዛግብት',
    quickActionAttReports: 'የአቴንዳንስ ሪፖርቶች',
    quickActionAttDesc: 'የዕለት እና የሳምንት የአቴንዳንስ ዝርዝሮች',
    quickActionExportCenter: 'ሰነድ ማውረጃ',
    quickActionExportDesc: 'ሁሉንም ሰነዶች እና ሪፖርቶች ማውረጃ',

    // Attendance Screen
    attendanceTitle: 'የተማሪዎች አቴንዳንስ',
    studentsEnrolled: 'የተመዘገቡ ተማሪዎች',
    allPresent: 'ሁሉም ተገኝተዋል',
    clearAll: 'ሁሉንም አጽዳ',
    attendanceLiveStatus: 'የአቴንዳንስ የቀጥታ ሁኔታ (ባዶ = ቀሪ)',
    blankAbsentNotice: '(ባዶ / በነባሪ ቀሪ)',
    exportAttendanceReport: 'የአቴንዳንስ ሪፖርት አውርድ',
    addNotePlaceholder: 'ማስታወሻ ያስገቡ (የታመመ፣ የፈቃድ፣ ያረፈደ)...',
    clearNote: 'ማስታወሻ አጽዳ',
    tagSick: '+ታሟል',
    tagExcused: '+ፈቃድ',
    tagLate: '+ያረፈደ',
    tagAppointment: '+ቀጠሮ',
    draftSaved: 'ረቂቁ ተቀምጧል',
    discardDraft: 'ረቂቁን ሰርዝ',
    attendanceSavedSuccess: 'አቴንዳንስ በተሳካ ሁኔታ ተመዝግቧል',
    togglePresentTooltip: 'ተገኝቷል (ለመምረጥ ወይም ለመሰረዝ ይጫኑ)',
    togglePermissionTooltip: 'ፈቃድ (ለመምረጥ ወይም ለመሰረዝ ይጫኑ)',
    unmarkedFilter: 'ያልተመዘገበ / ባዶ',

    // Students Screen
    studentsTitle: 'የተማሪዎች መዝገብ',
    studentRoster: 'የተማሪዎች ዝርዝር',
    studentsSelected: 'ተማሪዎች ተመርጠዋል',
    addStudentBtn: 'አዲስ ተማሪ መዝግብ',
    importRosterBtn: 'ተማሪዎችን አስገባ',
    searchStudentsPlaceholder: 'ተማሪ በስም፣ በተራ ቁጥር፣ በክፍል ወይም በሴክሽን ፈልግ...',
    showingStudentsOf: 'የሚታዩ',
    clearSearch: 'ፍለጋ አጽዳ',
    noStudentsEnrolled: 'እስካሁን ምንም ተማሪ አልተመዘገበም',
    noStudentsEnrolledDesc: 'አቴንዳንስ መመዝገብ ለመጀመር ተማሪዎችን በእጅ ያስገቡ ወይም ከኤክሴል (.xlsx / .csv) ፋይል ያስመጡ።',
    addStudentManually: '+ ተማሪዎችን በእጅ መዝግብ',
    loadDemoRoster: 'የናሙና መረጃዎችን ጫን',
    reorderActiveNotice: 'የቅደም ተከተል መቀየሪያ ክፍት ነው። ፍላጾችን በመጠቀም ቦታ ቀይር።',

    // Student Modals
    addNewStudentTitle: 'አዲስ ተማሪ መዝግብ',
    editStudentTitle: 'የተማሪ መረጃ አርትዕ',
    draftAutoSavedNotice: 'ለውጦች በራስ-ሰር በረቂቅ ይቀመጣሉ',
    rollNumberLabel: 'ተ.ቁ',
    fullNameLabel: 'የተማሪው ሙሉ ስም *',
    fullNamePlaceholder: 'ለምሳሌ፡ አበበ ከበደ',
    gradeLabel: 'ክፍል',
    gradePlaceholder: 'ለምሳሌ፡ 4ኛ ክፍል',
    sectionLabel: 'ሴክሽን',
    sectionPlaceholder: 'ለምሳሌ፡ ሀ',
    notesLabel: 'ማስታወሻ (አማራጭ)',
    notesPlaceholder: 'ልዩ መመሪያ፣ አድራሻ ወይም የአሳዳጊ መረጃ...',
    registerStudentBtn: 'ተማሪውን መዝግብ',
    saveChangesBtn: 'ለውጦችን መዝግብ',
    keepDraftBtn: 'ረቂቁን አስቀምጠህ ዝጋ',
    deleteStudentConfirmTitle: 'ተማሪውን አጥፋ',
    deleteStudentConfirmMsg: 'ይህን ተማሪ ከመዝገብ ለማጥፋት እርግጠኛ ነዎት? ይህ እርምጃ ሊቀለበስ አይችልም።',
    bulkDeleteConfirmTitle: 'የተመረጡትን ተማሪዎች አጥፋ',
    bulkDeleteConfirmMsg: 'የተመረጡትን ተማሪዎች በሙሉ ለማጥፋት እርግጠኛ ነዎት?',
    deleteAllConfirmTitle: 'ሁሉንም ተማሪዎች አጥፋ',
    deleteAllConfirmMsg: 'በመዝገቡ ውስጥ ያሉትን ሁሉንም ተማሪዎች ለማጥፋት እርግጠኛ ነዎት?',

    // Daily Feeding Form
    feedingReportTitle: 'የዕለት ምገባ ሪፖርት',
    feedingReportSubtitle: 'የአስተባባሪ መረጃ፣ የምግብ አይነት፣ የተሳታፊዎች ቁጥር እና የተግባራት ሰሌዳ ይሙሉ',
    reportDateLabel: 'የሪፖርቱ ቀን *',
    changeDateBtn: 'ቀይር',
    coordinatorNameLabel: 'የዕለቱ ተረኛ አስተባባሪ *',
    coordinatorPlaceholder: 'ለምሳሌ፡ ወ/ሮ አልማዝ ወይም አቶ ታደሰ',
    foodTypeLabel: 'የምግቡ አይነት *',
    foodTypePlaceholder: 'ለምሳሌ፡ ዳቦ በወተት፣ እንጀራ በሽሮ፣ ፓስታ',
    feedingLocationLabel: 'ምገባው የተከናወነበት ቦታ *',
    feedingLocationPlaceholder: 'ለምሳሌ፡ ማዕከል አዳራሽ / ትምህርት ቤት ቅጥር ግቢ',
    childrenCountLabel: 'የተመገቡ ህፃናት ቁጥር *',
    volunteersCountLabel: 'የተሳተፉ አገልጋዮች ቁጥር *',
    activityOptionLabel: 'የዕለቱ የትምህርት ወይም የጨዋታ ምርጫ *',
    activityLesson: '1. ትምህርት (Lesson)',
    activityLessonDesc: 'የትምህርት ክፍለ-ጊዜ',
    activityGame: '2. ጨዋታ (Game)',
    activityGameDesc: 'የጨዋታ ክፍለ-ጊዜ',
    activityNone: '3. ምንም (Nothing)',
    activityNoneDesc: 'ምንም አልተከናወነም',
    activityScheduleTitle: 'የምገባ ተግባራት እና የጊዜ ሰሌዳ',
    activityScheduleDesc: 'የእያንዳንዱን ተግባር መጀመሪያ እና ማብቂያ ሰዓት ይምረጡ',
    manualTimeBtn: 'ሰዓት በእጅ አስገባ',
    resetBtn: 'ዳግም ጀምር',
    addRowBtn: 'ረድፍ ጨምር',
    tableNo: 'ተ.ቁ',
    tableActivity: 'ተግባር',
    tableSchedule: 'የጊዜ ሰሌዳ',
    tableStart: 'ተጀመረ',
    tableEnd: 'አለቀ',
    tableDuration: 'ቆይታ',
    gapsChallengesLabel: 'በዕለቱ የተፈጠሩ ክፍተቶች ወይም ተግዳሮቶች',
    gapsChallengesPlaceholder: 'በዕለቱ ያጋጠሙ ክፍተቶች፣ እጥረቶች ወይም ተግዳሮቶች ካሉ እዚህ ይግለጹ...',
    clearFormBtn: 'ቅጹን አጽዳ',
    saveReportBtn: 'ሪፖርት መዝግብ',
    feedingSavedSuccess: 'የምገባ ሪፖርት በተሳካ ሁኔታ ተመዝግቧል',

    // Reports Screen & History
    tabFeedingReport: 'የዕለት ምገባ',
    tabAttendanceReport: 'የተማሪዎች አቴንዳንስ',
    tabReportHistory: 'የሪፖርቶች ታሪክ',
    tabExportReports: 'ሪፖርት ማውረጃ',
    historyTitle: 'የሪፖርቶች ታሪክ',
    historySubtitle: 'ያለፉትን የአቴንዳንስ እና የምገባ መዛግብት ይመልከቱ እና ያውርዱ።',
    selectDateRange: 'የቀን ክልል ይምረጡ',
    dailyReports: 'የዕለት ሪፖርቶች',
    weeklyReports: 'የሳምንት ሪፖርቶች',
    monthlyReports: 'የወር ሪፖርቶች',
    noReportsFound: 'ለዚህ ጊዜ የተመዘገበ ሪፖርት አልተገኘም',
    printForm: 'ቅጹን አትም',

    // Settings Screen
    settingsTitle: 'ቅንብሮች እና ምርጫዎች',
    languageSectionTitle: 'የቋንቋ ምርጫ (Language)',
    languageSectionDesc: 'የሚፈልጉትን ቋንቋ ይምረጡ። አጠቃላይ ስርዓቱ እና ሪፖርቶች ወዲያውኑ ይቀየራሉ።',
    appearanceSectionTitle: 'የገጽታ ቀለም እና ቅርጽ',
    themeLight: 'ብርሃን',
    themeDark: 'ጨለማ',
    themeSystem: 'የስልክ ነባሪ',
    schoolInfoSectionTitle: 'የትምህርት ቤት እና የክፍል መረጃ',
    classNameLabel: 'የክፍል መጠሪያ',
    classNamePlaceholder: 'ለምሳሌ፡ 4ኛ ክፍል - ሴክሽን ለ',
    academicYearLabel: 'የትምህርት ዘመን',
    academicYearPlaceholder: 'ለምሳሌ፡ 2018 - 2019',
    targetAttendanceLabel: 'የታለመ የአቴንዳንስ መቶኛ (%)',
    defaultStatusLabel: 'በአዲስ ቀን ነባሪ ሁኔታ',
    backupSectionTitle: 'የመረጃ ደህንነት እና ባክአፕ',
    backupSectionDesc: 'የተመዘገቡ መረጃዎችን በJSON ፋይል አውርደው ያስቀምጡ ወይም ቀደም ሲል ከተቀመጠ ፋይል ይመልሱ።',
    exportBackupBtn: 'ባክአፕ ፋይል አውርድ',
    importBackupBtn: 'ከባክአፕ መልስ',
    clearAllDataBtn: 'ሁሉንም መረጃዎች አጥፋ',
    preferencesSavedToast: 'ቅንብሮች በተሳካ ሁኔታ ተቀይረዋል',

    // Install Modal
    installModalTitle: 'ሮልኮል አፕን ይጫኑ (Install)',
    installModalSubtitle: 'ያለ ኢንተርኔት በራሱ የሚሰራ አፕ ለAndroid፣ Windows፣ Mac እና iOS',
    oneClickInstallAvail: 'በ1-ክሊክ መጫን ይቻላል',
    oneClickInstallDesc: 'ስልክዎ በቀጥታ ወደ መነሻ ገጽ (Home Screen) ለመጫን ዝግጁ ነው!',
    installAppAction: 'አፕ ጫን / Install',
    standaloneFeatureTitle: 'ራሱን የቻለ አፕ (Standalone Application)',
    standaloneFeatureDesc: 'አንዴ ከተጫነ በስልክዎ መነሻ ገጽ ላይ እንደ ማንኛውም አፕ በራሱ አርማ ይቀመጣል። ብሮውዘር መክፈት ሳያስፈልግዎት በቀጥታ ይከፈታል።',
    appWebLinkLabel: 'የአፑ ትክክለኛ የድረ-ገጽ ሊንክ',
    openInNewTab: 'በአዲስ መስኮት ክፈት',
    installationStepsTitle: 'የመጫኛ መመሪያዎች',
    tabAndroidMobile: 'Android / Chrome',
    tabDesktop: 'Desktop (ኮምፒውተር)',
    tabIos: 'iPhone / iPad',
    step1Mobile: 'ሊንኩን በአንድሮይድ ስልክዎ ላይ በGoogle Chrome ብሮውዘር ይክፈቱ።',
    step2Mobile: 'በChrome ላይ ከላይ ወይም ከታች በስተቀኝ ያሉትን ባለ ሶስት ነጥቦች (⋮) ይጫኑ።',
    step3Mobile: "ከሚመጡት ዝርዝሮች ውስጥ 'Install app' ወይም 'Add to Home screen (ወደ መነሻ ገጽ አክል)' የሚለውን ይምረጡ።",
    step4Mobile: "'Install' የሚለውን ያረጋግጡ። የሮልኮል አርማ በስልክዎ መተግበሪያዎች ዝርዝር ውስጥ እንደ ራሱን የቻለ አፕ ይቀመጣል!",
    step1Desktop: 'ሊንኩን በኮምፒውተርዎ ላይ በGoogle Chrome፣ Edge ወይም Brave ይክፈቱ።',
    step2Desktop: 'በአድራሻ መጻፊያው (Address bar) ላይ ያለውን የመጫኛ ምልክት ይጫኑ ወይም ሜኑውን ይክፈቱ።',
    step3Desktop: "'Install' የሚለውን ይጫኑ። ራሱን የቻለ የዴስክቶፕ መስኮት እና አቋራጭ ይፈጠራል!",
    step1Ios: 'ሊንኩን በiPhone ወይም iPad ላይ በSafari ብሮውዘር ይክፈቱ።',
    step2Ios: "ከስክሪኑ ግርጌ ያለውን የማጋሪያ (Share) ምልክት ይጫኑ።",
    step3Ios: "ወደ ታች ዝቅ ብለው 'Add to Home Screen' የሚለውን ይምረጡና 'Add' የሚለውን ይጫኑ።",

    // Student Archiving & Details
    activeStudents: 'ንቁ ተማሪዎች',
    archivedStudents: 'የተዘጉ / ማህደር ተማሪዎች',
    archiveStudent: 'ተማሪውን አግልል / አስቀምጥ',
    unarchiveStudent: 'ተማሪውን መልስ',
    archiveConfirmTitle: 'ተማሪውን ማግለል ይፈልጋሉ?',
    archiveConfirmMsg: 'ይህ ተማሪ ወደ ማህደር ይዛወራል፤ ከዕለት ተሰብሳቢዎች ውጪ ይሆናል ነገር ግን ያለፈው ታሪካቸው ሙሉ በሙሉ ይቆያል።',
    archiveReasonLabel: 'የማግለል ምክንያት (ለምሳሌ፡ ወደ ሌላ ት/ቤት የተዛወረ፣ የተመረቀ፣ ያቋረጠ)',
    studentIdNumberLabel: 'የተማሪ መታወቂያ ቁጥር',
    studentIdNumberPlaceholder: 'ለምሳሌ፡ STU-2026-001',
    duplicateIdError: 'ይህ የተማሪ መታወቂያ ቁጥር ለሌላ ተማሪ ተመድቧል።',
    filterArchived: 'የተዘጉ',
    noArchivedStudents: 'ምንም የተዘጉ ተማሪዎች የሉም።',

    // Attendance Summary & Audit Trail
    attendanceSummaryTitle: 'የተሰብሳቢዎች ማጠቃለያ ማረጋገጫ',
    attendanceSummaryDesc: 'እባክዎን የዕለቱን መዝገብ ከመመዝገብዎ በፊት የተሰብሳቢዎችን ማጠቃለያ ይገምግሙ።',
    studentsMarkedPresent: 'የተገኙ',
    studentsMarkedPermission: 'የፈቀዱ',
    studentsMarkedAbsent: 'ቀሪ (በራስ-ሰር)',
    studentsTotal: 'ጠቅላላ ተማሪዎች',
    confirmAndSaveAttendance: 'አረጋግጥና አስቀምጥ',
    editSavedAttendanceTitle: 'የተቀመጠ የተሰብሳቢዎች መዝገብ ማስተካከል',
    editSavedAttendanceWarning: 'ቀደም ሲል የተመዘገበ ዕለት እያስተካከሉ ነው። የማስተካከያ ታሪክ ይመዘገባል።',
    editReasonLabel: 'የማስተካከያ ምክንያት (አማራጭ)',
    editReasonPlaceholder: 'ለምሳሌ፡ የህክምና ፈቃድ ቀርቧል፣ የስህተት ማስተካከያ...',
    attendanceAuditLogTitle: 'የማስተካከያ ታሪክ (Audit Log)',
    noAuditLogs: 'ለዚህ ቀን ምንም ማስተካከያ አልተደረገም።',
    modifiedAtLabel: 'የተስተካከለበት ሰዓት',
    modifiedByLabel: 'በ',
    changeSummaryLabel: 'ለውጦች',

    // Feeding Roster & Grade/Section
    filterGrade: 'ክፍል',
    allGrades: 'ሁሉም ክፍሎች',
    filterSection: 'ሴክሽን',
    allSections: 'ሁሉም ሴክሽኖች',
    attendanceReport: 'የአቴንዳንስ ሪፖርት',
    totalStudents: 'ጠቅላላ ተማሪዎች',
    selectGrade: 'ክፍል ይምረጡ',
    selectSection: 'ክፍል ቡድን ይምረጡ',
    trackIndividualStudents: 'የግለሰብ ተማሪዎች የምግብ ተሳትፎ ዝርዝር',
    trackIndividualStudentsDesc: 'ምግብ የተቀበሉ ተማሪዎችን ምልክት በማድረግ ጠቅላላውን ቁጥር በራስ-ሰር አስላ።',
    allStudentsAte: 'ሁሉንም እንደተመገቡ መዝግብ',
    clearRoster: 'የተማሪዎችን ምርጫ አጽዳ',
    rosterStudentsFedCount: 'የተመረጡ ተማሪዎች',
    duplicateFeedingDateGradeSection: 'ለዚህ ቀን፣ ክፍልና ቡድን የተመዘገበ የምግብ ሪፖርት አለ። ማስቀመጥ ይዘምነዋል።',

    // Dashboard & Analytics
    gradeSectionBreakdown: 'የክፍል እና ቡድን ማጠቃለያ',
    weeklyAttendanceTrend: 'የሳምንቱ የተሰብሳቢዎች አዝማሚያ',
    monthlyComparison: 'የወራት ንጽጽር',
    frequentAbsencesAlert: 'ተደጋጋሚ ቀሪዎች ማንቂያ',
    frequentAbsencesDesc: 'የተሰብሳቢነት ምጣኔያቸው ከ 80% በታች የሆኑ ንቁ ተማሪዎች',
    noFrequentAbsentees: 'ሁሉም ንቁ ተማሪዎች ከ 80% በላይ የተሰብሳቢነት ምጣኔ አላቸው!',
    absentDaysCount: 'ቀናት ቀርተዋል',
    recentActivity: 'የቅርብ ጊዜ እንቅስቃሴዎች',
    noRecentActivity: 'እስካሁን የተመዘገበ የቅርብ ጊዜ መዝገብ የለም።',
    attendanceSavedActivity: 'የተሰብሳቢዎች መዝገብ ተቀምጧል ለ',
    feedingSavedActivity: 'የምግብ ሪፖርት ተቀምጧል ለ',
    onlineStatus: 'በመስመር ላይ',
    offlineStatus: 'ከመስመር ውጭ (በስልክዎ ተቀምጧል)',

    // Reporting, Ethiopian Calendar & Backup
    termlyReport: 'የሩብ ዓመት / የሴሚስተር ሪፖርት',
    annualReport: 'የዓመቱ ማጠቃለያ ሪፖርት',
    individualStudentReport: 'የግል ተማሪ የተሰብሳቢነት ማጠቃለያ',
    selectTerm: 'ሴሚስተር / ሩብ ዓመት ይምረጡ',
    schoolTerms: 'የትምህርት ሴሚስተሮች',
    ethiopianHolidays: 'የትምህርት ቤት በዓላትና እረፍቶች',
    addHoliday: 'በዓል ጨምር',
    holidayName: 'የበዓሉ ስም',
    holidayDate: 'የበዓሉ ቀን',
    academicCalendarTitle: 'የኢትዮጵያ የትምህርት ካላንደር',
    academicCalendarDesc: 'ከኢትዮጵያ ካላንደር ጋር የተጣጣሙ ሴሚስተሮችንና የበዓል ቀናትን ያስተካክሉ',
    backupHistory: 'የቀደምት መጠባበቂያዎች ታሪክ',
    noBackupHistory: 'እስካሁን የተወሰደ መጠባበቂያ የለም።',
    createdOn: 'የተፈጠረበት ቀን',
    backupSize: 'መረጃዎች',
    storageNoticeTitle: 'የስልክ መረጃ አቀማመጥ እና የደመና ማመሳሰል',
    storageNoticeDesc: 'መረጃዎ በደህና በብሮውዘርዎ ውስጣዊ ማከማቻ ውስጥ ተቀምጧል። በሌሎች ስልኮች ለመጠቀም ወይም ዘላቂ መጠባበቂያ ለማስቀመጥ የ JSON ፋይል ያውርዱ።',
    preparedBy: 'ያዘጋጀው',
    verifiedBy: 'ያረጋገጠው / የፈቀደው',
    signature: 'ፊርማ',
    officialSchoolStamp: 'የትምህርት ቤቱ ማህተም',
    schoolNameLabel: 'የትምህርት ቤቱ ስም',
    schoolNamePlaceholder: 'ለምሳሌ፡ አዲስ አበባ የመጀመሪያ ደረጃ ት/ቤት',
    enableLateStatusLabel: 'ዘግይቶ መምጣትን አብራ (3-ሁኔታ አቴንዳንስ)',
  },
};

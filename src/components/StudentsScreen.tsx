import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Student, DayAttendance, StudentDraftPayload } from '../types.ts';
import {
  formatRollNumber,
  calculateStudentStats,
  exportStudentsToCSV,
  parseStudentsFromCSV,
} from '../utils/attendance.ts';
import {
  saveStudentAddDraft,
  getStudentAddDraft,
  clearStudentAddDraft,
  hasStudentAddDraft,
  saveStudentEditDraft,
  getStudentEditDraft,
  clearStudentEditDraft,
  formatLastSaved,
} from '../utils/draftStorage.ts';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  ArrowUpDown,
  Download,
  Upload,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  MinusSquare,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Info,
  RotateCcw,
} from 'lucide-react';
import { StudentDetailModal } from './StudentDetailModal.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import { useTranslation } from '../i18n/LanguageContext.tsx';

interface StudentsScreenProps {
  students: Student[];
  attendanceHistory: DayAttendance[];
  settings?: import('../types.ts').AppSettings;
  onAddStudent: (
    name: string,
    rollNumber?: number,
    extra?: { gender?: string; grade?: string; section?: string; notes?: string; studentIdNumber?: string }
  ) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteMultipleStudents?: (ids: string[]) => void;
  onDeleteAllStudents?: () => void;
  onArchiveStudent?: (id: string, reason?: string) => void;
  onUnarchiveStudent?: (id: string) => void;
  onReorderStudents: (students: Student[]) => void;
  onImportStudents: (students: Student[]) => void;
  onOpenExcelImport: () => void;
  onShowToast: (message: string) => void;
}

type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

export const StudentsScreen: React.FC<StudentsScreenProps> = ({
  students,
  attendanceHistory,
  settings,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onDeleteMultipleStudents,
  onDeleteAllStudents,
  onArchiveStudent,
  onUnarchiveStudent,
  onReorderStudents,
  onImportStudents,
  onOpenExcelImport,
  onShowToast,
}) => {
  const { t, language } = useTranslation();
  const isAm = language === 'am';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  // -------------------------------------------------------------
  // 1. SELECTION STATE
  // -------------------------------------------------------------
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // -------------------------------------------------------------
  // 2. DRAFT STATE & REFS
  // -------------------------------------------------------------
  const [statusTab, setStatusTab] = useState<'active' | 'archived'>('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentIdNumber, setNewStudentIdNumber] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState<number>(() => {
    const maxRoll = students.reduce((max, s) => Math.max(max, s.rollNumber), 0);
    return maxRoll + 1;
  });
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentSection, setNewStudentSection] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');
  const [idError, setIdError] = useState<string | null>(null);

  // Draft indicator for Add Modal
  const [addDraftStatus, setAddDraftStatus] = useState<DraftStatus>('idle');
  const [addDraftLastSaved, setAddDraftLastSaved] = useState<number>(0);
  const [hasSavedAddDraftState, setHasSavedAddDraftState] = useState<boolean>(() => hasStudentAddDraft());
  const [activeAddDraftPreview, setActiveAddDraftPreview] = useState<StudentDraftPayload | null>(() => getStudentAddDraft());
  const addDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Edit Modal state & drafts
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editStudentIdNumber, setEditStudentIdNumber] = useState('');
  const [editRoll, setEditRoll] = useState<number>(1);
  const [editGrade, setEditGrade] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDraftStatus, setEditDraftStatus] = useState<DraftStatus>('idle');
  const [editDraftLastSaved, setEditDraftLastSaved] = useState<number>(0);
  const editDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Discard draft confirmation modal
  const [isDiscardDraftModalOpen, setIsDiscardDraftModalOpen] = useState(false);

  // -------------------------------------------------------------
  // 3. DELETION MODALS & STATE
  // -------------------------------------------------------------
  // Single student deletion
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Bulk delete confirmation modal
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Delete all: two-step confirmation ('closed' | 'step1' | 'step2')
  const [deleteAllStep, setDeleteAllStep] = useState<'closed' | 'step1' | 'step2'>('closed');

  // Deletion guard against double-clicks
  const [isDeleting, setIsDeleting] = useState(false);

  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false);

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');

  // Next suggested roll number
  const nextRollNumber = useMemo(() => {
    const max = students.reduce((acc, s) => Math.max(acc, s.rollNumber), 0);
    return max + 1;
  }, [students]);

  // Refresh saved draft info from storage
  const syncDraftState = useCallback(() => {
    const draft = getStudentAddDraft();
    const hasDraft = hasStudentAddDraft();
    setHasSavedAddDraftState(hasDraft);
    setActiveAddDraftPreview(draft);
    if (draft) {
      setAddDraftLastSaved(draft.updatedAt);
    }
  }, []);

  useEffect(() => {
    syncDraftState();
  }, [syncDraftState]);

  // -------------------------------------------------------------
  // 4. FILTERING & SEARCH
  // -------------------------------------------------------------
  const activeCount = useMemo(() => students.filter((s) => !s.isArchived).length, [students]);
  const archivedCount = useMemo(() => students.filter((s) => !!s.isArchived).length, [students]);

  const filteredStudents = useMemo(() => {
    // Filter by active vs archived tab
    let list = students.filter((s) => (statusTab === 'active' ? !s.isArchived : !!s.isArchived));

    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery) return list;

    const cleanQuery = rawQuery.startsWith('#') ? rawQuery.slice(1).trim() : rawQuery;
    const tokens = cleanQuery.split(/\s+/).filter(Boolean);

    return list.filter((s) => {
      const studentName = s.name.toLowerCase();
      const rawRoll = s.rollNumber.toString();
      const formattedRoll = formatRollNumber(s.rollNumber).toLowerCase();
      const twoDigitRoll = s.rollNumber < 10 ? `0${s.rollNumber}` : rawRoll;
      const gradeStr = (s.grade || '').toLowerCase();
      const sectionStr = (s.section || '').toLowerCase();
      const idStr = (s.studentIdNumber || '').toLowerCase();

      return tokens.every(
        (token) =>
          studentName.includes(token) ||
          rawRoll === token ||
          rawRoll.includes(token) ||
          formattedRoll.includes(token) ||
          twoDigitRoll.includes(token) ||
          gradeStr.includes(token) ||
          sectionStr.includes(token) ||
          idStr.includes(token)
      );
    });
  }, [students, searchQuery, statusTab]);

  // Selection computed states
  const filteredStudentIds = useMemo(() => filteredStudents.map((s) => s.id), [filteredStudents]);
  const selectedFilteredCount = useMemo(() => {
    return filteredStudentIds.filter((id) => selectedStudentIds.has(id)).length;
  }, [filteredStudentIds, selectedStudentIds]);

  const isAllSelected = filteredStudents.length > 0 && selectedFilteredCount === filteredStudents.length;
  const isPartiallySelected = selectedFilteredCount > 0 && !isAllSelected;

  // Toggle selection for all filtered students
  const handleToggleSelectAll = () => {
    const next = new Set(selectedStudentIds);
    if (isAllSelected) {
      // Deselect all currently filtered students
      filteredStudentIds.forEach((id) => next.delete(id));
    } else {
      // Select all currently filtered students
      filteredStudentIds.forEach((id) => next.add(id));
    }
    setSelectedStudentIds(next);
  };

  // Toggle selection for a single student
  const handleToggleSelectStudent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  // -------------------------------------------------------------
  // 5. DRAFT AUTO-SAVING LOGIC
  // -------------------------------------------------------------
  // Add Student Draft auto-saver
  const triggerSaveAddDraft = useCallback(
    (name: string, roll: number, grade: string, section: string, notes: string) => {
      if (addDebounceTimer.current) {
        clearTimeout(addDebounceTimer.current);
      }

      const hasContent = Boolean(name.trim() || grade.trim() || section.trim() || notes.trim());
      if (!hasContent) {
        setAddDraftStatus('idle');
        return;
      }

      setAddDraftStatus('saving');
      addDebounceTimer.current = setTimeout(() => {
        const ok = saveStudentAddDraft({
          name,
          rollNumber: roll,
          grade: grade.trim() || undefined,
          section: section.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        if (ok) {
          const now = Date.now();
          setAddDraftStatus('saved');
          setAddDraftLastSaved(now);
          setHasSavedAddDraftState(true);
          setActiveAddDraftPreview({
            name,
            rollNumber: roll,
            grade,
            section,
            notes,
            editingStudentId: null,
            updatedAt: now,
          });
        } else {
          setAddDraftStatus('error');
        }
      }, 350);
    },
    []
  );

  // Edit Student Draft auto-saver
  const triggerSaveEditDraft = useCallback(
    (studentId: string, name: string, roll: number, grade: string, section: string, notes: string) => {
      if (!studentId) return;
      if (editDebounceTimer.current) {
        clearTimeout(editDebounceTimer.current);
      }

      setEditDraftStatus('saving');
      editDebounceTimer.current = setTimeout(() => {
        const ok = saveStudentEditDraft(studentId, {
          name,
          rollNumber: roll,
          grade: grade.trim() || undefined,
          section: section.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        if (ok) {
          setEditDraftStatus('saved');
          setEditDraftLastSaved(Date.now());
        } else {
          setEditDraftStatus('error');
        }
      }, 350);
    },
    []
  );

  // Flush draft save on window unload / navigation away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAddModalOpen && (newStudentName.trim() || newStudentNotes.trim())) {
        saveStudentAddDraft({
          name: newStudentName,
          rollNumber: newStudentRoll,
          grade: newStudentGrade.trim() || undefined,
          section: newStudentSection.trim() || undefined,
          notes: newStudentNotes.trim() || undefined,
        });
      }
      if (editingStudent && editName.trim()) {
        saveStudentEditDraft(editingStudent.id, {
          name: editName,
          rollNumber: editRoll,
          grade: editGrade.trim() || undefined,
          section: editSection.trim() || undefined,
          notes: editNotes.trim() || undefined,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [
    isAddModalOpen,
    newStudentName,
    newStudentRoll,
    newStudentGrade,
    newStudentSection,
    newStudentNotes,
    editingStudent,
    editName,
    editRoll,
    editGrade,
    editSection,
    editNotes,
  ]);

  // -------------------------------------------------------------
  // 6. ADD & EDIT MODAL HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddModal = (forceNew: boolean = false) => {
    const draft = !forceNew ? getStudentAddDraft() : null;

    if (draft && !forceNew) {
      setNewStudentName(draft.name || '');
      setNewStudentRoll(draft.rollNumber || nextRollNumber);
      setNewStudentGrade(draft.grade || '');
      setNewStudentSection(draft.section || '');
      setNewStudentNotes(draft.notes || '');
      setAddDraftStatus('saved');
      setAddDraftLastSaved(draft.updatedAt || Date.now());
    } else {
      setNewStudentName('');
      setNewStudentRoll(nextRollNumber);
      setNewStudentGrade('');
      setNewStudentSection('');
      setNewStudentNotes('');
      setAddDraftStatus('idle');
    }

    setIsAddModalOpen(true);
  };

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newStudentName.trim();
    if (!cleanName) return;

    // Check duplicate ID number if provided
    const cleanId = newStudentIdNumber.trim();
    if (cleanId) {
      const existingId = students.find((s) => s.studentIdNumber?.toLowerCase() === cleanId.toLowerCase());
      if (existingId) {
        setIdError(t.duplicateIdError);
        return;
      }
    }
    setIdError(null);

    // Auto-adjust roll number if already taken
    let targetRoll = newStudentRoll;
    const existingRoll = students.find((s) => s.rollNumber === targetRoll);
    if (existingRoll) {
      targetRoll = nextRollNumber;
    }

    onAddStudent(cleanName, targetRoll, {
      studentIdNumber: cleanId || undefined,
      grade: newStudentGrade.trim() || undefined,
      section: newStudentSection.trim() || undefined,
      notes: newStudentNotes.trim() || undefined,
    });

    // Finalized! Clear draft
    clearStudentAddDraft();
    setHasSavedAddDraftState(false);
    setActiveAddDraftPreview(null);
    setAddDraftStatus('idle');
    setNewStudentIdNumber('');
    setIsAddModalOpen(false);
    onShowToast(`Student "${cleanName}" registered successfully`);
  };

  // Discard Add Draft
  const handleDiscardAddDraft = () => {
    clearStudentAddDraft();
    setHasSavedAddDraftState(false);
    setActiveAddDraftPreview(null);
    setAddDraftStatus('idle');
    setNewStudentName('');
    setNewStudentIdNumber('');
    setNewStudentRoll(nextRollNumber);
    setNewStudentGrade('');
    setNewStudentSection('');
    setNewStudentNotes('');
    setIdError(null);
    setIsDiscardDraftModalOpen(false);
    onShowToast('Draft discarded / ረቂቁ ተሰርዟል');
  };

  const handleOpenEditModal = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setIdError(null);

    // Check if an edit draft exists for this student
    const editDraft = getStudentEditDraft(student.id);
    if (editDraft) {
      setEditName(editDraft.name || student.name);
      setEditStudentIdNumber(student.studentIdNumber || '');
      setEditRoll(editDraft.rollNumber || student.rollNumber);
      setEditGrade(editDraft.grade || student.grade || '');
      setEditSection(editDraft.section || student.section || '');
      setEditNotes(editDraft.notes || student.notes || '');
      setEditDraftStatus('saved');
      setEditDraftLastSaved(editDraft.updatedAt);
    } else {
      setEditName(student.name);
      setEditStudentIdNumber(student.studentIdNumber || '');
      setEditRoll(student.rollNumber);
      setEditGrade(student.grade || '');
      setEditSection(student.section || '');
      setEditNotes(student.notes || '');
      setEditDraftStatus('idle');
    }

    setEditingStudent(student);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editName.trim()) return;

    const cleanId = editStudentIdNumber.trim();
    if (cleanId) {
      const existingId = students.find((s) => s.id !== editingStudent.id && s.studentIdNumber?.toLowerCase() === cleanId.toLowerCase());
      if (existingId) {
        setIdError(t.duplicateIdError);
        return;
      }
    }
    setIdError(null);

    onEditStudent({
      ...editingStudent,
      name: editName.trim(),
      rollNumber: editRoll,
      studentIdNumber: cleanId || undefined,
      grade: editGrade.trim() || undefined,
      section: editSection.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });

    // Clear edit draft upon finalization
    clearStudentEditDraft(editingStudent.id);
    setEditingStudent(null);
    onShowToast(`Student #${editRoll} updated / ተማሪው ተስተካክሏል`);
  };

  // -------------------------------------------------------------
  // 7. DELETION HANDLERS
  // -------------------------------------------------------------
  // Single delete
  const handleConfirmSingleDelete = () => {
    if (!studentToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      onDeleteStudent(studentToDelete.id);
      // Remove from selected set if present
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        next.delete(studentToDelete.id);
        return next;
      });
      // Clear any edit draft
      clearStudentEditDraft(studentToDelete.id);
      onShowToast(`Deleted student ${studentToDelete.name}`);
    } finally {
      setIsDeleting(false);
      setStudentToDelete(null);
    }
  };

  // Bulk delete selected students
  const handleConfirmBulkDelete = () => {
    if (selectedStudentIds.size === 0 || isDeleting) return;
    setIsDeleting(true);

    try {
      const idsToDelete = Array.from(selectedStudentIds);
      if (onDeleteMultipleStudents) {
        onDeleteMultipleStudents(idsToDelete);
      } else {
        idsToDelete.forEach((id) => onDeleteStudent(id));
      }

      // Clear any edit drafts for deleted students
      idsToDelete.forEach((id) => clearStudentEditDraft(id));

      onShowToast(`Deleted ${idsToDelete.length} selected students / ${idsToDelete.length} ተማሪዎች ተሰርዘዋል`);
      setSelectedStudentIds(new Set());
    } finally {
      setIsDeleting(false);
      setIsBulkDeleteModalOpen(false);
    }
  };

  // Delete All Step 1 -> Step 2
  const handleProceedDeleteAllStep2 = () => {
    setDeleteAllStep('step2');
  };

  // Delete All Step 2 -> Execute
  const handleConfirmDeleteAll = () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const count = students.length;
      if (onDeleteAllStudents) {
        onDeleteAllStudents();
      } else {
        students.forEach((s) => onDeleteStudent(s.id));
      }

      // Clear all selections and edit drafts
      setSelectedStudentIds(new Set());
      setDeleteAllStep('closed');
      onShowToast(`Deleted all ${count} students / ሁሉም ተማሪዎች ተሰርዘዋል`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Move up/down in reorder mode
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newStudents = [...students];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStudents.length) return;

    const temp = newStudents[index];
    newStudents[index] = newStudents[targetIndex];
    newStudents[targetIndex] = temp;

    const updated = newStudents.map((s, idx) => ({
      ...s,
      rollNumber: idx + 1,
    }));
    onReorderStudents(updated);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csv = exportStudentsToCSV(students);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-list-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Student CSV exported');
  };

  // Process CSV Import
  const handleProcessImport = () => {
    if (!importCsvText.trim()) return;
    const parsed = parseStudentsFromCSV(importCsvText);
    if (parsed.length === 0) {
      alert('No valid student names found in CSV.');
      return;
    }

    const importedStudents: Student[] = parsed.map((item, idx) => ({
      id: `student_import_${Date.now()}_${idx}`,
      rollNumber: item.rollNumber,
      name: item.name,
    }));

    onImportStudents(importedStudents);
    setIsImportModalOpen(false);
    setImportCsvText('');
    onShowToast(`Imported ${importedStudents.length} students`);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:block">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#263238] dark:text-[#F5F7FA] tracking-tight">
              {t.studentsTitle}
            </h1>
            <p className="text-xs font-semibold text-[#607D8B] dark:text-[#B0BEC5]">
              <span className="font-mono tabular-nums">{students.length}</span> {t.totalEnrolled}
              {selectedStudentIds.size > 0 && (
                <span className="ml-2 font-bold text-[#006064] dark:text-[#4DD0E1]">
                  • {selectedStudentIds.size} {t.studentsSelected}
                </span>
              )}
            </p>
          </div>

          {/* Quick Add button for mobile */}
          <div className="sm:hidden flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenAddModal(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#173B65] hover:bg-[#102a4a] text-white font-bold text-xs shadow-xs active:scale-95 transition"
              aria-label={t.addStudentBtn}
            >
              <UserPlus className="w-4 h-4 text-[#0D9488]" />
              <span>{t.add}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Select All Toggle Button */}
          {students.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                isAllSelected
                  ? 'bg-[#173B65] text-white border-[#173B65] shadow-xs'
                  : 'bg-white dark:bg-[#151F38] text-[#172235] dark:text-[#F8FAFC] border-[#E2E8F0] dark:border-[#2B3A67] hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D]'
              }`}
              title={isAllSelected ? t.deselectAll : t.selectAll}
              aria-label={isAllSelected ? t.deselectAll : t.selectAll}
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-[#0D9488]" />
              ) : isPartiallySelected ? (
                <MinusSquare className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
              ) : (
                <Square className="w-4 h-4 text-[#64748B]" />
              )}
              <span>{isAllSelected ? t.deselectAll : t.selectAll}</span>
            </button>
          )}

          {/* Delete Selected (Active when >= 1 selected) */}
          {selectedStudentIds.size > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DC5252] hover:bg-[#b93b3b] text-white font-bold text-xs shadow-xs active:scale-95 transition animate-in zoom-in-95 duration-150"
              title={`${t.delete} ${selectedStudentIds.size}`}
              aria-label={t.delete}
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.delete} ({selectedStudentIds.size})</span>
            </button>
          )}

          {/* Delete All (Available when students exist) */}
          {students.length > 0 && (
            <button
              type="button"
              onClick={() => setDeleteAllStep('step1')}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-[#DC5252] dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-900/60 transition"
              title={t.deleteAll}
              aria-label={t.deleteAll}
            >
              <Trash2 className="w-3.5 h-3.5 text-[#DC5252]" />
              <span className="hidden md:inline">{t.deleteAll}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={`p-2 rounded-xl border transition ${
              isReorderMode
                ? 'bg-[#173B65] text-white border-[#173B65]'
                : 'bg-white dark:bg-[#151F38] text-[#172235] dark:text-[#F8FAFC] border-[#E2E8F0] dark:border-[#2B3A67] hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D]'
            }`}
            title={t.reorder}
            aria-label={t.reorder}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-white dark:bg-[#151F38] text-[#172235] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#2B3A67] hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D] transition"
            title="CSV"
            aria-label="CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="p-2 rounded-xl bg-white dark:bg-[#151F38] text-[#172235] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#2B3A67] hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D] transition"
            title={t.importAction}
            aria-label={t.importAction}
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenExcelImport}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#0D9488]/10 dark:bg-[#1D2A4D] text-[#173B65] dark:text-[#2DD4BF] hover:bg-[#0D9488]/20 dark:hover:bg-[#1D2A4D]/80 font-bold text-xs uppercase tracking-wide border border-[#0D9488]/30 dark:border-[#2B3A67] active:scale-95 transition"
            title="Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal(false)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#173B65] hover:bg-[#102a4a] text-white font-bold text-xs uppercase tracking-wide shadow-xs active:scale-95 transition"
            aria-label={t.addStudentBtn}
          >
            <UserPlus className="w-4 h-4 text-[#0D9488]" />
            <span>{t.addStudentBtn}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* UNFINISHED DRAFT BANNER (Shows when an auto-saved draft exists) */}
      {/* ------------------------------------------------------------- */}
      {hasSavedAddDraftState && !isAddModalOpen && activeAddDraftPreview && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-[#1D2A4D] border-2 border-amber-300 dark:border-amber-700/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#F59E0B] text-white shrink-0 mt-0.5 sm:mt-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                  {isAm ? 'ያላለቀ የተማሪ ረቂቅ ተገኝቷል' : 'Unsaved Student Draft Found'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  Auto-saved
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Draft: <strong>{activeAddDraftPreview.name || (isAm ? 'ስም ያልተሰጠው ተማሪ' : 'Unnamed Student')}</strong> (Roll #{activeAddDraftPreview.rollNumber})
                {activeAddDraftPreview.updatedAt && (
                  <span className="text-[11px] opacity-75 ml-1">
                    • {formatLastSaved(activeAddDraftPreview.updatedAt).en}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsDiscardDraftModalOpen(true)}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
            >
              {t.discardDraft}
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal(false)}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-[#173B65] hover:bg-[#102a4a] text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>{t.resume}</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SELECTION BAR (When 1 or more students are selected)           */}
      {/* ------------------------------------------------------------- */}
      {selectedStudentIds.size > 0 && (
        <div className="p-3 bg-white dark:bg-[#151F38] rounded-2xl border-2 border-[#173B65]/30 dark:border-[#38BDF8]/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#173B65] text-white flex items-center justify-center font-bold text-xs">
              {selectedStudentIds.size}
            </span>
            <span className="text-xs font-bold text-[#172235] dark:text-[#F8FAFC]">
              {selectedStudentIds.size} {t.studentsSelected}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClearSelection}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#2B3A67] bg-[#F4F7FB] dark:bg-[#1D2A4D] text-[#172235] dark:text-[#F8FAFC] text-xs font-semibold hover:bg-[#E2E8F0] transition"
            >
              {t.deselectAll}
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-[#DC5252] hover:bg-[#b93b3b] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.delete} ({selectedStudentIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Active vs Archived Students Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-[#F4F7FB] dark:bg-[#1D2A4D] rounded-2xl border border-[#E2E8F0] dark:border-[#2B3A67] w-full sm:w-fit">
        <button
          type="button"
          onClick={() => {
            setStatusTab('active');
            setSelectedStudentIds(new Set());
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            statusTab === 'active'
              ? 'bg-white dark:bg-[#151F38] text-[#173B65] dark:text-[#38BDF8] shadow-xs'
              : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#172235]'
          }`}
        >
          <span>{t.activeStudents}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            statusTab === 'active'
              ? 'bg-[#173B65]/10 dark:bg-[#38BDF8]/20 text-[#173B65] dark:text-[#38BDF8]'
              : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusTab('archived');
            setSelectedStudentIds(new Set());
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            statusTab === 'archived'
              ? 'bg-white dark:bg-[#151F38] text-amber-700 dark:text-amber-400 shadow-xs'
              : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#172235]'
          }`}
        >
          <span>{t.archivedStudents}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            statusTab === 'archived'
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {archivedCount}
          </span>
        </button>
      </div>

      {/* Enhanced Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          <input
            type="text"
            placeholder="Search students by name, roll number (e.g. 001, John), grade, or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-[#151F38] border border-[#E2E8F0] dark:border-[#2B3A67] text-sm font-medium text-[#172235] dark:text-[#F8FAFC] placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8] focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] shadow-xs transition"
            autoComplete="off"
            spellCheck={false}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#64748B] dark:text-[#94A3B8] hover:text-[#173B65] dark:hover:text-[#F8FAFC] hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D] transition"
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Summary */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between gap-2 px-1 text-xs text-[#607D8B] dark:text-[#B0BEC5] font-semibold">
            <span>
              Showing <strong className="text-[#173B65] dark:text-[#38BDF8]">{filteredStudents.length}</strong> of{' '}
              {students.length} students
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#0D9488] hover:underline font-bold cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {isReorderMode && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <span>Reorder mode active. Use arrows to move student positions.</span>
          <button
            type="button"
            onClick={() => setIsReorderMode(false)}
            className="font-bold underline ml-2"
          >
            Done
          </button>
        </div>
      )}

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-[#1B2730] rounded-3xl border border-[#E8E0D0] dark:border-[#37474F]">
          {students.length === 0 ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-[#24343D] flex items-center justify-center mx-auto text-[#006064] dark:text-[#4DD0E1]">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#263238] dark:text-[#F5F7FA]">
                No students enrolled yet / እስካሁን ምንም ተማሪ አልተመዘገበም
              </h3>
              <p className="text-[#607D8B] dark:text-[#B0BEC5] text-xs font-medium max-w-sm mx-auto">
                Add students manually or import from an Excel (.xlsx / .csv) file to begin tracking attendance.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onOpenExcelImport}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#006064] hover:bg-[#004d40] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#00BCD4]" />
                  <span>Import Excel File</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#FFF8E7] hover:bg-[#E8E0D0] dark:bg-[#24343D] dark:hover:bg-[#24343D]/80 text-[#006064] dark:text-[#4DD0E1] rounded-xl text-xs font-bold border border-[#E8E0D0] dark:border-[#37474F] transition"
                >
                  + Add Manually
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#FFF8E7] dark:bg-[#24343D] flex items-center justify-center mx-auto text-[#607D8B] dark:text-[#B0BEC5]">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#263238] dark:text-[#F5F7FA]">
                No students matching &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-[#607D8B] dark:text-[#B0BEC5]">
                Try searching with a different student name or roll number (e.g., 001, 1).
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-50 dark:bg-[#24343D] text-[#006064] dark:text-[#4DD0E1] hover:bg-cyan-100 transition"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1B2730] rounded-3xl border border-[#E8E0D0] dark:border-[#37474F] divide-y divide-[#E8E0D0]/60 dark:divide-[#37474F]/60 overflow-hidden shadow-xs">
          {/* List Header with Select All Checkbox */}
          <div className="px-4 py-2.5 bg-[#FFF8E7]/60 dark:bg-[#24343D]/40 flex items-center justify-between text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5]">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded text-[#006064] focus:ring-[#00BCD4] accent-[#006064] cursor-pointer"
                  aria-label="Select all students in list"
                />
                <span className="uppercase text-[11px] tracking-wider font-bold">
                  {isAllSelected ? 'All Selected' : 'Select'}
                </span>
              </label>
              <span className="font-mono text-[11px] opacity-75">
                ({filteredStudents.length} displayed)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Actions</span>
            </div>
          </div>

          {filteredStudents.map((student, index) => {
            const stats = calculateStudentStats(student.id, attendanceHistory);
            const isSelected = selectedStudentIds.has(student.id);

            return (
              <div
                key={student.id}
                onClick={() => setSelectedStudentForDetail(student)}
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition cursor-pointer group ${
                  isSelected
                    ? 'bg-cyan-500/10 dark:bg-cyan-950/20'
                    : 'hover:bg-[#FFF8E7]/40 dark:hover:bg-[#24343D]/50'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedStudentForDetail(student);
                  }
                }}
              >
                {/* Left side: Checkbox + Roll Number + Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Selection Checkbox with >= 44px touch target on mobile */}
                  <div
                    className="flex items-center justify-center p-2 -m-2 cursor-pointer shrink-0"
                    onClick={(e) => handleToggleSelectStudent(student.id, e)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    aria-label={`Select ${student.name}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div click
                      className="w-4 h-4 rounded text-[#006064] focus:ring-[#00BCD4] accent-[#006064] pointer-events-none"
                    />
                  </div>

                  <span className="w-8 shrink-0 text-center font-mono font-bold text-xs text-[#607D8B] dark:text-[#B0BEC5]">
                    {formatRollNumber(student.rollNumber)}
                  </span>

                  <div className="truncate flex-1">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <p className="font-bold text-[#263238] dark:text-[#F5F7FA] text-sm truncate">
                        {student.name}
                      </p>
                      {student.studentIdNumber && (
                        <span className="font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          {student.studentIdNumber}
                        </span>
                      )}
                      {(student.grade || student.section) && (
                        <span className="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                          {student.grade ? student.grade : ''}{student.section ? `-${student.section}` : ''}
                        </span>
                      )}
                      {student.isArchived && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                          {student.archiveReason || t.archivedStudents}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      {stats.totalDays > 0 ? (
                        <p className="text-[11px] text-[#607D8B] dark:text-[#B0BEC5]">
                          {stats.rate}% rate ({stats.present}P • {stats.absent}A)
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#607D8B] dark:text-[#B0BEC5] italic">
                          No attendance records
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-1 shrink-0">
                  {isReorderMode ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                        className="p-2 rounded-lg bg-[#FFF8E7] dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] disabled:opacity-30"
                        aria-label="Move student up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === students.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        className="p-2 rounded-lg bg-[#FFF8E7] dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] disabled:opacity-30"
                        aria-label="Move student down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {student.isArchived && onUnarchiveStudent ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnarchiveStudent(student.id);
                            onShowToast(`Restored ${student.name} to active roster`);
                          }}
                          className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                          title={t.unarchiveStudent}
                          aria-label={t.unarchiveStudent}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(student, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit student"
                        aria-label={`Edit ${student.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStudentToDelete(student);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete student"
                        aria-label={`Delete ${student.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-1" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD STUDENT MODAL WITH LIVE AUTO-SAVE DRAFT                    */}
      {/* ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#1B2730] rounded-3xl p-6 shadow-2xl border border-[#E8E0D0] dark:border-[#37474F] max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header & Status Indicator */}
            <div className="flex items-start justify-between pb-2 border-b border-[#E8E0D0] dark:border-[#37474F]">
              <div>
                <h2 className="text-lg font-black text-[#263238] dark:text-[#F5F7FA]">
                  Add New Student / አዲስ ተማሪ መዝግብ
                </h2>
                {/* Live Draft Auto-Save Status Indicator */}
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  {addDraftStatus === 'saving' && (
                    <span className="text-[#006064] dark:text-[#4DD0E1] flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving draft... (በማስቀመጥ ላይ...)
                    </span>
                  )}
                  {addDraftStatus === 'saved' && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {addDraftLastSaved ? formatLastSaved(addDraftLastSaved).en : 'Draft saved'}
                    </span>
                  )}
                  {addDraftStatus === 'error' && (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" /> Unable to save draft
                    </span>
                  )}
                  {addDraftStatus === 'idle' && (
                    <span className="text-[#607D8B] dark:text-[#B0BEC5] text-[11px]">
                      Changes are auto-saved as a draft
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-[#607D8B] hover:text-[#263238] dark:text-[#B0BEC5] dark:hover:text-[#F5F7FA] hover:bg-[#FFF8E7] dark:hover:bg-[#24343D] transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="space-y-3.5">
              {idError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{idError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                    Roll # (ተ.ቁ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newStudentRoll}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setNewStudentRoll(val);
                      triggerSaveAddDraft(newStudentName, val, newStudentGrade, newStudentSection, newStudentNotes);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                    {t.studentIdNumberLabel} (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={t.studentIdNumberPlaceholder}
                    value={newStudentIdNumber}
                    onChange={(e) => {
                      setNewStudentIdNumber(e.target.value);
                      setIdError(null);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                  Full Name / የተማሪው ሙሉ ስም <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abebe Kebede"
                  value={newStudentName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewStudentName(val);
                    triggerSaveAddDraft(val, newStudentRoll, newStudentGrade, newStudentSection, newStudentNotes);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                    Grade / ክፍል
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 4"
                    value={newStudentGrade}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewStudentGrade(val);
                      triggerSaveAddDraft(newStudentName, newStudentRoll, val, newStudentSection, newStudentNotes);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                    Section / ሴክሽን
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={newStudentSection}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewStudentSection(val);
                      triggerSaveAddDraft(newStudentName, newStudentRoll, newStudentGrade, val, newStudentNotes);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                  Notes / ማስታወሻ (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, contact, or guardian notes..."
                  value={newStudentNotes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewStudentNotes(val);
                    triggerSaveAddDraft(newStudentName, newStudentRoll, newStudentGrade, newStudentSection, val);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8E0D0] dark:border-[#37474F]">
                {hasSavedAddDraftState ? (
                  <button
                    type="button"
                    onClick={() => setIsDiscardDraftModalOpen(true)}
                    className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
                  >
                    Discard Draft
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-medium text-xs text-[#263238] dark:text-[#F5F7FA] hover:bg-slate-100 dark:hover:bg-[#24343D]"
                  >
                    Cancel
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl font-medium text-xs text-[#607D8B] dark:text-[#B0BEC5] bg-slate-100 hover:bg-slate-200 dark:bg-[#24343D] dark:hover:bg-[#37474F] transition"
                  >
                    Close & Keep Draft
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl font-bold text-xs bg-[#006064] hover:bg-[#004d40] text-white shadow-sm flex items-center gap-1.5 transition active:scale-95"
                  >
                    <UserPlus className="w-4 h-4 text-[#00BCD4]" />
                    <span>Register Student</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT STUDENT MODAL WITH LIVE AUTO-SAVE DRAFT                   */}
      {/* ------------------------------------------------------------- */}
      {editingStudent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#1B2730] rounded-3xl p-6 shadow-2xl border border-[#E8E0D0] dark:border-[#37474F] max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-2 border-b border-[#E8E0D0] dark:border-[#37474F]">
              <div>
                <h2 className="text-lg font-black text-[#263238] dark:text-[#F5F7FA]">
                  Edit Student #{formatRollNumber(editingStudent.rollNumber)}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  {editDraftStatus === 'saving' && (
                    <span className="text-[#006064] dark:text-[#4DD0E1] flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Auto-saving edit draft...
                    </span>
                  )}
                  {editDraftStatus === 'saved' && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {editDraftLastSaved ? formatLastSaved(editDraftLastSaved).en : 'Edit draft saved'}
                    </span>
                  )}
                  {editDraftStatus === 'idle' && (
                    <span className="text-[#607D8B] dark:text-[#B0BEC5] text-[11px]">
                      Changes are auto-saved as draft
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-xl text-[#607D8B] hover:text-[#263238] dark:text-[#B0BEC5] dark:hover:text-[#F5F7FA] hover:bg-[#FFF8E7] dark:hover:bg-[#24343D] transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {idError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{idError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                    Roll # (ተ.ቁ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editRoll}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setEditRoll(val);
                      triggerSaveEditDraft(editingStudent.id, editName, val, editGrade, editSection, editNotes);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                    {t.studentIdNumberLabel} (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={t.studentIdNumberPlaceholder}
                    value={editStudentIdNumber}
                    onChange={(e) => {
                      setEditStudentIdNumber(e.target.value);
                      setIdError(null);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                  Full Name / ሙሉ ስም <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditName(val);
                    triggerSaveEditDraft(editingStudent.id, val, editRoll, editGrade, editSection, editNotes);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                    Grade / ክፍል
                  </label>
                  <input
                    type="text"
                    value={editGrade}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditGrade(val);
                      triggerSaveEditDraft(editingStudent.id, editName, editRoll, val, editSection, editNotes);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                    Section / ሴክሽን
                  </label>
                  <input
                    type="text"
                    value={editSection}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditSection(val);
                      triggerSaveEditDraft(editingStudent.id, editName, editRoll, editGrade, val, editNotes);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#607D8B] dark:text-[#B0BEC5] uppercase mb-1">
                  Notes / ማስታወሻ
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditNotes(val);
                    triggerSaveEditDraft(editingStudent.id, editName, editRoll, editGrade, editSection, val);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#00BCD4]"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8E0D0] dark:border-[#37474F]">
                <button
                  type="button"
                  onClick={() => {
                    clearStudentEditDraft(editingStudent.id);
                    setEditingStudent(null);
                  }}
                  className="px-3.5 py-2 rounded-xl font-medium text-xs text-[#607D8B] dark:text-[#B0BEC5] hover:bg-slate-100 dark:hover:bg-[#24343D] transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-[#006064] hover:bg-[#004d40] text-white shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#00BCD4]" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CONFIRMATION MODALS                                           */}
      {/* ------------------------------------------------------------- */}
      {/* 1. Single Student Deletion */}
      <ConfirmModal
        isOpen={!!studentToDelete}
        title="Delete Student? / ተማሪውን ሰርዝ?"
        message={`Are you sure you want to delete student "${studentToDelete?.name}" (#${studentToDelete?.rollNumber})? Their profile will be removed from the active roster. Past attendance records are safely kept. / በእርግጥ ተማሪ "${studentToDelete?.name}" መሰረዝ ይፈልጋሉ? የተማሪው መዝገብ ይሰረዛል፤ የአቴንዳንስ ታሪክ ግን ተጠብቆ ይቆያል።`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Student'}
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setStudentToDelete(null)}
      />

      {/* 2. Bulk Delete Selected Students */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title={`Delete ${selectedStudentIds.size} Selected Students?`}
        message={`Are you sure you want to delete the ${selectedStudentIds.size} selected student records? Their profiles will be removed from the active roster. Past attendance records and reports are preserved. / በእርግጥ ${selectedStudentIds.size} የተመረጡትን ተማሪዎች መሰረዝ ይፈልጋሉ? የተማሪዎች መዝገብ ይሰረዛል፤ ያለፈው የአቴንዳንስ ታሪክ ግን ተጠብቆ ይቆያል።`}
        confirmLabel={isDeleting ? 'Deleting...' : `Confirm Delete (${selectedStudentIds.size})`}
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />

      {/* 3. Delete All Students - Step 1 of 2 */}
      <ConfirmModal
        isOpen={deleteAllStep === 'step1'}
        title="Delete All Students? (Step 1 of 2)"
        message={`Are you sure you want to delete all ${students.length} student records from the roster? This is a major destructive action. Attendance history and feeding reports will remain in the database, but all student profiles will be removed. / በእርግጥ ሁሉንም ${students.length} ተማሪዎች መሰረዝ ይፈልጋሉ? የተማሪዎች መዝገብ ሙሉ በሙሉ ይጸዳል።`}
        confirmLabel="Proceed to Final Confirmation"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleProceedDeleteAllStep2}
        onCancel={() => setDeleteAllStep('closed')}
      />

      {/* 4. Delete All Students - Step 2 of 2 (Strong confirmation) */}
      <ConfirmModal
        isOpen={deleteAllStep === 'step2'}
        title="Final Confirmation: Delete All Students"
        message={`⚠️ FINAL CONFIRMATION: Please confirm once more. All ${students.length} students will be permanently deleted from the active roster. This action cannot be undone. / የመጨረሻ ማረጋገጫ፡ እባክዎ ሁሉንም ${students.length} ተማሪዎች ለመሰረዝ በድጋሚ ያረጋግጡ። ይህ እርምጃ አይቀለበስም።`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Yes, Delete All Students'}
        cancelLabel="Cancel & Abort"
        isDestructive={true}
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setDeleteAllStep('closed')}
      />

      {/* 5. Discard Draft Confirmation */}
      <ConfirmModal
        isOpen={isDiscardDraftModalOpen}
        title="Discard Student Draft?"
        message="Are you sure you want to discard your unsaved new student draft? All entered fields will be cleared. / ይህንን ያልተጠናቀቀ የተማሪ ረቂቅ መሰረዝ ይፈልጋሉ?"
        confirmLabel="Discard Draft"
        cancelLabel="Keep Draft"
        isDestructive={true}
        onConfirm={handleDiscardAddDraft}
        onCancel={() => setIsDiscardDraftModalOpen(false)}
      />

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#1B2730] rounded-3xl p-6 shadow-2xl border border-[#E8E0D0] dark:border-[#37474F]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#006064] dark:text-[#4DD0E1]" />
                <h2 className="text-lg font-bold text-[#263238] dark:text-[#F5F7FA]">
                  Import Students CSV
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-[#607D8B] hover:text-[#263238] dark:text-[#B0BEC5] dark:hover:text-[#F5F7FA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#607D8B] dark:text-[#B0BEC5] mb-3">
              Paste CSV text formatted as <code className="bg-[#FFF8E7] dark:bg-[#24343D] px-1 py-0.5 rounded">RollNumber,Name</code> or one name per line:
            </p>

            <textarea
              rows={6}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder="1,Abebe Kebede&#10;2,Hana Tesfaye&#10;3,Dawit Alemu"
              className="w-full p-3 font-mono text-xs rounded-xl border border-[#E8E0D0] dark:border-[#37474F] bg-white dark:bg-[#24343D] text-[#263238] dark:text-[#F5F7FA] mb-4 focus:ring-2 focus:ring-[#00BCD4]"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm text-[#607D8B] bg-slate-100 hover:bg-slate-200 dark:text-[#B0BEC5] dark:bg-[#24343D]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                disabled={!importCsvText.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-[#006064] hover:bg-[#004d40] text-white disabled:opacity-50"
              >
                Import List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        attendanceHistory={attendanceHistory}
        settings={settings}
        onClose={() => setSelectedStudentForDetail(null)}
        onEditStudent={(s) => {
          setSelectedStudentForDetail(null);
          handleOpenEditModal(s, { stopPropagation: () => {} } as React.MouseEvent);
        }}
        onArchiveStudent={onArchiveStudent}
        onUnarchiveStudent={onUnarchiveStudent}
      />
    </div>
  );
};

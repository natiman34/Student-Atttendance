import React, { useState, useRef } from 'react';
import { Student } from '../types.ts';
import { parseExcelOrCsvFile } from '../utils/exports.ts';
import { parseStudentsFromCSV } from '../utils/attendance.ts';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  ClipboardPaste,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newStudents: Student[], mode: 'replace' | 'append') => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedList, setParsedList] = useState<{ rollNumber: number; name: string }[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const students = await parseExcelOrCsvFile(selectedFile);
      if (students.length === 0) {
        setErrorMessage('Could not find any student names in the uploaded Excel file. Ensure columns contain student names.');
        setParsedList([]);
      } else {
        setParsedList(students);
      }
    } catch (err: any) {
      setErrorMessage(`Failed to read Excel file: ${err.message || 'Unknown error'}`);
      setParsedList([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteChange = (text: string) => {
    setPasteText(text);
    setErrorMessage(null);
    if (!text.trim()) {
      setParsedList([]);
      return;
    }
    const parsed = parseStudentsFromCSV(text);
    if (parsed.length === 0) {
      setErrorMessage('No valid student rows found. Paste rows formatted as: Roll, Name or one name per line.');
      setParsedList([]);
    } else {
      setParsedList(parsed);
    }
  };

  const handleConfirmImport = () => {
    if (parsedList.length === 0) return;

    const formattedStudents: Student[] = parsedList.map((item, idx) => ({
      id: `student_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      rollNumber: item.rollNumber,
      name: item.name,
    }));

    onImport(formattedStudents, importMode);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="excel-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="excel-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Import Students from Excel
              </h2>
              <p className="text-xs text-slate-500">
                Supports .xlsx, .xls, and .csv spreadsheets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mt-3.5">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File (.xlsx / .csv)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Copy & Paste Rows</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 pt-4 flex-1 pr-1">
          {activeTab === 'upload' ? (
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/20"
              >
                <Upload className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {file ? file.name : 'Tap to select Excel (.xlsx, .xls) or CSV file'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Works directly on smartphones or computer
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Paste student rows from Excel:
              </label>
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="1  Student Name&#10;2  Another Student"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview of Parsed Students */}
          {parsedList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Found {parsedList.length} students in file
                </span>

                {/* Import Mode selection */}
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-emerald-600"
                    />
                    <span>Replace Roster</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-emerald-600"
                    />
                    <span>Append</span>
                  </label>
                </div>
              </div>

              {/* Mini Preview Table */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
                {parsedList.slice(0, 50).map((s, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between">
                    <span className="font-mono text-slate-400 font-bold">
                      #{s.rollNumber}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[240px]">
                      {s.name}
                    </span>
                  </div>
                ))}
                {parsedList.length > 50 && (
                  <div className="p-2 text-center text-slate-400 italic">
                    + {parsedList.length - 50} more students
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedList.length === 0 || isProcessing}
            onClick={handleConfirmImport}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-40"
          >
            Import {parsedList.length > 0 ? `(${parsedList.length})` : ''} Students
          </button>
        </div>
      </div>
    </div>
  );
};

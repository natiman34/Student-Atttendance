import React from 'react';
import {
  AlertTriangle,
  Users,
  CheckSquare,
  Utensils,
  PlusCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export type ReportValidationErrorType =
  | 'no_students'
  | 'no_report_data'
  | 'no_period_reports'
  | 'partial_fields';

export interface ValidationAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
  icon?: React.ReactNode;
}

interface ReportValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: ReportValidationErrorType;
  missingFields?: string[];
  customMessage?: {
    amharic: string;
    english: string;
  };
  actions?: ValidationAction[];
}

export const ReportValidationModal: React.FC<ReportValidationModalProps> = ({
  isOpen,
  onClose,
  errorType,
  missingFields = [],
  customMessage,
  actions = [],
}) => {
  if (!isOpen) return null;

  const getContent = () => {
    switch (errorType) {
      case 'no_students':
        return {
          titleAm: 'ተማሪዎች አልተመዘገቡም',
          titleEn: 'No Students Registered',
          msgAm: customMessage?.amharic || 'እባክዎ መጀመሪያ ተማሪዎችን ይመዝግቡ።',
          msgEn: customMessage?.english || 'Please register students first before exporting reports.',
          badge: 'የተማሪዎች ምዝገባ ያስፈልጋል',
        };
      case 'no_period_reports':
        return {
          titleAm: 'ምንም ሪፖርት አልተገኘም',
          titleEn: 'No Saved Reports Found',
          msgAm: customMessage?.amharic || 'በተመረጠው ጊዜ ውስጥ የተቀመጠ ሪፖርት የለም።',
          msgEn: customMessage?.english || 'No saved reports were found for the selected period.',
          badge: 'የተቀመጠ ሪፖርት የለም',
        };
      case 'partial_fields':
        return {
          titleAm: 'ያልተሟሉ መረጃዎች አሉ',
          titleEn: 'Required Fields Missing',
          msgAm: customMessage?.amharic || 'ሪፖርቱ በከፊል ብቻ ነው የተሞላው። እባክዎ አስፈላጊ የሆኑትን መረጃዎች አሟልተው ያስገቡ።',
          msgEn: customMessage?.english || 'The report is partially completed. Please fill all required fields before exporting.',
          badge: 'ያልተሟላ ሪፖርት',
        };
      case 'no_report_data':
      default:
        return {
          titleAm: 'ሪፖርት አልተሞላም',
          titleEn: 'Report Incomplete',
          msgAm: customMessage?.amharic || 'ሪፖርት አልተሞላም። እባክዎ ከመላክዎ ወይም ከማውረድዎ በፊት ሪፖርቱን ይሙሉ።',
          msgEn: customMessage?.english || 'The report has not been completed. Please fill in the report before exporting or downloading it.',
          badge: 'ሪፖርቱን ይሙሉ',
        };
    }
  };

  const content = getContent();

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 120 }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {content.titleAm}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                {content.titleEn}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message body */}
        <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
          <p className="text-sm font-bold text-slate-900 dark:text-amber-100 leading-snug">
            {content.msgAm}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {content.msgEn}
          </p>

          {/* Missing fields list if partial */}
          {errorType === 'partial_fields' && missingFields.length > 0 && (
            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 space-y-1">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                የሚጎድሉ መረጃዎች (Missing Items):
              </span>
              <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                {missingFields.map((field, idx) => (
                  <li key={idx} className="font-medium">
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {actions.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-2">
              {actions.map((act, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onClose();
                    act.onClick();
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer ${
                    act.primary
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {act.icon}
                  <span>{act.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition active:scale-98"
            >
              ተረዳሁ (Close)
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            ይቅር (Cancel)
          </button>
        </div>
      </div>
    </div>
  );
};

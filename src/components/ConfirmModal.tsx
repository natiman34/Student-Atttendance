import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-3">
          {isDestructive && (
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}
          <h2
            id="modal-title"
            className="text-lg font-bold text-slate-900 dark:text-white"
          >
            {title}
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl font-medium text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition shadow-sm ${
              isDestructive
                ? 'bg-[#DC5252] hover:bg-[#b93b3b]'
                : 'bg-[#173B65] hover:bg-[#102a4a]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

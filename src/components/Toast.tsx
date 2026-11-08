import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xl shadow-black/20 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white shrink-0" />}
      {type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
      {type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
      <span>{message.replace(/^[✓✔]\s*/, '')}</span>
    </div>
  );
};

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      // Clear specific corrupted storage items while preserving roster backup
      const backup = localStorage.getItem('rollcall_backup_history_v1');
      const students = localStorage.getItem('rollcall_students_v2');
      const attendance = localStorage.getItem('rollcall_attendance_v2');
      
      localStorage.clear();
      
      if (backup) localStorage.setItem('rollcall_backup_history_v1', backup);
      if (students) localStorage.setItem('rollcall_students_v2', students);
      if (attendance) localStorage.setItem('rollcall_attendance_v2', attendance);
    } catch (e) {
      console.warn('Reset cache note:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0F172A] flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                ያልተጠበቀ ስህተት አጋጥሟል (Application Recovery)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                RollCall encountered a temporary issue. Your student records and attendance data are safe in storage.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-left">
                <span className="text-[10px] font-mono text-rose-500 block break-words">
                  {this.state.error.message || String(this.state.error)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-[#173B65] hover:bg-[#102a4a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>መተግበሪያውን እንደገና አስጀምር (Reload App)</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>ጊዜያዊ ዳታ አጽዳ (Reset Cache &amp; Recover)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

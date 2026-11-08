import React, { useState, useRef, useEffect } from 'react';
import { Clock, X, Check, Sparkles } from 'lucide-react';
import {
  formatMinutesToTime,
  addMinutesToTime,
  QUICK_TIME_PRESETS,
} from '../utils/timeUtils.ts';

interface TimePickerWidgetProps {
  value: string;
  onChange: (time: string) => void;
  label: string;
  amharicLabel?: string;
  placeholder?: string;
  baseTime?: string; // Optional start time to calculate quick duration offsets (+15m, +30m, etc.)
  readOnly?: boolean;
  hasError?: boolean;
}

export const TimePickerWidget: React.FC<TimePickerWidgetProps> = ({
  value,
  onChange,
  label,
  amharicLabel,
  placeholder = '00:00',
  baseTime,
  readOnly = false,
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempTime, setTempTime] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempTime(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleApply = (newVal: string) => {
    onChange(newVal);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange('');
    setTempTime('');
    setIsOpen(false);
  };

  const handleSetNow = () => {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const formatted = formatMinutesToTime(hours * 60 + mins);
    handleApply(formatted);
  };

  const handleOffset = (mins: number) => {
    const refTime = baseTime || value || '09:00';
    const computed = addMinutesToTime(refTime, mins);
    if (computed) {
      handleApply(computed);
    }
  };

  if (readOnly) {
    return (
      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
        {value || '-'}
      </span>
    );
  }

  return (
    <div className="relative inline-block w-full">
      {/* Trigger button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full min-h-[38px] px-2 py-1.5 rounded-xl border flex items-center justify-between gap-1.5 cursor-pointer select-none transition ${
          hasError
            ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
            : value
              ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-900 dark:text-white hover:border-emerald-600'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className={`w-3.5 h-3.5 shrink-0 ${value ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className={`font-mono text-xs font-bold truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
            {value || placeholder}
          </span>
        </div>

        {value ? (
          <button
            type="button"
            onClick={handleClear}
            title="Clear time"
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 shrink-0">ቀይር</span>
        )}
      </div>

      {/* Popover / Modal Picker */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{ zIndex: 110 }}
          className="absolute left-0 sm:left-auto right-0 sm:right-0 mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border-2 border-emerald-500/30 dark:border-emerald-600/40 space-y-3 animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                {amharicLabel}
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                {label} (Time Selection)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Native Time Input for direct keyboard/wheel entry */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>ሰዓት በቀጥታ አስገባ (Enter Time):</span>
              <button
                type="button"
                onClick={handleSetNow}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>አሁን (Now)</span>
              </button>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleApply(tempTime)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>እሺ</span>
              </button>
            </div>
          </div>

          {/* Quick Duration Offsets (if baseTime exists) */}
          {baseTime && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                የቆይታ ጊዜ ፈጣን ምርጫ (Duration from {baseTime}):
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleOffset(mins)}
                    className="py-1 px-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black transition"
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Presets Grid */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              የተለመዱ ሰዓታት (Quick Presets):
            </span>
            <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {QUICK_TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApply(preset)}
                  className={`py-1 px-1 rounded-lg font-mono text-xs font-bold transition text-center ${
                    value === preset
                      ? 'bg-emerald-600 text-white'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              አጽዳ (Clear)
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ዝጋ (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

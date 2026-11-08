import React, { useState, useRef, useEffect } from 'react';
import {
  EthiopianDate,
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_WEEKDAYS,
  getDaysInEthiopianMonth,
  getEthiopianDayOfWeek,
  isoToEthiopian,
  ethiopianToIso,
  formatEthiopianDisplay,
  getTodayEthiopian,
} from '../utils/ethiopianCalendar.ts';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';

interface EthiopianDatePickerProps {
  value: string; // ISO format: YYYY-MM-DD
  onChange: (isoDate: string, ethDate: EthiopianDate) => void;
  label?: string;
  showLabel?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const EthiopianDatePicker: React.FC<EthiopianDatePickerProps> = ({
  value,
  onChange,
  label,
  showLabel = true,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'የኢትዮጵያ ቀን ይምረጡ (Select Ethiopian Date)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active viewing month and year in the calendar picker
  const initialEth = isoToEthiopian(value);
  const [viewYear, setViewYear] = useState<number>(initialEth.year);
  const [viewMonth, setViewMonth] = useState<number>(initialEth.month);

  // Keep viewing month in sync when value changes externally
  useEffect(() => {
    const eth = isoToEthiopian(value);
    setViewYear(eth.year);
    setViewMonth(eth.month);
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedEth = isoToEthiopian(value);
  const todayEth = getTodayEthiopian();

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(13);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 13) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newEthDate: EthiopianDate = {
      year: viewYear,
      month: viewMonth,
      day,
    };
    const newIso = ethiopianToIso(viewYear, viewMonth, day);
    onChange(newIso, newEthDate);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = getTodayEthiopian();
    const todayIso = ethiopianToIso(today.year, today.month, today.day);
    setViewYear(today.year);
    setViewMonth(today.month);
    onChange(todayIso, today);
    setIsOpen(false);
  };

  // Compute days in currently viewed month
  const daysInMonth = getDaysInEthiopianMonth(viewYear, viewMonth);
  // Weekday offset for the 1st of viewed month (0 = Sun .. 6 = Sat)
  const firstDayOfWeek = getEthiopianDayOfWeek(viewYear, viewMonth, 1);

  // Available Ethiopian years for quick selector (current year ± 6)
  const yearOptions = Array.from({ length: 15 }, (_, i) => todayEth.year - 7 + i);

  const displayString = value ? formatEthiopianDisplay(selectedEth, { includeEra: true }) : '';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && showLabel && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
            የኢትዮጵያ ዘመን አቆጣጠር
          </span>
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-600 transition shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden disabled:opacity-50 cursor-pointer"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {displayString ? (
            <span className="font-bold text-slate-900 dark:text-white">
              {displayString}
              <span className="ml-1.5 text-[10px] font-mono font-normal text-slate-400">
                ({value})
              </span>
            </span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>
        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg shrink-0">
          ቀይር
        </span>
      </button>

      {/* Dropdown / Modal Calendar Grid */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 sm:left-auto right-0 sm:right-auto w-full sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Header Controls: Month & Year Selector */}
          <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="ቀዳሚ ወር (Previous Month)"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Ethiopian Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {ETHIOPIAN_MONTHS.map((m) => (
                  <option key={m.number} value={m.number}>
                    {m.amharicName} ({m.number})
                  </option>
                ))}
              </select>

              {/* Ethiopian Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y} ዓ.ም
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="ቀጣይ ወር (Next Month)"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels (Sun to Sat in Amharic) */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {ETHIOPIAN_WEEKDAYS.map((w) => (
              <span
                key={w.dayIndex}
                className="text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1"
                title={`${w.amharic} (${w.english})`}
              >
                {w.short}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank padding cells before 1st of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Day buttons (1..30 or 1..5/6 for Pagume) */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const isSelected =
                selectedEth.year === viewYear &&
                selectedEth.month === viewMonth &&
                selectedEth.day === day;

              const isToday =
                todayEth.year === viewYear &&
                todayEth.month === viewMonth &&
                todayEth.day === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs scale-105'
                      : isToday
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-black'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-emerald-600 -mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Actions: Quick Jump to Today & Close */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>ዛሬ (Today: {formatEthiopianDisplay(todayEth, { compact: true })})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="py-1 px-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition"
            >
              ዝጋ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

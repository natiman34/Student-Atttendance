import React, { useState, useEffect } from 'react';
import type { FeedingActivityRow } from '../types.ts';
import {
  Clock,
  X,
  Check,
  Calendar,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  calculateActivityDuration,
  validateManualTimeInput,
  QUICK_TIME_PRESETS,
} from '../utils/timeUtils.ts';
import { formatDisplayDate } from '../utils/attendance.ts';

interface ManualTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: FeedingActivityRow | null;
  applicableDate: string;
  onSave: (updatedActivity: FeedingActivityRow, updatedDate?: string) => void;
  allActivities?: FeedingActivityRow[];
  onSelectActivity?: (activityId: string) => void;
}

export const ManualTimeEntryModal: React.FC<ManualTimeEntryModalProps> = ({
  isOpen,
  onClose,
  activity,
  applicableDate,
  onSave,
  allActivities,
  onSelectActivity,
}) => {
  if (!isOpen || !activity) return null;

  // Split existing startTime and endTime into hours and minutes
  const getInitialHM = (timeStr: string) => {
    if (!timeStr) return { h: '', m: '' };
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return { h: parts[0], m: parts[1] };
    }
    return { h: '', m: '' };
  };

  const initialStart = getInitialHM(activity.startTime || '');
  const initialEnd = getInitialHM(activity.endTime || '');

  const [startHours, setStartHours] = useState<string>(initialStart.h);
  const [startMinutes, setStartMinutes] = useState<string>(initialStart.m);

  const [endHours, setEndHours] = useState<string>(initialEnd.h);
  const [endMinutes, setEndMinutes] = useState<string>(initialEnd.m);

  const [activityName, setActivityName] = useState<string>(activity.activityName || '');
  const [selectedDate, setSelectedDate] = useState<string>(applicableDate);

  const [errorMsg, setErrorMsg] = useState<{ am: string; en: string } | null>(null);

  // Sync state when activity prop changes
  useEffect(() => {
    const s = getInitialHM(activity.startTime || '');
    const e = getInitialHM(activity.endTime || '');
    setStartHours(s.h);
    setStartMinutes(s.m);
    setEndHours(e.h);
    setEndMinutes(e.m);
    setActivityName(activity.activityName || '');
    setSelectedDate(applicableDate);
    setErrorMsg(null);
  }, [activity, applicableDate]);

  // Derived formatted times
  const formattedStartTime =
    startHours !== '' && startMinutes !== ''
      ? `${String(Math.min(23, Math.max(0, parseInt(startHours, 10) || 0))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, parseInt(startMinutes, 10) || 0))).padStart(2, '0')}`
      : '';

  const formattedEndTime =
    endHours !== '' && endMinutes !== ''
      ? `${String(Math.min(23, Math.max(0, parseInt(endHours, 10) || 0))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, parseInt(endMinutes, 10) || 0))).padStart(2, '0')}`
      : '';

  // Calculate live duration
  const durationResult = calculateActivityDuration(formattedStartTime, formattedEndTime);

  // Input change handlers with positive bounds check
  const handleHoursChange = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setErrorMsg(null);
    if (val === '') {
      setter('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num < 0) setter('00');
      else if (num > 23) setter('23');
      else setter(val.slice(-2));
    }
  };

  const handleMinutesChange = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setErrorMsg(null);
    if (val === '') {
      setter('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num < 0) setter('00');
      else if (num > 59) setter('59');
      else setter(val.slice(-2));
    }
  };

  const handleSetNow = (target: 'start' | 'end') => {
    setErrorMsg(null);
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    if (target === 'start') {
      setStartHours(h);
      setStartMinutes(m);
    } else {
      setEndHours(h);
      setEndMinutes(m);
    }
  };

  const handleQuickPreset = (preset: string, target: 'start' | 'end') => {
    setErrorMsg(null);
    const parts = preset.split(':');
    if (parts.length === 2) {
      if (target === 'start') {
        setStartHours(parts[0]);
        setStartMinutes(parts[1]);
      } else {
        setEndHours(parts[0]);
        setEndMinutes(parts[1]);
      }
    }
  };

  const handleAddOffsetToEnd = (minutesToAdd: number) => {
    setErrorMsg(null);
    const startMins = parseTimeToMinutes(formattedStartTime);
    if (startMins !== null) {
      const computed = formatMinutesToTime(startMins + minutesToAdd);
      const parts = computed.split(':');
      if (parts.length === 2) {
        setEndHours(parts[0]);
        setEndMinutes(parts[1]);
      }
    }
  };

  const handleClear = () => {
    setStartHours('');
    setStartMinutes('');
    setEndHours('');
    setEndMinutes('');
    setErrorMsg(null);
  };

  const handleSave = () => {
    // Validate inputs
    let validStart = '';
    if (startHours !== '' || startMinutes !== '') {
      const v = validateManualTimeInput(startHours, startMinutes);
      if (!v.isValid) {
        setErrorMsg(v.error || { am: 'የተሳሳተ የመነሻ ሰዓት', en: 'Invalid start time' });
        return;
      }
      validStart = v.timeString;
    }

    let validEnd = '';
    if (endHours !== '' || endMinutes !== '') {
      const v = validateManualTimeInput(endHours, endMinutes);
      if (!v.isValid) {
        setErrorMsg(v.error || { am: 'የተሳሳተ የማብቂያ ሰዓት', en: 'Invalid end time' });
        return;
      }
      validEnd = v.timeString;
    }

    // Check duration validity if both are specified
    if (validStart && validEnd) {
      const dur = calculateActivityDuration(validStart, validEnd);
      if (!dur.isValid) {
        setErrorMsg(
          dur.warning || {
            am: 'የማብቂያ ሰዓት ከመጀመሪያ ሰዓት ቀድሟል',
            en: 'End time is earlier than start time',
          }
        );
        return;
      }
    }

    const updated: FeedingActivityRow = {
      ...activity,
      activityName: activityName.trim() || activity.activityName,
      startTime: validStart,
      endTime: validEnd,
    };

    onSave(updated, selectedDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#16202A] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E8E0D0] dark:border-[#2C3B47] flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#006064] to-[#00838F] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                ሰዓት በእጅ አስገባ / አርትዕ (Manual Time Entry)
              </h2>
              <p className="text-[11px] text-cyan-100 font-medium">
                ተግባር {activity.orderNumber}፡ {activity.activityName || 'የጊዜ ሰሌዳ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Activity Selector & Date Info */}
          <div className="bg-[#FFFDF7] dark:bg-[#1B2730] p-3 rounded-2xl border border-[#E8E0D0] dark:border-[#37474F] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                <Calendar className="w-4 h-4 text-[#006064] dark:text-cyan-400" />
                <span>የሪፖርት ቀን (Applicable Date):</span>
                <span className="font-mono text-[#006064] dark:text-cyan-300">
                  {formatDisplayDate(selectedDate)}
                </span>
              </div>

              {allActivities && allActivities.length > 1 && onSelectActivity && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">ተግባር ቀይር:</span>
                  <select
                    value={activity.id}
                    onChange={(e) => onSelectActivity(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-cyan-500"
                  >
                    {allActivities.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.orderNumber}. {act.activityName || `Activity ${act.orderNumber}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Activity Name edit */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                የተግባሩ ስም (Activity Title):
              </label>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="ተግባር ያስገቡ..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#006064] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Time Entry Form: 2 Columns for Start & End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Start Time Section */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>ተጀመረ (Start Time)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSetNow('start')}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>አሁን (Now)</span>
                </button>
              </div>

              {/* Hours & Minutes inputs */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    ሰዓት (0-23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={startHours}
                    onChange={(e) => handleHoursChange(e.target.value, setStartHours)}
                    placeholder="09"
                    className="w-full text-center py-2 px-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-black text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-xl font-bold font-mono text-slate-400 pt-4">:</span>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    ደቂቃ (0-59)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={startMinutes}
                    onChange={(e) => handleMinutesChange(e.target.value, setStartMinutes)}
                    placeholder="30"
                    className="w-full text-center py-2 px-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-black text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Native time input sync */}
              <div className="pt-1">
                <label className="text-[10px] text-slate-400 block mb-0.5">
                  ወይም በመደበኛ መራጭ (Or native clock):
                </label>
                <input
                  type="time"
                  value={formattedStartTime}
                  onChange={(e) => {
                    const parts = e.target.value.split(':');
                    if (parts.length === 2) {
                      setStartHours(parts[0]);
                      setStartMinutes(parts[1]);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1 pt-1">
                {['08:30', '09:00', '09:30', '10:00'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleQuickPreset(p, 'start')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 text-slate-700 dark:text-slate-200"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* End Time Section */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>አለቀ (End Time)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSetNow('end')}
                  className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>አሁን (Now)</span>
                </button>
              </div>

              {/* Hours & Minutes inputs */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    ሰዓት (0-23)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={endHours}
                    onChange={(e) => handleHoursChange(e.target.value, setEndHours)}
                    placeholder="10"
                    className="w-full text-center py-2 px-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-black text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-xl font-bold font-mono text-slate-400 pt-4">:</span>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    ደቂቃ (0-59)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={endMinutes}
                    onChange={(e) => handleMinutesChange(e.target.value, setEndMinutes)}
                    placeholder="15"
                    className="w-full text-center py-2 px-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-black text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Native time input sync */}
              <div className="pt-1">
                <label className="text-[10px] text-slate-400 block mb-0.5">
                  ወይም በመደበኛ መራጭ (Or native clock):
                </label>
                <input
                  type="time"
                  value={formattedEndTime}
                  onChange={(e) => {
                    const parts = e.target.value.split(':');
                    if (parts.length === 2) {
                      setEndHours(parts[0]);
                      setEndMinutes(parts[1]);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Duration Offset from Start Time */}
              {formattedStartTime && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleAddOffsetToEnd(mins)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 text-cyan-800 dark:text-cyan-300"
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duration Preview or Error Alert */}
          {errorMsg ? (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-rose-800 dark:text-rose-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{errorMsg.am}</p>
                <p className="text-[11px] opacity-80">{errorMsg.en}</p>
              </div>
            </div>
          ) : !durationResult.isValid ? (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-rose-800 dark:text-rose-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{durationResult.warning?.am}</p>
                <p className="text-[11px] opacity-80">{durationResult.warning?.en}</p>
              </div>
            </div>
          ) : formattedStartTime && formattedEndTime ? (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold">የተሰላ ቆይታ (Calculated Duration):</span>
              </div>
              <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700">
                {durationResult.formattedAm} ({durationResult.formattedEn})
              </span>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-[#121820] border-t border-[#E8E0D0] dark:border-[#2C3B47] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>አጽዳ (Clear)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              ይቅር (Cancel)
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#006064] to-[#00838F] hover:from-[#004D40] hover:to-[#006064] text-white text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>መዝግብ / አስቀምጥ (Save Time)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

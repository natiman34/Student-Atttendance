import React, { useState } from 'react';
import type { FeedingActivityRow, LessonOrGameType } from '../types.ts';
import { Plus, Trash2, Clock, RotateCcw, AlertTriangle, CheckCircle2, Edit3, Sparkles } from 'lucide-react';
import { createDefaultFeedingActivities } from '../utils/feeding.ts';
import { TimePickerWidget } from './TimePickerWidget.tsx';
import { ManualTimeEntryModal } from './ManualTimeEntryModal.tsx';
import { calculateActivityDuration } from '../utils/timeUtils.ts';

interface FeedingActivityTableProps {
  activities: FeedingActivityRow[];
  onChange: (activities: FeedingActivityRow[]) => void;
  readOnly?: boolean;
  activityType?: LessonOrGameType;
  applicableDate?: string;
  onDateChange?: (date: string) => void;
}

export const FeedingActivityTable: React.FC<FeedingActivityTableProps> = ({
  activities,
  onChange,
  readOnly = false,
  activityType = 'lesson',
  applicableDate = '',
  onDateChange,
}) => {
  const [modalActivity, setModalActivity] = useState<FeedingActivityRow | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const handleTimeChange = (
    id: string,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    if (readOnly) return;
    const updated = activities.map((act) =>
      act.id === id ? { ...act, [field]: value } : act
    );
    onChange(updated);
  };

  const handleActivityNameChange = (id: string, name: string) => {
    if (readOnly) return;
    const updated = activities.map((act) =>
      act.id === id ? { ...act, activityName: name } : act
    );
    onChange(updated);
  };

  const handleAddRow = () => {
    if (readOnly) return;
    const nextOrder = activities.length + 1;
    const newRow: FeedingActivityRow = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      orderNumber: nextOrder,
      activityName: '',
      startTime: '',
      endTime: '',
    };
    onChange([...activities, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    if (readOnly) return;
    const filtered = activities.filter((act) => act.id !== id);
    const renumbered = filtered.map((act, index) => ({
      ...act,
      orderNumber: index + 1,
    }));
    onChange(renumbered);
  };

  const handleResetToDefault = () => {
    if (readOnly) return;
    onChange(createDefaultFeedingActivities());
  };

  // Calculate total scheduled duration across all rows with valid start and end times
  const totalMinutes = activities.reduce((acc, row) => {
    const isNoneRow = activityType === 'none' && row.orderNumber === 2;
    if (isNoneRow) return acc;
    const dur = calculateActivityDuration(row.startTime, row.endTime);
    if (dur.isValid && dur.durationMinutes > 0) {
      return acc + dur.durationMinutes;
    }
    return acc;
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemainingMinutes = totalMinutes % 60;
  const totalDurationLabel =
    totalMinutes > 0
      ? totalHours > 0
        ? `${totalHours} ሰዓት ${totalRemainingMinutes > 0 ? `${totalRemainingMinutes} ደቂቃ` : ''} (${totalHours}h ${totalRemainingMinutes}m)`
        : `${totalRemainingMinutes} ደቂቃ (${totalRemainingMinutes}m)`
      : null;

  return (
    <div className="space-y-3.5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>የምገባ ተግባራት እና የጊዜ ሰሌዳ (Activity Schedule)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            የተግባራት መጀመሪያ እና ማብቂያ ሰዓት ይምረጡ (Select start &amp; end times)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {totalDurationLabel && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>ጠቅላላ፡ {totalDurationLabel}</span>
            </span>
          )}

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setModalActivity(activities[0] || null);
                  setIsManualModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#006064] dark:text-cyan-300 bg-[#E0F7FA] dark:bg-[#006064]/30 hover:bg-[#B2EBF2] dark:hover:bg-[#006064]/50 border border-[#006064]/30 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Open Manual Time Entry Dialog for activities"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ሰዓት በእጅ አስገባ (Manual Time)</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                title="Reset default activities"
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ዳግም ጀምር</span>
              </button>

              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ረድፍ ጨምር</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modern High-Contrast Activity Schedule Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121826] shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Top Header Row */}
            <tr className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-800">
              {/* ተ.ቁ */}
              <th
                rowSpan={2}
                className="w-12 py-3 px-2 text-center font-bold border-r border-slate-200/80 dark:border-slate-800 text-xs"
              >
                ተ.ቁ
              </th>

              {/* ተግባር */}
              <th
                rowSpan={2}
                className="py-3 px-3.5 font-bold border-r border-slate-200/80 dark:border-slate-800 text-xs"
              >
                ተግባር (Activity)
              </th>

              {/* ሰዓት (Grouped Heading) */}
              <th
                colSpan={2}
                className="py-1.5 px-2 text-center font-bold border-b border-slate-200/80 dark:border-slate-800 text-xs"
              >
                ሰዓት (Time Schedule)
              </th>

              {/* ቆይታ (Duration) */}
              <th
                rowSpan={2}
                className="w-28 sm:w-36 py-3 px-2 text-center font-bold border-l border-slate-200/80 dark:border-slate-800 text-xs"
              >
                ቆይታ (Duration)
              </th>

              {!readOnly && activities.length > 3 && (
                <th rowSpan={2} className="w-10 py-3 px-1 text-center font-bold">
                  
                </th>
              )}
            </tr>

            {/* Sub-header row for Time */}
            <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 font-semibold text-[11px]">
              <th className="w-36 sm:w-44 py-2 px-2 text-center border-r border-slate-200/80 dark:border-slate-800">
                ተጀመረ (Start)
              </th>
              <th className="w-36 sm:w-44 py-2 px-2 text-center">
                አለቀ (End)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {activities.map((row) => {
              const isNoneRow = activityType === 'none' && row.orderNumber === 2;
              const durationInfo = calculateActivityDuration(row.startTime, row.endTime);

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isNoneRow
                      ? 'bg-slate-50/60 dark:bg-slate-800/20 text-slate-400'
                      : !durationInfo.isValid
                      ? 'bg-rose-50/50 dark:bg-rose-950/20'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Number */}
                  <td className="py-2.5 px-2 text-center font-bold font-mono text-xs text-slate-500 dark:text-slate-400 border-r border-slate-200/70 dark:border-slate-800/70 bg-slate-50/30 dark:bg-slate-800/20">
                    {row.orderNumber}
                  </td>

                  {/* Activity Name */}
                  <td className="py-2.5 px-3 border-r border-slate-200/70 dark:border-slate-800/70 align-middle">
                    {isNoneRow ? (
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 italic py-1">
                        <span>{row.activityName || 'የተሰጠው ትምህርት / ጨዋታ'}</span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 not-italic">
                          ምንም (Nothing)
                        </span>
                      </div>
                    ) : readOnly ? (
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {row.activityName}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={row.activityName}
                        onChange={(e) => handleActivityNameChange(row.id, e.target.value)}
                        placeholder="ተግባር ያስገቡ..."
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      />
                    )}
                  </td>

                  {/* Start Time (ተጀመረ) */}
                  <td className="py-2 px-2 border-r border-slate-200/70 dark:border-slate-800/70 text-center align-middle">
                    {isNoneRow ? (
                      <span className="text-slate-400 font-mono text-xs">-</span>
                    ) : (
                      <div className="flex items-center gap-1 justify-center">
                        <TimePickerWidget
                          value={row.startTime}
                          onChange={(val) => handleTimeChange(row.id, 'startTime', val)}
                          placeholder="09:30"
                          readOnly={readOnly}
                          label="የተጀመረበት ሰዓት (Start Time)"
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalActivity(row);
                              setIsManualModalOpen(true);
                            }}
                            title="ሰዓት በእጅ አስገባ / አርትዕ (Manual Time Entry)"
                            className="p-1 rounded-lg text-slate-400 hover:text-[#006064] dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* End Time (አለቀ) */}
                  <td className="py-2 px-2 text-center align-middle">
                    {isNoneRow ? (
                      <span className="text-slate-400 font-mono text-xs">-</span>
                    ) : (
                      <div className="flex items-center gap-1 justify-center">
                        <TimePickerWidget
                          value={row.endTime}
                          onChange={(val) => handleTimeChange(row.id, 'endTime', val)}
                          placeholder="10:15"
                          readOnly={readOnly}
                          baseTime={row.startTime}
                          label="ያለቀበት ሰዓት (End Time)"
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalActivity(row);
                              setIsManualModalOpen(true);
                            }}
                            title="ሰዓት በእጅ አስገባ / አርትዕ (Manual Time Entry)"
                            className="p-1 rounded-lg text-slate-400 hover:text-[#006064] dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* ቆይታ (Duration Badge & Warning) */}
                  <td className="py-2 px-2 text-center align-middle border-l border-slate-200/70 dark:border-slate-800/70">
                    {isNoneRow ? (
                      <span className="text-slate-400 font-mono text-xs">-</span>
                    ) : !row.startTime || !row.endTime ? (
                      <span className="text-slate-400 text-xs font-mono">--</span>
                    ) : !durationInfo.isValid ? (
                      <div
                        className="inline-flex flex-col items-center justify-center p-1.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 text-[11px] font-semibold border border-rose-200 dark:border-rose-900"
                        title={durationInfo.warning?.en || 'Invalid time order'}
                      >
                        <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>ስህተት</span>
                        </div>
                        <span className="text-[10px] leading-tight text-center font-normal mt-0.5">
                          {durationInfo.warning?.am}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono tabular-nums bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        {durationInfo.formattedAm}
                      </span>
                    )}
                  </td>

                  {/* Extra row delete button */}
                  {!readOnly && activities.length > 3 && (
                    <td className="py-1 px-1 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="italic">
          * በሰዓት መራጩ ላይ በቀጥታ መጻፍ ወይም &quot;ሰዓት በእጅ አስገባ (Manual Time)&quot; በመጫን ሰዓት እና ደቂቃዎችን በዝርዝር ማስተካከል ይችላሉ።
        </p>
      </div>

      {/* Manual Time Entry Modal */}
      <ManualTimeEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        activity={modalActivity}
        applicableDate={applicableDate}
        allActivities={activities}
        onSelectActivity={(id) => {
          const found = activities.find((a) => a.id === id);
          if (found) setModalActivity(found);
        }}
        onSave={(updated, newDate) => {
          const updatedActivities = activities.map((a) => (a.id === updated.id ? updated : a));
          onChange(updatedActivities);
          if (newDate && onDateChange && newDate !== applicableDate) {
            onDateChange(newDate);
          }
        }}
      />
    </div>
  );
};

import React from 'react';
import { TabType } from '../types.ts';
import {
  Home,
  CheckSquare,
  Users,
  Settings,
  FileSpreadsheet,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext.tsx';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { t, language } = useTranslation();

  // 5 core navigation items with Attendance prominently positioned at the center
  const navItems: {
    tab: TabType;
    labelAm: string;
    labelEn: string;
    icon: (isActive: boolean) => React.ReactNode;
    isCenterAction?: boolean;
  }[] = [
    {
      tab: 'home',
      labelAm: 'መነሻ',
      labelEn: 'Home',
      icon: (isActive) => (
        <Home
          className={`w-5 h-5 transition-transform duration-200 ${
            isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
          }`}
        />
      ),
    },
    {
      tab: 'students',
      labelAm: 'ተማሪዎች',
      labelEn: 'Students',
      icon: (isActive) => (
        <Users
          className={`w-5 h-5 transition-transform duration-200 ${
            isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
          }`}
        />
      ),
    },
    {
      tab: 'attendance',
      labelAm: 'አቴንዳንስ',
      labelEn: 'Roll Call',
      isCenterAction: true,
      icon: (isActive) => (
        <CheckSquare
          className={`w-5 h-5 transition-transform duration-200 ${
            isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
          }`}
        />
      ),
    },
    {
      tab: 'reports',
      labelAm: 'ሪፖርቶች',
      labelEn: 'Reports',
      icon: (isActive) => (
        <FileSpreadsheet
          className={`w-5 h-5 transition-transform duration-200 ${
            isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
          }`}
        />
      ),
    },
    {
      tab: 'settings',
      labelAm: 'ቅንብሮች',
      labelEn: 'Settings',
      icon: (isActive) => (
        <Settings
          className={`w-5 h-5 transition-transform duration-200 ${
            isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
          }`}
        />
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_-4px_28px_rgba(0,0,0,0.5)] select-none transition-colors duration-200"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-1 pt-1.5 pb-1">
        {navItems.map((item) => {
          // If viewing history or data analytical screens, highlight reports tab
          const isActive =
            currentTab === item.tab ||
            (item.tab === 'reports' && (currentTab === 'history' || currentTab === 'data'));

          const label = language === 'am' ? item.labelAm : item.labelEn;

          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onSelectTab(item.tab)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center min-h-[54px] py-1 px-0.5 rounded-2xl transition-all duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0D9488] active:scale-95 group"
            >
              {/* Active Tab Top Indicator Bar */}
              {isActive && (
                <span
                  className="absolute -top-1.5 w-6 h-1 rounded-full bg-[#0D9488] dark:bg-[#2DD4BF] shadow-xs shadow-[#0D9488]/40 animate-in fade-in zoom-in-75 duration-200"
                  aria-hidden="true"
                />
              )}

              {/* Icon Container with Pill Highlight */}
              {item.isCenterAction ? (
                <div
                  className={`w-12 h-7.5 flex items-center justify-center rounded-xl transition-all duration-200 shadow-2xs ${
                    isActive
                      ? 'bg-[#173B65] text-white dark:bg-[#0D9488] dark:text-white shadow-md shadow-[#173B65]/30'
                      : 'bg-[#173B65]/10 text-[#173B65] dark:bg-[#0D9488]/20 dark:text-[#2DD4BF] group-hover:bg-[#173B65]/15'
                  }`}
                >
                  {item.icon(isActive)}
                </div>
              ) : (
                <div
                  className={`w-12 h-7 flex items-center justify-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0D9488]/15 dark:bg-[#0D9488]/25 text-[#0D9488] dark:text-[#2DD4BF]'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon(isActive)}
                </div>
              )}

              {/* Text Label - Short, Crisp, No Overlap */}
              <span
                className={`text-[10px] sm:text-[11px] leading-tight tracking-tight text-center truncate max-w-full px-0.5 mt-0.5 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#0D9488] dark:text-[#2DD4BF] font-black'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

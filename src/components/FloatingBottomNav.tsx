import React, { useRef, useEffect } from 'react';
import { TabType } from '../types.ts';
import {
  Home,
  CheckSquare,
  Users,
  Settings,
  FileSpreadsheet,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext.tsx';

interface FloatingBottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { language } = useTranslation();
  const navContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active item into view horizontally when currentTab changes
  useEffect(() => {
    if (activeItemRef.current && navContainerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentTab]);

  const navItems: {
    tab: TabType;
    labelAm: string;
    labelEn: string;
    icon: (isActive: boolean) => React.ReactNode;
  }[] = [
    {
      tab: 'home',
      labelAm: 'መነሻ',
      labelEn: 'Dashboard',
      icon: (isActive) => (
        <Home
          className={`w-4 h-4 transition-transform duration-200 ${
            isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
          }`}
        />
      ),
    },
    {
      tab: 'attendance',
      labelAm: 'አቴንዳንስ',
      labelEn: 'Roll Call',
      icon: (isActive) => (
        <CheckSquare
          className={`w-4 h-4 transition-transform duration-200 ${
            isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
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
          className={`w-4 h-4 transition-transform duration-200 ${
            isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
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
          className={`w-4 h-4 transition-transform duration-200 ${
            isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
          }`}
        />
      ),
    },
    {
      tab: 'history',
      labelAm: 'ማህደር',
      labelEn: 'History',
      icon: (isActive) => (
        <Calendar
          className={`w-4 h-4 transition-transform duration-200 ${
            isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
          }`}
        />
      ),
    },
    {
      tab: 'data',
      labelAm: 'ስታቲስቲክስ',
      labelEn: 'Analytics',
      icon: (isActive) => (
        <BarChart3
          className={`w-4 h-4 transition-transform duration-200 ${
            isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
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
          className={`w-4 h-4 transition-transform duration-200 ${
            isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
          }`}
        />
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile Floating Navigation"
      style={{
        bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
      }}
      className="md:hidden fixed left-3 right-3 sm:left-auto sm:right-auto sm:max-w-xl sm:inset-x-0 mx-auto z-40 select-none pointer-events-none"
    >
      {/* Floating Telegram-inspired pill bar */}
      <div className="pointer-events-auto bg-white/95 dark:bg-[#151F38]/95 backdrop-blur-xl rounded-2xl sm:rounded-full border border-slate-200/90 dark:border-slate-700/80 shadow-[0_8px_30px_rgba(23,59,101,0.14)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.55)] p-1.5 transition-all">
        <div
          ref={navContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto scroll-smooth scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-1 py-0.5"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            const label = language === 'am' ? item.labelAm : item.labelEn;

            return (
              <button
                key={item.tab}
                ref={isActive ? activeItemRef : undefined}
                type="button"
                onClick={() => onSelectTab(item.tab)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl sm:rounded-full text-xs transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                  isActive
                    ? 'bg-[#173B65] text-white shadow-xs dark:bg-[#0D9488] dark:text-white font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'
                }`}
              >
                <span
                  className={
                    isActive
                      ? 'text-[#2DD4BF] dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                >
                  {item.icon(isActive)}
                </span>
                <span className="tracking-tight">{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] dark:bg-white shrink-0 -ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

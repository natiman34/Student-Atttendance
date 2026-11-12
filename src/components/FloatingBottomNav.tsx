import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TabType } from '../types.ts';
import {
  Home,
  CheckSquare,
  Users,
  Settings,
  FileSpreadsheet,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll bounds for edge fade / arrow controls
  const updateScrollBounds = useCallback(() => {
    const el = navContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    updateScrollBounds();
    const el = navContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollBounds, { passive: true });
    window.addEventListener('resize', updateScrollBounds);
    return () => {
      el.removeEventListener('scroll', updateScrollBounds);
      window.removeEventListener('resize', updateScrollBounds);
    };
  }, [updateScrollBounds]);

  // Auto-scroll active item into view horizontally when currentTab changes
  useEffect(() => {
    if (activeItemRef.current && navContainerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      // Recheck bounds after scroll animation completes
      setTimeout(updateScrollBounds, 300);
    }
  }, [currentTab, updateScrollBounds]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!navContainerRef.current) return;
    const offset = direction === 'left' ? -180 : 180;
    navContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

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
      aria-label="Floating Bottom Navigation"
      style={{
        bottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
      }}
      className="fixed left-3 right-3 sm:left-auto sm:right-auto sm:max-w-2xl sm:inset-x-0 mx-auto z-40 select-none pointer-events-none"
    >
      {/* Floating Telegram-inspired pill dock */}
      <div className="relative pointer-events-auto bg-white/95 dark:bg-[#151F38]/95 backdrop-blur-xl rounded-2xl sm:rounded-full border border-slate-200/90 dark:border-slate-700/80 shadow-[0_10px_35px_rgba(23,59,101,0.16)] dark:shadow-[0_14px_45px_rgba(0,0,0,0.60)] p-1.5 transition-all">
        {/* Left Arrow Button for Tablet / Desktop when scrollable */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Scroll navigation left"
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-white dark:bg-[#1D2A4D] shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Container with All 7 Items Side-by-Side */}
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

        {/* Right Arrow Button for Tablet / Desktop when scrollable */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll navigation right"
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full bg-white dark:bg-[#1D2A4D] shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
};

import React, { useEffect } from 'react';
import { TabType, AppSettings } from '../types.ts';
import {
  Home,
  CheckSquare,
  Users,
  Settings,
  FileSpreadsheet,
  Calendar,
  BarChart3,
  X,
  Download,
  Moon,
  Sun,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { AppLogo } from './AppLogo.tsx';
import { getTodayEthiopian, formatEthiopianDisplay } from '../utils/ethiopianCalendar.ts';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  settings: AppSettings;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onOpenInstallModal?: () => void;
  showToast?: (message: string) => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  settings,
  onUpdateSettings,
  onOpenInstallModal,
  showToast,
}) => {
  const { t, language, setLanguage } = useTranslation();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent background scrolling while drawer is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const navItems: {
    tab: TabType;
    labelAm: string;
    labelEn: string;
    descAm: string;
    descEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      tab: 'home',
      labelAm: 'መነሻ ገጽ',
      labelEn: 'Dashboard',
      descAm: 'አጠቃላይ የክፍል መረጃ እና ማጠቃለያ',
      descEn: 'Overview & daily quick stats',
      icon: <Home className="w-5 h-5" />,
    },
    {
      tab: 'attendance',
      labelAm: 'የዕለት አቴንዳንስ',
      labelEn: 'Roll Call (Attendance)',
      descAm: 'የተማሪዎች መገኘት፣ መቅረትና ፈቃድ',
      descEn: 'Mark student presence & excuses',
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      tab: 'reports',
      labelAm: 'ሪፖርቶችና ሰነዶች',
      labelEn: 'Reports & Exports',
      descAm: 'የዕለት ምገባ፣ አቴንዳንስና ሰነድ ማውረጃ',
      descEn: 'Daily feeding, attendance & downloads',
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      tab: 'students',
      labelAm: 'የተማሪዎች መዝገብ',
      labelEn: 'Students Roster',
      descAm: 'ተማሪዎችን መመዝገብ፣ ማረም እና ማስመጣት',
      descEn: 'Student management & Excel roster',
      icon: <Users className="w-5 h-5" />,
    },
    {
      tab: 'history',
      labelAm: 'የቀናት ማህደር',
      labelEn: 'Attendance History',
      descAm: 'ያለፉ ቀናት አቴንዳንስ መዝገቦች',
      descEn: 'Historical attendance calendar',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      tab: 'data',
      labelAm: 'ስታቲስቲክስና ትንታኔ',
      labelEn: 'Analytics & Insights',
      descAm: 'የተማሪዎች የተሰብሳቢነት ንጽጽር',
      descEn: 'Trends, rates & attendance charts',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      tab: 'settings',
      labelAm: 'ቅንብሮችና ባክአፕ',
      labelEn: 'Settings & Backups',
      descAm: 'ቋንቋ፣ የቀለም ምርጫ፣ ዳታ ማስቀመጫ',
      descEn: 'Preferences, theme & offline backups',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const handleToggleTheme = () => {
    if (!onUpdateSettings) return;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    const newTheme = isDark ? 'light' : 'dark';
    onUpdateSettings({ ...settings, theme: newTheme });
    showToast?.(newTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
  };

  const handleToggleLanguage = () => {
    const nextLang = language === 'en' ? 'am' : 'en';
    setLanguage(nextLang);
    if (onUpdateSettings) {
      onUpdateSettings({ ...settings, language: nextLang });
    }
    showToast?.(
      nextLang === 'am' ? 'ቋንቋ ወደ አማርኛ ተቀይሯል' : 'Language switched to English'
    );
  };

  const todayEthiopian = formatEthiopianDisplay(getTodayEthiopian(), { compact: true });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        role="presentation"
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Side Slide-Out Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={language === 'am' ? 'የአሰሳ ማውጫ' : 'Navigation Menu'}
        className="fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white dark:bg-[#111A30] shadow-2xl flex flex-col border-r border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-left duration-250 ease-out"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <AppLogo
              size="md"
              showText={true}
              subtitle={settings.className || 'Student Attendance & Feeding'}
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Date & Offline Badge Strip */}
        <div className="px-4 py-2.5 bg-teal-500/10 dark:bg-teal-500/15 border-b border-teal-500/20 flex items-center justify-between text-xs">
          <span className="font-semibold text-teal-800 dark:text-teal-300">
            {todayEthiopian}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0D9488] text-white flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>100% Offline</span>
          </span>
        </div>

        {/* Navigation Items List */}
        <nav
          aria-label="Side Navigation Links"
          className="flex-1 overflow-y-auto p-3 space-y-1.5 focus:outline-hidden"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            const label = language === 'am' ? item.labelAm : item.labelEn;
            const desc = language === 'am' ? item.descAm : item.descEn;

            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => {
                  onSelectTab(item.tab);
                  onClose();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full text-left px-3.5 py-3 rounded-2xl flex items-center gap-3.5 transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-50 to-emerald-50/60 dark:from-teal-950/60 dark:to-slate-800/60 text-[#0D9488] dark:text-[#2DD4BF] font-black border-l-4 border-[#0D9488] dark:border-[#2DD4BF] shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold border-l-4 border-transparent'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive
                      ? 'bg-[#0D9488] text-white shadow-xs shadow-[#0D9488]/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-[#0D9488] dark:group-hover:text-[#2DD4BF]'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-tight truncate block">
                      {label}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#0D9488]/20 dark:bg-[#0D9488]/30 text-[#0D9488] dark:text-[#2DD4BF]">
                        {language === 'am' ? 'አሁን ያለበት' : 'Active'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5 font-normal">
                    {desc}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer with Quick Actions */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2.5">
          {/* Chrome Download App Option */}
          {onOpenInstallModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInstallModal();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0D9488] hover:bg-[#0B7A70] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {language === 'am' ? 'አፕ አውርድ (Google Chrome)' : 'Download App (Google Chrome)'}
              </span>
            </button>
          )}

          {/* Quick Language & Theme Controls */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleToggleLanguage}
              className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{language === 'am' ? 'English' : 'አማርኛ'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-500 hidden dark:inline" />
              <Sun className="w-3.5 h-3.5 text-amber-500 dark:hidden inline" />
              <span>{settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

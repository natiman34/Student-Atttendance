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
  const { t } = useTranslation();

  const navItems: { tab: TabType; label: string; icon: React.ReactNode; isAttendance?: boolean }[] = [
    {
      tab: 'home',
      label: t.navHome,
      icon: <Home className="w-5 h-5" />,
    },
    {
      tab: 'students',
      label: t.navStudents,
      icon: <Users className="w-5 h-5" />,
    },
    {
      tab: 'attendance',
      label: t.navAttendance,
      icon: <CheckSquare className="w-5 h-5" />,
      isAttendance: true,
    },
    {
      tab: 'reports',
      label: t.navReports,
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      tab: 'settings',
      label: t.navSettings,
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 dark:bg-[#151F38]/98 backdrop-blur-xl border-t border-[#E2E8F0] dark:border-[#2B3A67] shadow-[0_-4px_24px_rgba(23,59,101,0.08)] transition-colors duration-200"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pt-1.5 pb-1">
        {navItems.map((item) => {
          // If current tab is history or data (stats), treat 'reports' as active group
          const isActive =
            currentTab === item.tab ||
            (item.tab === 'reports' && (currentTab === 'history' || currentTab === 'data'));

          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onSelectTab(item.tab)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[50px] rounded-2xl transition-all duration-150 relative cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                isActive
                  ? 'text-[#173B65] dark:text-[#38BDF8] font-bold'
                  : 'text-[#64748B] hover:text-[#173B65] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] font-medium'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.isAttendance ? (
                <div
                  className={`w-11 h-8 flex items-center justify-center rounded-xl transition-all duration-150 shadow-2xs ${
                    isActive
                      ? 'bg-[#173B65] text-white dark:bg-[#38BDF8] dark:text-[#0B132B]'
                      : 'bg-[#173B65]/10 text-[#173B65] dark:bg-[#2B3A67] dark:text-[#38BDF8]'
                  }`}
                >
                  {item.icon}
                </div>
              ) : (
                <div
                  className={`w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-[#173B65]/10 text-[#173B65] dark:bg-[#2B3A67] dark:text-[#38BDF8]'
                      : 'hover:bg-[#F4F7FB] dark:hover:bg-[#1D2A4D]'
                  }`}
                >
                  {item.icon}
                </div>
              )}
              <span className="text-[11px] leading-tight tracking-tight mt-0.5 truncate max-w-full font-semibold">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-[#0D9488] dark:bg-[#2DD4BF]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Visual Logo SVG */}
      <div
        className={`${sizeMap[size]} shrink-0 rounded-xl overflow-hidden shadow-xs ring-1 ring-emerald-600/20`}
      >
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#173B65" />
              <stop offset="60%" stopColor="#124E78" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="116" fill="url(#logoBg)" />
          <circle cx="256" cy="256" r="215" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="6" />
          <g transform="translate(0, -6)">
            {/* Book Base (Education & Attendance) */}
            <path
              d="M 120 330 C 170 300, 230 310, 256 328 C 282 310, 342 300, 392 330 L 392 372 C 342 342, 282 352, 256 370 C 230 352, 170 342, 120 372 Z"
              fill="#ffffff"
              opacity="0.95"
            />
            <path d="M 256 328 L 256 370" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
            {/* Feeding Bowl (Nourishment & Community Service) */}
            <path d="M 160 230 C 160 295, 352 295, 352 230 Z" fill="url(#logoGold)" />
            <ellipse cx="256" cy="230" rx="96" ry="16" fill="#fde68a" />
            {/* Care Heart & Sprout */}
            <path
              d="M 256 185 C 246 160, 218 160, 218 185 C 218 206, 256 226, 256 226 C 256 226, 294 206, 294 185 C 294 160, 266 160, 256 185 Z"
              fill="#ffffff"
            />
            <circle cx="188" cy="172" r="8" fill="#fef08a" />
            <circle cx="324" cy="172" r="8" fill="#fef08a" />
            <circle cx="256" cy="138" r="6" fill="#fef08a" />
            <path d="M 256 370 L 272 414 L 256 404 L 240 414 Z" fill="#f59e0b" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            RollCall
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px] sm:max-w-none hidden min-[380px]:inline">
            {subtitle || 'Student Attendance & Daily Feeding'}
          </span>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Download,
  X,
  Laptop,
  Smartphone,
  CheckCircle,
  Copy,
  ExternalLink,
  Share2,
  Sparkles,
  ShieldCheck,
  FileCode,
  PackageCheck,
  AlertTriangle,
  ArrowDownToLine,
  Layers,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { useTranslation } from '../i18n/LanguageContext.tsx';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  appUrl,
}) => {
  const { language } = useTranslation();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'desktop' | 'ios'>('apk');

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111A33] rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-[#173B65] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20 shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                {language === 'am' ? 'ሮልኮል አንድሮይድ አፕን ያውርዱ እና ይጫኑ' : 'Download & Install RollCall'}
              </h2>
              <p className="text-xs text-emerald-100">
                {language === 'am'
                  ? 'ራሱን የቻለ አንድሮይድ APK እና ዌብ አፕ (Standalone Android APK & PWA)'
                  : 'Standalone Android APK & Web Application'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100 dark:bg-[#1A2544] border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-1 rounded-xl text-center transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'APK ማውረጃ' : 'Android APK'}</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-2 px-1 rounded-xl text-center transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'Chrome ዌብ' : 'Chrome Web'}</span>
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`py-2 px-1 rounded-xl text-center transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`py-2 px-1 rounded-xl text-center transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>iOS/Safari</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: STANDALONE ANDROID APK (User's primary requirement) */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-950/40 dark:to-cyan-950/20 border-2 border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" /> {language === 'am' ? 'የተረጋገጠ ቋሚ አፕ' : 'Verified Native App'}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                      {language === 'am' ? 'የተፈረመ የአንድሮይድ APK (Signed Release APK)' : 'Signed Android Release APK'}
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {language === 'am'
                        ? 'በቀጥታ ወደ ማንኛውም አንድሮይድ ስልክ የሚጫን ራሱን የቻለ አፕ። ያለ ኢንተርኔት በ100% ይሰራል!'
                        : 'Standalone native Android app. Fully pre-compiled, signed, and runs 100% offline.'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-1 rounded-lg">
                    17 MB
                  </span>
                </div>

                {/* Primary Download Button */}
                <a
                  href="/downloads/RollCall-Release.apk"
                  download="RollCall-Release.apk"
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 active:scale-98 transition cursor-pointer text-xs sm:text-sm"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>
                    {language === 'am'
                      ? 'የተፈረመውን APK አውርድ (RollCall-Release.apk)'
                      : 'Download Signed Release APK (RollCall-Release.apk)'}
                  </span>
                </a>
              </div>

              {/* Secondary APK / Bundle Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Debug APK */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-blue-500" />
                      <span>Debug APK</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'am' ? 'ለሙከራና ለምርመራ (18 MB)' : 'For developer testing (18 MB)'}
                    </p>
                  </div>
                  <a
                    href="/downloads/RollCall-Debug.apk"
                    download="RollCall-Debug.apk"
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    <span>Debug</span>
                  </a>
                </div>

                {/* AAB Bundle */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      <span>Google Play AAB</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'am' ? 'ለፕሌይ ስቶር ማሰራጫ (17 MB)' : 'For Play Console (17 MB)'}
                    </p>
                  </div>
                  <a
                    href="/downloads/RollCall-Release.aab"
                    download="RollCall-Release.aab"
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shrink-0"
                  >
                    <PackageCheck className="w-3 h-3" />
                    <span>Bundle</span>
                  </a>
                </div>
              </div>

              {/* Step-by-Step Android Installation Guide */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'am'
                      ? 'የAPK መጫኛ ቀላል መመሪያ (Android Phone Installation Guide)'
                      : 'Android Phone Installation Guide'}
                  </span>
                </h4>

                <div className="space-y-2.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p>
                      {language === 'am'
                        ? 'ከላይ ያለውን አረንጓዴ «የተፈረመውን APK አውርድ» የሚለውን ይጫኑ።'
                        : 'Tap the green "Download Signed Release APK" button above.'}
                    </p>
                  </div>

                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <p>
                        {language === 'am'
                          ? 'ጎግል ክሮም «File might be harmful» (ፋይሉ አደገኛ ሊሆን ይችላል) ካለዎት «Download anyway» የሚለውን ይምረጡ።'
                          : 'If Chrome warns "File might be harmful", tap "Download anyway".'}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        ({language === 'am' ? 'ይህ ለሁሉም ከፕሌይስቶር ውጭ ለሚወርዱ APK ፋይሎች የሚታይ መደበኛ ማስጠንቀቂያ ነው።' : 'Standard Android security prompt for direct downloads.'})
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <p>
                      {language === 'am'
                        ? 'ወርዶ ሲያበቃ «Open» (ክፈት) የሚለውን ይጫኑ።'
                        : 'Once downloaded, tap "Open" (or open the APK from your phone\'s Notifications or Downloads).'}
                    </p>
                  </div>

                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <p>
                      {language === 'am'
                        ? 'ስልክዎ «Install unknown apps» (ያልታወቁ አፖችን መጫን ፍቀድ) ብሎ ከጠየቀ ወደ Settings ገብተው ለክሮም ፍቃድ ይስጡ (Allow from this source)፣ ከዚያም «Install» (ጫን) ይጫኑ።'
                        : 'If prompted to "Install unknown apps", tap Settings, toggle "Allow from this source", and tap "Install".'}
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {language === 'am'
                      ? 'እንኳን ደስ አለዎት! ሮልኮል በስልክዎ መነሻ ገጽ ላይ እንደ ቋሚ አፕ ተጭኗል።'
                      : 'Done! RollCall is installed as a native app on your Android home screen.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PWA IN CHROME */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {isInstallable && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5" /> {language === 'am' ? 'በአንድ ጠቅታ መጫን ይቻላል' : '1-Click Install Available'}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {language === 'am' ? 'መሳሪያዎ አፑን በቀጥታ ወደ ስልክዎ መጫን ይደግፋል!' : 'Your browser supports direct installation to home screen!'}
                    </p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> {language === 'am' ? 'አፕ ጫን' : 'Install App'}
                  </button>
                </div>
              )}

              {isInstalled && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black">
                      {language === 'am' ? 'ሮልኮል ራሱን በቻለ አፕነት ተጭኗል!' : 'RollCall is installed as a Standalone App!'}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      {language === 'am' ? 'አፑ በስልክዎ/በኮምፒውተርዎ ላይ ተጭኗል። ያለ ኢንተርኔት በራሱ ይሰራል።' : 'The app is running offline in standalone mode on your device.'}
                    </p>
                  </div>
                </div>
              )}

              {/* App URL Link Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'am' ? 'የአፑ ዌብ አድራሻ (Web Link):' : 'Application Web Link:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-1 font-mono text-slate-800 dark:text-slate-200 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                    title="Copy link to clipboard"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? (language === 'am' ? 'ኮፒ ተደርጓል!' : 'Copied!') : (language === 'am' ? 'ሊንኩን ኮፒ አድርግ' : 'Copy Link')}
                  </button>
                  <a
                    href={appUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Chrome on Android manual steps */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {language === 'am' ? 'ሊንኩን በስልክዎ Google Chrome ውስጥ ይክፈቱት።' : 'Open the application link in Google Chrome on your Android phone.'}
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {language === 'am' ? 'በላይኛው ቀኝ ጥግ ያሉትን 3 ነጥቦች (⋮) ይንኩ።' : 'Tap the three-dots menu (⋮) in the top-right corner of Chrome.'}
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {language === 'am' ? '«አፕ ጫን» (Install app) ወይም «ወደ መነሻ ገጽ አክል» (Add to Home screen) የሚለውን ይምረጡ።' : 'Select "Install app" or "Add to Home screen".'}
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {language === 'am' ? '«ጫን» የሚለውን ያረጋግጡ። አፑ ወዲያውኑ በመነሻ ገጽዎ ላይ ይቀመጣል!' : 'Confirm "Install". The RollCall icon will appear on your home screen and open directly as an app!'}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>{language === 'am' ? 'የፍቃድ (403) ማስታወሻ:' : 'Access Notice (403 fix):'}</strong>{' '}
                    {language === 'am'
                      ? 'በስልክዎ Chrome ላይ «403 That’s an error» ካለዎት በቀጥታ ከላይ ያለውን የAPK ማውረጃ ተጠቅመው መጫን ይችላሉ። APK ምንም ዓይነት የጎግል ፈቃድ ወይም ኢንተርኔት አይፈልግም!'
                      : 'If Chrome displays "403 Forbidden" due to Google login, download the standalone Signed APK instead, which has no login requirement and works 100% offline!'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESKTOP */}
          {activeTab === 'desktop' && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  Open the application link on your computer in Google Chrome, Microsoft Edge, or Brave.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  Look for the <strong>Install App</strong> icon (desktop computer or plus badge) in the URL address bar.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  Click <strong>Install</strong>. A standalone desktop window opens with an app shortcut on your desktop!
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: IOS / SAFARI */}
          {activeTab === 'ios' && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  Open the web link in <strong>Safari</strong> on your iPhone or iPad.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  Tap the <strong>Share</strong> button (box with an arrow pointing upwards) in the bottom toolbar.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  Scroll down and tap <strong>Add to Home Screen (ወደ መነሻ ገጽ አክል)</strong>, then tap <strong>Add</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#111A33] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            RollCall Mobile v1.0 • Android 8.0+
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {language === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

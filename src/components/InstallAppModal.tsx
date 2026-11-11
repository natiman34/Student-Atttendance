import React, { useState } from 'react';
import {
  Download,
  X,
  CheckCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Globe,
  AlertCircle,
  FileCheck,
  RefreshCw,
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
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const sharedPublicUrl = 'https://ais-pre-77mkgbnlv2haaguuixrahj-722978092860.europe-west2.run.app';

  const handleCopyLink = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy).then(() => {
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

  const handleDownloadAppPackage = async () => {
    setDownloadStatus('downloading');
    setDownloadProgress(0);
    setErrorMessage('');

    try {
      const fileUrl = '/downloads/RollCall-App-Package.zip';
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Download failed (${response.status}: ${response.statusText})`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 1464424; // ~1.4 MB

      if (!response.body) {
        // Fallback for browsers without streaming body
        const blob = await response.blob();
        triggerBlobDownload(blob);
        setDownloadProgress(100);
        setDownloadStatus('completed');
        return;
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            const percent = Math.min(100, Math.round((received / total) * 100));
            setDownloadProgress(percent);
          }
        }
      }

      setDownloadProgress(100);
      const combined = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const blob = new Blob([combined], { type: 'application/zip' });
      triggerBlobDownload(blob);
      setDownloadStatus('completed');
    } catch (err: unknown) {
      console.error('Download error:', err);
      setDownloadStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : (language === 'am' ? 'ፋይሉን ማውረድ አልተቻለም። እባክዎ እንደገና ይሞክሩ።' : 'Failed to download the app package. Please try again.')
      );
    }
  };

  const triggerBlobDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'RollCall-App-Package.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0D9488] via-[#115E59] to-[#173B65] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {language === 'am' ? 'የጎግል ክሮም አፕ ማውረጃ' : 'Download App (Google Chrome)'}
              </h2>
              <p className="text-xs text-teal-100">
                {language === 'am' ? 'ለአንድሮይድ ስልክ እና ኮምፒውተር በGoogle Chrome' : 'For Android phones & desktop via Google Chrome'}
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Download Card */}
          <div className="bg-gradient-to-b from-teal-50/70 to-emerald-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border-2 border-[#0D9488]/40 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF]" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {language === 'am' ? 'የአፑን ጥቅል ፋይል ያውርዱ' : 'Download Application Package'}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0D9488] text-white">
                1.4 MB
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'am'
                ? 'የተሟላውን የሮልኮል ፕሮግራም ፋይል (HTML, JavaScript, CSS እና የአማርኛ ፎንቶች) በቀጥታ ወደ ስልክዎ ወይም ኮምፒውተርዎ ያውርዱ።'
                : 'Direct download of the complete verified application bundle with all code, styles, and Ethiopic fonts.'}
            </p>

            {/* Download Progress Bar */}
            {downloadStatus === 'downloading' && (
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF]">
                  <span>{language === 'am' ? 'ፋይሉ በመውረድ ላይ ነው...' : 'Downloading app package...'}</span>
                  <span>{downloadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0D9488] h-full transition-all duration-150 ease-out rounded-full"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message if download fails */}
            {downloadStatus === 'error' && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-800 dark:text-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  type="button"
                  onClick={handleDownloadAppPackage}
                  className="px-2 py-1 bg-red-100 dark:bg-red-900 rounded-lg font-bold text-[11px] hover:bg-red-200 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 inline mr-1" />
                  {language === 'am' ? 'እንደገና ሞክር' : 'Retry'}
                </button>
              </div>
            )}

            {/* Completed Notice */}
            {downloadStatus === 'completed' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                <FileCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold flex-1">
                  {language === 'am' ? 'ፋይሉ (RollCall-App-Package.zip) በተሳካ ሁኔታ ወርዷል!' : 'File (RollCall-App-Package.zip) downloaded successfully!'}
                </span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleDownloadAppPackage}
              disabled={downloadStatus === 'downloading'}
              className="w-full py-3 px-4 bg-[#0D9488] hover:bg-[#0B7A70] disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-[#0D9488]/30 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>
                {downloadStatus === 'downloading'
                  ? (language === 'am' ? 'በመውረድ ላይ... ' + downloadProgress + '%' : 'Downloading... ' + downloadProgress + '%')
                  : downloadStatus === 'completed'
                  ? (language === 'am' ? 'እንደገና አውርድ (RollCall-App-Package.zip)' : 'Download Again (RollCall-App-Package.zip)')
                  : (language === 'am' ? 'አፕ አውርድ (RollCall-App-Package.zip)' : 'Download App (RollCall-App-Package.zip)')}
              </span>
            </button>
          </div>

          {/* 1-Click Install Button in Chrome (if supported) */}
          {isInstallable && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  {language === 'am' ? 'በቀጥታ በChrome መጫን ይቻላል' : 'Direct Chrome Install Available'}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {language === 'am' ? 'አፑን በስልክዎ መነሻ ገጽ ላይ በአንድ ጠቅታ ይጫኑ' : 'Install directly to your home screen with 1 click'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'am' ? 'አፕ ጫን' : 'Install App'}</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-black">
                  {language === 'am' ? 'አፑ በስልክዎ ላይ ተጭኗል!' : 'RollCall is installed as a Standalone App!'}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  {language === 'am' ? 'አፑ በመነሻ ገጽዎ ላይ ይገኛል፤ ያለ ኢንተርኔት ይሰራል' : 'Available on your home screen and works offline'}
                </p>
              </div>
            </div>
          )}

          {/* Installation Instructions for Google Chrome on Android Phones */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
            <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#0D9488]" />
              <span>
                {language === 'am'
                  ? 'በአንድሮይድ ስልክ በGoogle Chrome የመጫኛ መመሪያ፡'
                  : 'How to Install via Google Chrome on Android:'}
              </span>
            </h4>

            <div className="space-y-2.5">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-[#0D9488] dark:text-[#2DD4BF] font-black flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {language === 'am'
                    ? 'ሊንኩን በስልክዎ Google Chrome ውስጥ ይክፈቱት።'
                    : 'Open the link in Google Chrome on your Android phone.'}
                </p>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-[#0D9488] dark:text-[#2DD4BF] font-black flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {language === 'am'
                    ? 'በላይኛው ቀኝ ጥግ ያሉትን 3 ነጥቦች (⋮) ይንኩ።'
                    : 'Tap the 3 dots menu (⋮) in the top-right corner of Chrome.'}
                </p>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-[#0D9488] dark:text-[#2DD4BF] font-black flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {language === 'am'
                    ? '«አፕ ጫን» (Install app) ወይም «ወደ መነሻ ገጽ አክል» (Add to Home screen) የሚለውን ይምረጡ።'
                    : 'Select "Install app" or "Add to Home screen" from the menu.'}
                </p>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-[#0D9488] dark:text-[#2DD4BF] font-black flex items-center justify-center shrink-0 text-[11px]">
                  4
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {language === 'am'
                    ? '«ጫን» የሚለውን ያረጋግጡ። አፑ ወዲያውኑ በመነሻ ገጽዎ ላይ ይቀመጣል!'
                    : 'Confirm "Install". The app will appear on your home screen and open directly!'}
                </p>
              </div>
            </div>
          </div>

          {/* Direct Chrome Link with Copy Button */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              {language === 'am' ? 'የGoogle Chrome ሊንክ (Chrome App Link):' : 'Google Chrome Link:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sharedPublicUrl}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 flex-1 font-mono text-slate-800 dark:text-slate-200 select-all"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(sharedPublicUrl)}
                className="px-3 py-2 bg-[#0D9488] hover:bg-[#0B7A70] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer active:scale-95"
                title="Copy link"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (language === 'am' ? 'ኮፒ ተደርጓል!' : 'Copied!') : (language === 'am' ? 'ኮፒ' : 'Copy')}</span>
              </button>
              <a
                href={sharedPublicUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {language === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect browser & OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Universal browser support
    const isChromeBrowser = /chrome|chromium|crios|android/.test(userAgent);
    setIsChrome(isChromeBrowser);

    // Check if prompt was already captured before React mounted
    const earlyPrompt = (window as unknown as { __deferredInstallPrompt?: BeforeInstallPromptEvent }).__deferredInstallPrompt;
    if (earlyPrompt) {
      setDeferredPrompt(earlyPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as unknown as { __deferredInstallPrompt?: BeforeInstallPromptEvent }).__deferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleCustomPromptReady = () => {
      const promptEvent = (window as unknown as { __deferredInstallPrompt?: BeforeInstallPromptEvent }).__deferredInstallPrompt;
      if (promptEvent) {
        setDeferredPrompt(promptEvent);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as unknown as { __deferredInstallPrompt?: BeforeInstallPromptEvent | null }).__deferredInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('app-install-prompt-ready', handleCustomPromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('app-install-prompt-ready', handleCustomPromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isChrome,
    install,
  };
}

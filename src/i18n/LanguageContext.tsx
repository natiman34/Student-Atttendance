import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, Translations } from './translations.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const STORAGE_KEY_LANGUAGE = 'rollcall_language';

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LANGUAGE);
      if (stored === 'am' || stored === 'en') {
        return stored;
      }
      // Check rollcall_settings_v2 as well
      const settingsStored = localStorage.getItem('rollcall_settings_v2');
      if (settingsStored) {
        const parsed = JSON.parse(settingsStored);
        if (parsed.language === 'am' || parsed.language === 'en') {
          return parsed.language;
        }
      }
    } catch {
      // ignore
    }
    return 'en'; // English is default for first-time users
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
      // Sync with settings in storage
      const settingsStored = localStorage.getItem('rollcall_settings_v2');
      if (settingsStored) {
        const parsed = JSON.parse(settingsStored);
        parsed.language = lang;
        localStorage.setItem('rollcall_settings_v2', JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
    // Update html lang attribute
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import translationsData from './translations.json';

type Language = 'en' | 'mr' | 'hi';
type FontSize = 'sm' | 'md' | 'lg';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (hc: boolean) => void;
  toggleHighContrast: () => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('udyograth_lang') as Language) || 'en';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('udyograth_font_size') as FontSize) || 'md';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('udyograth_contrast') === 'high';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('udyograth_lang', lang);
    document.body.setAttribute('lang', lang);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('udyograth_font_size', size);
    const root = document.documentElement;
    if (size === 'sm') root.style.setProperty('--font-base-size', '14px');
    else if (size === 'lg') root.style.setProperty('--font-base-size', '18px');
    else root.style.setProperty('--font-base-size', '16px');
  };

  const setHighContrast = (hc: boolean) => {
    setHighContrastState(hc);
    localStorage.setItem('udyograth_contrast', hc ? 'high' : 'normal');
    if (hc) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const toggleHighContrast = () => setHighContrast(!highContrast);

  useEffect(() => {
    document.body.setAttribute('lang', language);
    setFontSize(fontSize);
    if (highContrast) document.body.classList.add('high-contrast');
  }, []);

  const t = (key: string): string => {
    const dict = (translationsData as any)[language] || (translationsData as any)['en'];
    return dict[key] || (translationsData as any)['en'][key] || key;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        toggleHighContrast,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

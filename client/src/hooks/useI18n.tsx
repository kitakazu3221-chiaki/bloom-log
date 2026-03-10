import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { translations, type Locale, type Translations } from "../i18n";

interface I18nContextValue {
  t: Translations;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const STORAGE_KEY = "bloom-log-locale";

function detectLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "ja" || saved === "en") return saved;
  return navigator.language.startsWith("ja") ? "ja" : "en";
}

const I18nContext = createContext<I18nContextValue>({
  t: translations.ja,
  locale: "ja",
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  return (
    <I18nContext.Provider value={{ t: translations[locale], locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  translations,
  LANGS,
  type Translation,
  type LangCode,
} from "@/i18n/translations";
import { detectLanguage } from "@/i18n/detect";

interface LanguageContextValue {
  lang: LangCode;
  /** Active language option (for the flag + short code in the switcher). */
  current: (typeof LANGS)[number];
  t: Translation;
  LANGS: typeof LANGS;
  changeLanguage: (code: LangCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/**
 * A previously chosen language wins; otherwise the device locale / location
 * decides. This runs during the first render (not in an effect), so the site
 * opens in the right language before the user ever sees it.
 */
function readInitialLang(): LangCode {
  try {
    const stored = localStorage.getItem("ls_lang");
    if (stored && LANGS.some((l) => l.code === stored)) return stored;
  } catch {
    /* ignore */
  }
  return detectLanguage();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>(readInitialLang);

  const changeLanguage = (code: LangCode) => {
    setLang(code);
    try {
      localStorage.setItem("ls_lang", code);
    } catch {
      /* ignore */
    }
  };

  /* Keep <html lang> in sync for screen readers, hyphenation and fonts. */
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang] ?? translations.en;
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <LanguageContext.Provider value={{ lang, current, t, LANGS, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

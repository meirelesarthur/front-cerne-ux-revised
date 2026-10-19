import { LanguageContextTypes } from "@/@types/language";
import { getLanguageGB, saveLanguageGB } from "@/utils/auth-token";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { createContext } from "use-context-selector";

interface LanguageProviderProps {
  children: ReactNode;
}

interface LanguageContextType {
  languageGB: LanguageContextTypes | undefined;
  updateLanguageGB: (languageGB: LanguageContextTypes) => void;
}

const LanguageContext = createContext({} as LanguageContextType);

function LanguageProvider({ children }: LanguageProviderProps) {
  const language = getLanguageGB();
  const [languageGB, setLanguage] = useState<LanguageContextTypes | undefined>(
    language || "BR"
  );

  function updateLanguageGB(languageGB: LanguageContextTypes) {
    saveLanguageGB(languageGB);
    setLanguage(languageGB);
  }

  useEffect(() => {
    if (!language) {
      saveLanguageGB("BR");
      setLanguage("BR");
    }
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        languageGB,
        updateLanguageGB,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export { LanguageContext, LanguageProvider };

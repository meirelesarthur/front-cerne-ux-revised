import { useContextSelector } from "use-context-selector";
import { LanguageContext } from "@/contexts/LanguageContext";
import { getLanguageRouter } from "@/utils/get-language-route";
import { languageContextTypes } from "@/constants/languages";
import { getLanguageGB } from "@/utils/auth-token";

export function useLanguage() {
  const languageInUse = getLanguageGB();
  const languageGB = getLanguageRouter(
    languageInUse! || languageContextTypes.BR
  );

  const updateLanguageGB = useContextSelector(
    LanguageContext,
    (languageGB) => languageGB.updateLanguageGB
  );

  return {
    languageInUse: languageInUse,
    languageGB: languageGB!,
    updateLanguageGB,
  };
}

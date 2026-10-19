import { LanguageContextTypes } from "@/@types/language";
import { languages } from "@/constants/languages";

export function getLanguageRouter(language: LanguageContextTypes) {
  const languageRouter = languages[language];

  if (!languageRouter) {
    throw new Error(`Unhandled language: ${language}`);
  }

  return languageRouter;
}

// src/hooks/useLanguageSwitcher.tsx
// Hook compartilhado de troca de idioma (menu da conta / NavRail).
// Centraliza updateLanguageGB + persistência no perfil, evitando duplicação.
//
// Execução 071, TASK-071-FE-01 (SRF-071-06e/13, contrato de tela §6.4,
// AD-FE-06) — a persistência deixou de chamar `updateProfile` (`PATCH
// /auth/profile`, rota INEXISTENTE — DIV-09, C-F09/F10/F11) e passou a
// chamar `PUT /me/preferences` via `me-service.ts` (contrato API §5). A
// troca LOCAL continua imediata (`updateLanguageGB` + localStorage) e NUNCA
// é revertida por uma falha do PUT — só avisa (toaster warning) e loga.

import { useCallback } from "react";

import { useLanguage } from "@/hooks/useLanguage";
import { updatePreferences } from "@/services/v2/Me/me-service";

import { toaster } from "@/components/ui/toaster";

import type { UserLangApi } from "@/@types/v2/Me";

export type LanguageCode = "US" | "BR" | "ES";

export const languageFlags: Record<LanguageCode, string> = {
  US: "🇺🇸",
  BR: "🇧🇷",
  ES: "🇪🇸",
};

/** Front (`BR|US|ES`) → API (`pt-BR|en|es`) — contrato API §5. */
const API_LANG_MAP: Record<LanguageCode, UserLangApi> = {
  BR: "pt-BR",
  US: "en",
  ES: "es",
};

export function useLanguageSwitcher() {
  const { languageInUse, languageGB, updateLanguageGB } = useLanguage();

  const handleLanguageChange = useCallback(
    (lang: LanguageCode) => {
      // Troca local imediata — preservada tal qual, nunca revertida abaixo.
      updateLanguageGB(lang);

      updatePreferences({ lang: API_LANG_MAP[lang] }).catch((err) => {
        console.error("Não foi possível persistir o idioma na conta:", err);
        toaster.create({
          type: "warning",
          description: languageGB.common.accountMenu.languagePersistWarning,
        });
      });
    },
    [updateLanguageGB, languageGB]
  );

  return { languageInUse, handleLanguageChange };
}

export default useLanguageSwitcher;

// src/constants/diet/diet-type.ts
// Enum client-side do campo `type` de Dieta (Diet — Operacional/Pecuária,
// TASK-FE-DIET-01). Mirror EXATO de `foods/food-type.ts` — mesmos 2 casos
// (`P`=Porcentagem/`U`=Unidade), default server-side `U` (`App\Enums\
// DietType`, confirmado por leitura direta, `app/Enums/DietType.php`) — ⚠️
// DIVERGE do default de `Food` (`P`); o form de Dieta (TASK-FE-DIET-03) usa
// `U` como `defaultValues.type` no create.

import type { LanguageDate } from '@/@types/language';

export type DietType = 'P' | 'U';

export const DIET_TYPE = {
  PERCENTAGE: 'P',
  UNIT: 'U',
} as const;

export const DIET_TYPES: DietType[] = [DIET_TYPE.PERCENTAGE, DIET_TYPE.UNIT];

/**
 * Rótulo do enum `DietType`, SEMPRE via i18n (nunca hardcoded) — consumido
 * pela fábrica de opções (`options/diet-type-options.ts`) e por qualquer
 * exibição direta do tipo fora de Select.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Record<DietType, string>} Mapa `DietType` → rótulo traduzido.
 */
export const dietTypeLabel = (languageGB: LanguageDate): Record<DietType, string> => ({
  P: languageGB.diets.diet.form.typeOptions.percentage,
  U: languageGB.diets.diet.form.typeOptions.unit,
});

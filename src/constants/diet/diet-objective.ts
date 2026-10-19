// src/constants/diet/diet-objective.ts
// Enum client-side do campo `objective` de Dieta (Diet — Operacional/
// Pecuária, TASK-FE-DIET-01). Mirror estrutural de `foods/food-type.ts` —
// união literal DECLARADA DE NOVO aqui (decoupling: este arquivo não depende
// de import cruzado de `@/@types/v2/Diets`).
//
// `AD`=Adaptação, `CR`=Crescimento, `TE`=Terminação — confirmado por leitura
// direta de `App\Enums\DietObjective` (worktree `diet-api`,
// `app/Enums/DietObjective.php`).

import type { LanguageDate } from '@/@types/language';

export type DietObjective = 'AD' | 'CR' | 'TE';

export const DIET_OBJECTIVE = {
  ADAPTATION: 'AD',
  GROWTH: 'CR',
  TERMINATION: 'TE',
} as const;

export const DIET_OBJECTIVES: DietObjective[] = [
  DIET_OBJECTIVE.ADAPTATION,
  DIET_OBJECTIVE.GROWTH,
  DIET_OBJECTIVE.TERMINATION,
];

/**
 * Rótulo do enum `DietObjective`, SEMPRE via i18n (nunca hardcoded) —
 * consumido pela fábrica de opções (`options/diet-objective-options.ts`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Record<DietObjective, string>} Mapa `DietObjective` → rótulo traduzido.
 */
export const dietObjectiveLabel = (languageGB: LanguageDate): Record<DietObjective, string> => ({
  AD: languageGB.diets.diet.form.objectiveOptions.adaptation,
  CR: languageGB.diets.diet.form.objectiveOptions.growth,
  TE: languageGB.diets.diet.form.objectiveOptions.termination,
});

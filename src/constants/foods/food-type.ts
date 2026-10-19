// src/constants/foods/food-type.ts
// Enum client-side do campo `type` de Formulação (Food — Fábrica/Ração,
// TASK-FOOD-FE-01). Mirror estrutural de `movement-status.ts` — união
// literal DECLARADA DE NOVO aqui (decoupling: este arquivo não depende de
// import cruzado de `@/@types/v2/Foods`, mesma convenção de
// `MovementTypeCode`/`AccountTypeCode`).
//
// `P` (Porcentagem) / `U` (Unidade) — Food-contrato.md §3.3 (`FoodTypeEnum`).
// O rótulo de tela muda dinamicamente conforme `type` (regra de UX,
// `_forms.blade.php:146-156`, aplicada pelo formulário em
// `TASK-FOOD-FE-06`) — este arquivo só concentra o enum + o mapa de label
// via i18n (`foodTypeLabel`), NUNCA hardcoded.

import type { LanguageDate } from '@/@types/language';

export type FoodType = 'P' | 'U';

export const FOOD_TYPE = {
  PERCENTAGE: 'P',
  UNIT: 'U',
} as const;

export const FOOD_TYPES: FoodType[] = [FOOD_TYPE.PERCENTAGE, FOOD_TYPE.UNIT];

/**
 * Rótulo do enum `FoodType`, SEMPRE via i18n (nunca hardcoded) — consumido
 * pela fábrica de opções (`options/food-type-options.ts`) e por qualquer
 * exibição direta do tipo fora de Select (ex.: badge da grid,
 * `TASK-FOOD-FE-05`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Record<FoodType, string>} Mapa `FoodType` → rótulo traduzido.
 */
export const foodTypeLabel = (languageGB: LanguageDate): Record<FoodType, string> => ({
  P: languageGB.foods.food.form.typeOptions.percentage,
  U: languageGB.foods.food.form.typeOptions.unit,
});

// src/constants/food-beats/food-beat-type.ts
// Enum client-side do campo `type` de Batida (FoodBeat — Fábrica,
// TASK-FB-FE-01). Mirror estrutural de `@/constants/foods/food-type.ts` —
// união literal DECLARADA DE NOVO aqui (decoupling: este arquivo não depende
// de import cruzado de `@/@types/v2/FoodBeats`).
//
// `F` (Formulação) / `E` (Estoque) — FoodBeat-contrato.md §3.3
// (`FoodBeatTypeEnum`). O rótulo de tela é resolvido via i18n
// (`foodBeatTypeLabel`), NUNCA hardcoded.

import type { LanguageDate } from '@/@types/language';

export type FoodBeatType = 'F' | 'E';

export const FOOD_BEAT_TYPE = {
  FORMULATION: 'F',
  STOCK: 'E',
} as const;

export const FOOD_BEAT_TYPES: FoodBeatType[] = [FOOD_BEAT_TYPE.FORMULATION, FOOD_BEAT_TYPE.STOCK];

/**
 * Rótulo do enum `FoodBeatType`, SEMPRE via i18n (nunca hardcoded) —
 * consumido pela fábrica de opções (`options/food-beat-type-options.ts`) e
 * por qualquer exibição direta do tipo fora de Select (ex.: badge da grid,
 * `TASK-FB-FE-05`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Record<FoodBeatType, string>} Mapa `FoodBeatType` → rótulo traduzido.
 */
export const foodBeatTypeLabel = (languageGB: LanguageDate): Record<FoodBeatType, string> => ({
  F: languageGB.foodBeats.foodBeat.form.typeOptions.formulation,
  E: languageGB.foodBeats.foodBeat.form.typeOptions.stock,
});

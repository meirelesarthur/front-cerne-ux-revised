// src/constants/financial/movement/options/movement-type-category-options.ts
// Fábrica de opções do campo `type_category` de Movimento Caixa/Bancário
// (Movement — Financeiro, TASK-MV-FE-01). Expõe `E`/`S`/`T`/`F`
// (Movement-contrato.md §8, Decisão #4) — `I` (Saldo Inicial) NUNCA é
// oferecido nesta tela (é tratado pela fatia dedicada
// `OpenMovementController`). Padrão canônico `(languageGB) => Map` +
// `getLabel`/`getOption`/`options`, mirror `movement-type-options.ts`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { MOVEMENT_TYPE_CATEGORIES, MovementTypeCategoryCode } from '../movement-status';

const labels = (languageGB: LanguageDate): Map<MovementTypeCategoryCode | 'I', string> => {
  const opts = languageGB.movements.movement.form.typeCategoryOptions;

  return new Map([
    ['E', opts.income],
    ['S', opts.expense],
    ['T', opts.transfer],
    ['F', opts.financing],
    // `I` só existe para RÓTULO de linha/hidratação (movimento de Saldo
    // Inicial); `options()` abaixo continua SEM `I` (o form não o oferece).
    ['I', opts.initialBalance],
  ]);
};

const getLabel = (value: MovementTypeCategoryCode | 'I', languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: MovementTypeCategoryCode | null | undefined,
  languageGB: LanguageDate
): Option<MovementTypeCategoryCode> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<MovementTypeCategoryCode>[] =>
  MOVEMENT_TYPE_CATEGORIES.map((value) => ({ value, label: getLabel(value, languageGB) }));

export const movementTypeCategoryOptions = { getLabel, getOption, options };

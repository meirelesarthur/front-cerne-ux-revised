// src/constants/financial/movement/options/movement-type-options.ts
// Fábrica de opções do campo `type` de Movimento Caixa/Bancário (Movement —
// Financeiro, TASK-MV-FE-01). Expõe SÓ `E`/`S` (Movement-contrato.md §8,
// Decisão #4) — NUNCA o enum completo do backend (`MovementType` também tem
// `A`/`T`/`M`/`F`). Padrão canônico `(languageGB) => Map` +
// `getLabel`/`getOption`/`options` (get_pwa_constants_and_mappers_pattern §3.2),
// mirror `accountTypeOptions`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { MOVEMENT_TYPES, MovementTypeCode } from '../movement-status';

const labels = (languageGB: LanguageDate): Map<MovementTypeCode, string> =>
  new Map(
    MOVEMENT_TYPES.map((type) => [
      type,
      type === 'E'
        ? languageGB.movements.movement.form.typeOptions.income
        : languageGB.movements.movement.form.typeOptions.expense,
    ])
  );

const getLabel = (value: MovementTypeCode, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: MovementTypeCode | null | undefined,
  languageGB: LanguageDate
): Option<MovementTypeCode> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<MovementTypeCode>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const movementTypeOptions = { getLabel, getOption, options };

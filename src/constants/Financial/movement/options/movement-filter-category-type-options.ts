// src/constants/financial/movement/options/movement-filter-category-type-options.ts
// Opções do filtro "Tipo Cat." do drawer da listagem de Mov. Caixa/Bancário
// (UT-000796 r2, L5). Espelha o legado
// (`agro365/resources/views/movements/index.blade.php:90`): o select oferece
// `array_slice(Movement::types(), 0, 4)` = Entrada, Saída, Trans. Interna e
// Financiamento/Empréstimo — `I` (Saldo Inicial) NÃO é oferecido no filtro.
// O campo NÃO filtra linhas: só configura o lookup do filtro "Categoria".
// Padrão canônico `(languageGB) => Map` + `getOption`/`options`.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { MovementFilterCategoryType } from '@/@types/v2/Movements';

export const MOVEMENT_FILTER_CATEGORY_TYPES: MovementFilterCategoryType[] = ['E', 'S', 'T', 'F'];

const labels = (languageGB: LanguageDate): Map<MovementFilterCategoryType, string> => {
  const opts = languageGB.movements.movement.form.typeCategoryOptions;

  return new Map([
    ['E', opts.income],
    ['S', opts.expense],
    ['T', opts.transfer],
    ['F', opts.financing],
  ]);
};

const getLabel = (value: MovementFilterCategoryType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: MovementFilterCategoryType | null | undefined,
  languageGB: LanguageDate
): Option<MovementFilterCategoryType> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<MovementFilterCategoryType>[] =>
  MOVEMENT_FILTER_CATEGORY_TYPES.map((value) => ({ value, label: getLabel(value, languageGB) }));

export const movementFilterCategoryTypeOptions = { getLabel, getOption, options };

// src/constants/operational/nutrition/options/func-type-options.ts
// Fábrica de opções do enum `FuncType` (`DA-NT-07`, mão-de-obra — Nutrição,
// TASK-NT-FE-01). `{1: Funcionário, 2: Função, 3: Fornecedor}` — mesma
// enumeração do legado (`FLD-16`), controla qual FK
// (employee_id/function_id/provider_id) é preenchida em `NutritionEmployee`.
//
// Mirror do padrão canônico de options factory
// (`get_pwa_constants_and_mappers_pattern §3.2`): `(languageGB) =>
// Map<FuncType,string>` + `getLabel/getOption/options`, rótulos SEMPRE via
// `languageGB.nutritions.nutrition.options.funcType.*` (nunca string
// hardcoded).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { FuncType } from '@/@types/v2/Nutritions';

const labels = (languageGB: LanguageDate): Map<FuncType, string> =>
  new Map([
    [1, languageGB.nutritions.nutrition.options.funcType.employee],
    [2, languageGB.nutritions.nutrition.options.funcType.function],
    [3, languageGB.nutritions.nutrition.options.funcType.provider],
  ]);

const getLabel = (value: FuncType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: FuncType, languageGB: LanguageDate): Option<FuncType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<FuncType>[] =>
  Array.from(labels(languageGB)).map(([key, val]) => ({ label: val, value: key }));

export const funcTypeOptions = { getLabel, getOption, options };

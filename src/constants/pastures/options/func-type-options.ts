// src/constants/pastures/options/func-type-options.ts
// Fábrica de opções do discriminante de UI `PastureFuncTypeValue` (1/2/3 —
// Funcionário/Função/Prestador; NÃO é campo do payload, só orienta qual
// Select renderizar na linha de Serviços). Mirror `LaborTypeValue` de
// Appropriations. TASK-PAST-FE-04.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PastureFuncTypeValue } from '@/@types/v2/Pastures';

const funcTypeMap = (languageGB: LanguageDate): Map<PastureFuncTypeValue, string> => {
  const funcTypeOptions = languageGB.pastures.pasture.form.services.funcTypeOptions;
  return new Map([
    [1, funcTypeOptions.employee],
    [2, funcTypeOptions.function],
    [3, funcTypeOptions.provider],
  ]);
};

const getLabel = (value: PastureFuncTypeValue, languageGB: LanguageDate): string =>
  funcTypeMap(languageGB).get(value) ?? String(value);

const getOption = (
  value: PastureFuncTypeValue,
  languageGB: LanguageDate
): Option<PastureFuncTypeValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PastureFuncTypeValue>[] =>
  Array.from(funcTypeMap(languageGB), ([value, label]) => ({ label, value }));

export const funcTypeOptions = { getLabel, getOption, options };

export default funcTypeOptions;

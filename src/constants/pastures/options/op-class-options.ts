// src/constants/pastures/options/op-class-options.ts
// Fábrica de opções de `PastureOpClassValue` (1=Custeio, 2=Investimento —
// `OpClassEnum` real) — linhas de Apropriação/rateio, TASK-PAST-FE-07.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PastureOpClassValue } from '@/@types/v2/Pastures';

const opClassMap = (languageGB: LanguageDate): Map<PastureOpClassValue, string> => {
  const classOptions = languageGB.pastures.pasture.appropriation.classOptions;
  return new Map([
    [1, classOptions.custeio],
    [2, classOptions.investimento],
  ]);
};

const getLabel = (value: PastureOpClassValue, languageGB: LanguageDate): string =>
  opClassMap(languageGB).get(value) ?? String(value);

const getOption = (
  value: PastureOpClassValue,
  languageGB: LanguageDate
): Option<PastureOpClassValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PastureOpClassValue>[] =>
  Array.from(opClassMap(languageGB), ([value, label]) => ({ label, value }));

export const opClassOptions = { getLabel, getOption, options };

export default opClassOptions;

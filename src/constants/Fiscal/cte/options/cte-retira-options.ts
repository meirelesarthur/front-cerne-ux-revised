// src/constants/fiscal/cte/options/cte-retira-options.ts
// F37 (`retira: 0|1`, default create `'1'`, Contrato §3.1) — options
// estáticas Sim/Não.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB?: LanguageDate): Map<'0' | '1', string> =>
  new Map([
    ['0', languageGB?.defaltStrings?.no ?? 'Não'],
    ['1', languageGB?.defaltStrings?.yes ?? 'Sim'],
  ]);

const getLabel = (value: '0' | '1', languageGB?: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (value: '0' | '1', languageGB?: LanguageDate): Option<'0' | '1'> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB?: LanguageDate): Option<'0' | '1'>[] =>
  Array.from(labels(languageGB), ([value, label]) => ({ label, value }));

export const cteRetiraOptions = { getLabel, getOption, options };

export default cteRetiraOptions;

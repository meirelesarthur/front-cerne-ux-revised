// src/constants/relatorios/accounts-reports/options/rec-prev-real-report-condition-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `condition` do relatório F-297 Rec. Prev. X Real
// (esteira 97-Esteiras/079, TASK-079-297-FE-01) — mirror EXATO de
// `pag-prev-real-report-condition-options.ts` (`Map` alimentado por
// `languageGB`, domínio fixo `'S' | 'C'` do endpoint `GET /rec-prev-real-report`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { RecPrevRealCondition } from '@/@types/v2/AccountsReports';

const labels = (languageGB: LanguageDate): Map<RecPrevRealCondition, string> => {
  const dictionary = languageGB.accountsReports.recPrevReal.conditionOptions;
  return new Map([
    ['S', dictionary.withoutCategory],
    ['C', dictionary.withCategory],
  ]);
};

const getLabel = (value: RecPrevRealCondition, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: RecPrevRealCondition,
  languageGB: LanguageDate
): Option<RecPrevRealCondition> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<RecPrevRealCondition>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const recPrevRealConditionOptions = { getLabel, getOption, options };

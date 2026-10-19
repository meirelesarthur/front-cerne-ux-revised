// src/constants/relatorios/accounts-reports/options/pag-prev-real-report-condition-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `condition` do relatório F-289 Pag. Prev. X Real
// (esteira 97-Esteiras/054, TASK-289-FE-01) — mirror EXATO de
// `report-format-options.ts` (`Map` alimentado por `languageGB`, domínio fixo
// `'S' | 'C'` do endpoint `GET /pag-prev-real-report`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { PagPrevRealCondition } from '@/@types/v2/AccountsReports';

const labels = (languageGB: LanguageDate): Map<PagPrevRealCondition, string> => {
  const dictionary = languageGB.accountsReports.pagPrevReal.conditionOptions;
  return new Map([
    ['S', dictionary.withoutCategory],
    ['C', dictionary.withCategory],
  ]);
};

const getLabel = (value: PagPrevRealCondition, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: PagPrevRealCondition,
  languageGB: LanguageDate
): Option<PagPrevRealCondition> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PagPrevRealCondition>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const pagPrevRealConditionOptions = { getLabel, getOption, options };

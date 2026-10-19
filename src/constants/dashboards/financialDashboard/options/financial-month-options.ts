// src/constants/dashboards/financialDashboard/options/financial-month-options.ts
// Fábrica de opções de MÊS (Janeiro..Dezembro) do filtro `month`
// (`CONTRATO-API-048-04 §2`) — padrão canônico `(languageGB) => Map`, mirror
// LITERAL de `src/constants/Financial/FinancialFreeze/options/financial-freeze-month-options.ts`
// (fábrica NOVA e LOCAL a este módulo, mesma convenção do módulo irmão).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> => {
  const text = languageGB.dashboards.financialDashboard.filter.months;
  return new Map([
    [1, text.january],
    [2, text.february],
    [3, text.march],
    [4, text.april],
    [5, text.may],
    [6, text.june],
    [7, text.july],
    [8, text.august],
    [9, text.september],
    [10, text.october],
    [11, text.november],
    [12, text.december],
  ]);
};

const getLabel = (value: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const getOption = (value: number, languageGB: LanguageDate): Option<number> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<number>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const financialMonthOptions = { getLabel, getOption, options };

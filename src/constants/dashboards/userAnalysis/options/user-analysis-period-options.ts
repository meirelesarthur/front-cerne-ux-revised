// src/constants/dashboards/userAnalysis/options/user-analysis-period-options.ts
// Fábrica de opções do filtro Período (`UA-FILTER-01`) — padrão canônico
// `(languageGB) => Map` (get_pwa_constants_and_mappers_pattern §3.2).

import { userAnalysisPeriod } from '@/constants/dashboards/userAnalysis/types';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { UserAnalysisPeriod } from '@/@types/v2/Dashboards/userAnalysis';

const labels = (languageGB: LanguageDate): Map<UserAnalysisPeriod, string> => {
  const text = languageGB.dashboards.userAnalysis.filter.periodOptions;
  return new Map([
    [userAnalysisPeriod.d5, text.d5],
    [userAnalysisPeriod.d15, text.d15],
    [userAnalysisPeriod.d30, text.d30],
    [userAnalysisPeriod.d60, text.d60],
    [userAnalysisPeriod.d90, text.d90],
  ]);
};

const getLabel = (value: UserAnalysisPeriod, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (
  value: UserAnalysisPeriod,
  languageGB: LanguageDate
): Option<UserAnalysisPeriod> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<UserAnalysisPeriod>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const userAnalysisPeriodOptions = { getLabel, getOption, options };

// src/constants/relatorios/accounts-reports/options/report-order-direction-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `order_direction` compartilhado pelas 4 telas
// de relatório de Contas (Financeiro, esteira 97-Esteiras/050,
// TASK-050-FE-00) — mirror EXATO de `report-format-options.ts`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ReportOrderDirection } from '@/@types/v2/AccountsReports';

const labels = (languageGB: LanguageDate): Map<ReportOrderDirection, string> => {
  const dictionary = languageGB.accountsReports.shared.orderDirectionOptions;
  return new Map([
    ['asc', dictionary.asc],
    ['desc', dictionary.desc],
  ]);
};

const getLabel = (value: ReportOrderDirection, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ReportOrderDirection,
  languageGB: LanguageDate
): Option<ReportOrderDirection> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ReportOrderDirection>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const reportOrderDirectionOptions = { getLabel, getOption, options };

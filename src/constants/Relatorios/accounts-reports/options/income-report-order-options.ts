// src/constants/relatorios/accounts-reports/options/income-report-order-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `order` do relatório F-271 C. a Receber (esteira
// 97-Esteiras/050, TASK-050-271-FE-01) — espelho EXATO das 5 chaves de
// `App\Enums\Reports\IncomeReportSortEnum` (`GB.Cerne.Api`). Default
// `due_date` (`IncomeReportSortEnum::default()`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { IncomeReportOrderKey } from '@/@types/v2/AccountsReports';

const ORDER_KEYS: IncomeReportOrderKey[] = [
  'dt_emission',
  'due_date',
  'client_name',
  'proprietary_name',
  'value',
];

const labels = (languageGB: LanguageDate): Map<IncomeReportOrderKey, string> => {
  const dictionary = languageGB.accountsReports.incomes.orderOptions;
  return new Map(ORDER_KEYS.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: IncomeReportOrderKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: IncomeReportOrderKey,
  languageGB: LanguageDate
): Option<IncomeReportOrderKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<IncomeReportOrderKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const incomeReportOrderOptions = { getLabel, getOption, options };

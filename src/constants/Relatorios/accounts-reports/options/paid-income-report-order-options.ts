// src/constants/relatorios/accounts-reports/options/paid-income-report-order-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `order` do relatório F-292 C. Recebidas (esteira
// 97-Esteiras/050, TASK-050-292-FE-01) — espelho EXATO das 5 chaves de
// `App\Enums\Reports\PaidIncomeReportSortEnum` (`GB.Cerne.Api`). Default
// `date` (`PaidIncomeReportSortEnum::default()`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { PaidIncomeReportOrderKey } from '@/@types/v2/AccountsReports';

const ORDER_KEYS: PaidIncomeReportOrderKey[] = [
  'date',
  'number',
  'dt_emission',
  'due_date',
  'net_value',
];

const labels = (languageGB: LanguageDate): Map<PaidIncomeReportOrderKey, string> => {
  const dictionary = languageGB.accountsReports.paidIncomes.orderOptions;
  return new Map(ORDER_KEYS.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: PaidIncomeReportOrderKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: PaidIncomeReportOrderKey,
  languageGB: LanguageDate
): Option<PaidIncomeReportOrderKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PaidIncomeReportOrderKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const paidIncomeReportOrderOptions = { getLabel, getOption, options };

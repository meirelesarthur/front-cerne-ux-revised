// src/constants/relatorios/accounts-reports/options/paid-expense-report-order-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `order` do relatório F-291 C. Pagas (esteira
// 97-Esteiras/050, TASK-050-291-FE-01) — espelho EXATO das 5 chaves de
// `App\Enums\Reports\PaidExpenseReportSortEnum` (`GB.Cerne.Api`). Default
// `date` (`PaidExpenseReportSortEnum::default()`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { PaidExpenseReportOrderKey } from '@/@types/v2/AccountsReports';

const ORDER_KEYS: PaidExpenseReportOrderKey[] = [
  'date',
  'number',
  'dt_emission',
  'due_date',
  'net_value',
];

const labels = (languageGB: LanguageDate): Map<PaidExpenseReportOrderKey, string> => {
  const dictionary = languageGB.accountsReports.paidExpenses.orderOptions;
  return new Map(ORDER_KEYS.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: PaidExpenseReportOrderKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: PaidExpenseReportOrderKey,
  languageGB: LanguageDate
): Option<PaidExpenseReportOrderKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PaidExpenseReportOrderKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const paidExpenseReportOrderOptions = { getLabel, getOption, options };

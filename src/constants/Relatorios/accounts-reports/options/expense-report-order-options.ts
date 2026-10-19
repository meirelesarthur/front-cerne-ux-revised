// src/constants/relatorios/accounts-reports/options/expense-report-order-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `order` do relatório F-262 C. à Pagar (esteira
// 97-Esteiras/050, TASK-050-262-FE-01) — espelho EXATO das 5 chaves de
// `App\Enums\Reports\ExpenseReportSortEnum` (`GB.Cerne.Api`). Default
// `due_date` (`ExpenseReportSortEnum::default()`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ExpenseReportOrderKey } from '@/@types/v2/AccountsReports';

const ORDER_KEYS: ExpenseReportOrderKey[] = [
  'dt_emission',
  'due_date',
  'provider_name',
  'proprietary_name',
  'value',
];

const labels = (languageGB: LanguageDate): Map<ExpenseReportOrderKey, string> => {
  const dictionary = languageGB.accountsReports.expenses.orderOptions;
  return new Map(ORDER_KEYS.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: ExpenseReportOrderKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ExpenseReportOrderKey,
  languageGB: LanguageDate
): Option<ExpenseReportOrderKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ExpenseReportOrderKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseReportOrderOptions = { getLabel, getOption, options };

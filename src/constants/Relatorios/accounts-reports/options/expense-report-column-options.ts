// src/constants/relatorios/accounts-reports/options/expense-report-column-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do catálogo de colunas do relatório F-262 C. à Pagar
// (esteira 97-Esteiras/050, TASK-050-262-FE-01) — espelho EXATO das 18
// chaves/labels de `App\Enums\Reports\ExpenseReportColumnEnum`
// (`GB.Cerne.Api`), mesma ORDEM declarada no enum. Mirror estrutural de
// `classification-options.ts`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ExpenseReportColumnKey } from '@/@types/v2/AccountsReports';

const COLUMN_ORDER: ExpenseReportColumnKey[] = [
  'number',
  'invoice_number',
  'provider_name',
  'provider_nif',
  'proprietary_name',
  'note',
  'dt_emission',
  'due_date',
  'value',
  'balance',
  'interest',
  'classification',
  'farm',
  'type',
  'synthetic',
  'analytic',
  'center',
  'products',
];

const labels = (languageGB: LanguageDate): Map<ExpenseReportColumnKey, string> => {
  const dictionary = languageGB.accountsReports.expenses.columns;
  return new Map(COLUMN_ORDER.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: ExpenseReportColumnKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ExpenseReportColumnKey,
  languageGB: LanguageDate
): Option<ExpenseReportColumnKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ExpenseReportColumnKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseReportColumnOptions = { getLabel, getOption, options };

/** Default do formulário (Q-FE-02, contrato de tela §4). */
export const EXPENSE_REPORT_DEFAULT_COLUMNS: ExpenseReportColumnKey[] = [
  'number',
  'provider_name',
  'dt_emission',
  'due_date',
  'value',
  'balance',
];

/** Chaves do "modo rateio" — mirror `ExpenseReportColumnEnum::apportionmentKeys()`. */
export const EXPENSE_REPORT_APPORTIONMENT_KEYS: ExpenseReportColumnKey[] = [
  'synthetic',
  'analytic',
  'center',
];

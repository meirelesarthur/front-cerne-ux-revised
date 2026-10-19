// src/constants/relatorios/accounts-reports/options/income-report-column-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do catálogo de colunas do relatório F-271 C. a Receber
// (esteira 97-Esteiras/050, TASK-050-271-FE-01) — espelho EXATO das 16
// chaves/labels de `App\Enums\Reports\IncomeReportColumnEnum` (`GB.Cerne.Api`),
// mesma ORDEM declarada no enum. Mirror estrutural de
// `expense-report-column-options.ts` — SEM `products`/`classification` (não
// existem neste enum, contrato de tela §4).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { IncomeReportColumnKey } from '@/@types/v2/AccountsReports';

const COLUMN_ORDER: IncomeReportColumnKey[] = [
  'number',
  'nfe',
  'client_name',
  'client_nif',
  'proprietary_name',
  'note',
  'dt_emission',
  'due_date',
  'value',
  'balance',
  'interest',
  'farm',
  'type',
  'synthetic',
  'analytic',
  'center',
];

const labels = (languageGB: LanguageDate): Map<IncomeReportColumnKey, string> => {
  const dictionary = languageGB.accountsReports.incomes.columns;
  return new Map(COLUMN_ORDER.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: IncomeReportColumnKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: IncomeReportColumnKey,
  languageGB: LanguageDate
): Option<IncomeReportColumnKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<IncomeReportColumnKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const incomeReportColumnOptions = { getLabel, getOption, options };

/** Default do formulário (contrato de tela §4). */
export const INCOME_REPORT_DEFAULT_COLUMNS: IncomeReportColumnKey[] = [
  'number',
  'client_name',
  'dt_emission',
  'due_date',
  'value',
  'balance',
];

/** Chaves do "modo rateio" — mirror `IncomeReportColumnEnum::apportionmentKeys()`. */
export const INCOME_REPORT_APPORTIONMENT_KEYS: IncomeReportColumnKey[] = [
  'synthetic',
  'analytic',
  'center',
];

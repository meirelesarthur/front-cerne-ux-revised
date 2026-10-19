// src/constants/relatorios/accounts-reports/options/paid-expense-report-column-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do catálogo de colunas do relatório F-291 C. Pagas
// (esteira 97-Esteiras/050, TASK-050-291-FE-01) — espelho EXATO das 19
// chaves/labels-base de `App\Enums\Reports\PaidExpenseReportColumnEnum`
// (`GB.Cerne.Api`), mesma ORDEM declarada no enum. O rótulo dinâmico
// "Valor/Categoria" da coluna `value` em modo rateio é decidido pelo
// BACKEND (`label($apportionmentMode)`) — este catálogo usa sempre o rótulo
// BASE ("Valor"), nunca replica a lógica de troca aqui (contrato de tela
// §4, "NÃO replicar a lógica de rótulo no front").
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { PaidExpenseReportColumnKey } from '@/@types/v2/AccountsReports';

const COLUMN_ORDER: PaidExpenseReportColumnKey[] = [
  'number',
  'nfe',
  'provider_name',
  'nif',
  'farm',
  'proprietary',
  'note',
  'products',
  'dt_emission',
  'due_date',
  'date',
  'classification',
  'synthetic',
  'analytic',
  'center',
  'discount',
  'movement_value',
  'value',
  'harvest',
];

const labels = (languageGB: LanguageDate): Map<PaidExpenseReportColumnKey, string> => {
  const dictionary = languageGB.accountsReports.paidExpenses.columns;
  return new Map(COLUMN_ORDER.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: PaidExpenseReportColumnKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: PaidExpenseReportColumnKey,
  languageGB: LanguageDate
): Option<PaidExpenseReportColumnKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PaidExpenseReportColumnKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const paidExpenseReportColumnOptions = { getLabel, getOption, options };

/** Default do formulário (contrato de tela §4). */
export const PAID_EXPENSE_REPORT_DEFAULT_COLUMNS: PaidExpenseReportColumnKey[] = [
  'number',
  'provider_name',
  'due_date',
  'date',
  'movement_value',
  'value',
];

/** Chaves do "modo rateio" — mirror `PaidExpenseReportColumnEnum::apportionmentKeys()`. */
export const PAID_EXPENSE_REPORT_APPORTIONMENT_KEYS: PaidExpenseReportColumnKey[] = [
  'synthetic',
  'analytic',
  'center',
];

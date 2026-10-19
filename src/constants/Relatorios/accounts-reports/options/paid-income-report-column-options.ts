// src/constants/relatorios/accounts-reports/options/paid-income-report-column-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do catálogo de colunas do relatório F-292 C. Recebidas
// (esteira 97-Esteiras/050, TASK-050-292-FE-01) — espelho EXATO das 16
// chaves/labels-base de `App\Enums\Reports\PaidIncomeReportColumnEnum`
// (`GB.Cerne.Api`), mesma ORDEM declarada no enum. O rótulo dinâmico
// "Valor/Categoria" da coluna `value` em modo rateio é decidido pelo
// BACKEND (`label($apportionmentMode)`) — este catálogo usa sempre o rótulo
// BASE ("Vl. Total Título"), nunca replica a lógica de troca aqui (mirror
// `paid-expense-report-column-options.ts`, "NÃO replicar a lógica de rótulo
// no front"). Superfície MENOR que o irmão F-291 DE PROPÓSITO (`D-292-SIM`)
// — SEM `products`/`classification`/`harvest` (não existem neste enum).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { PaidIncomeReportColumnKey } from '@/@types/v2/AccountsReports';

const COLUMN_ORDER: PaidIncomeReportColumnKey[] = [
  'number',
  'nfe',
  'client_name',
  'nif',
  'farm',
  'proprietary',
  'note',
  'dt_emission',
  'due_date',
  'date',
  'synthetic',
  'analytic',
  'center',
  'discount',
  'movement_value',
  'value',
];

const labels = (languageGB: LanguageDate): Map<PaidIncomeReportColumnKey, string> => {
  const dictionary = languageGB.accountsReports.paidIncomes.columns;
  return new Map(COLUMN_ORDER.map((key) => [key, dictionary[key]]));
};

const getLabel = (value: PaidIncomeReportColumnKey, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: PaidIncomeReportColumnKey,
  languageGB: LanguageDate
): Option<PaidIncomeReportColumnKey> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PaidIncomeReportColumnKey>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const paidIncomeReportColumnOptions = { getLabel, getOption, options };

/** Default do formulário (contrato de tela §4). */
export const PAID_INCOME_REPORT_DEFAULT_COLUMNS: PaidIncomeReportColumnKey[] = [
  'number',
  'client_name',
  'due_date',
  'date',
  'movement_value',
  'value',
];

/** Chaves do "modo rateio" — mirror `PaidIncomeReportColumnEnum::apportionmentKeys()`. */
export const PAID_INCOME_REPORT_APPORTIONMENT_KEYS: PaidIncomeReportColumnKey[] = [
  'synthetic',
  'analytic',
  'center',
];

// src/constants/dashboards/cashbookDashboard/options/cashbook-operation-options.ts
// Fábrica de opções do filtro Tipo de movimentação (`operation`, FLT-03) —
// domínio COMPLETO de `CashBookDashboardRequest::rules()['operation']`
// (`Rule::in(['A', 'E', 'S'])`), mirror do padrão canônico `(languageGB) => Map`.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CashbookOperation } from '@/@types/v2/Dashboards/cashbookDashboard';

const labels = (languageGB: LanguageDate): Map<CashbookOperation, string> => {
  const text = languageGB.dashboards.cashbookDashboard.filter.operationOptions;
  return new Map([
    ['A', text.all],
    ['E', text.income],
    ['S', text.expense],
  ]);
};

const getLabel = (value: CashbookOperation, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (
  value: CashbookOperation,
  languageGB: LanguageDate
): Option<CashbookOperation> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<CashbookOperation>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const cashbookOperationOptions = { getLabel, getOption, options };

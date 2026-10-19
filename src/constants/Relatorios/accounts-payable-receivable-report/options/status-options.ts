// src/constants/relatorios/accounts-payable-receivable-report/options/status-options.ts
// -----------------------------------------------------------------------------
// Catálogo LOCAL do filtro `status[]` do relatório "Consolidado Pagar/Receber"
// (F-214, esteira 97-Esteiras/052, TASK-052-214-FE-01) — 1 Em Aberto · 2
// Parcial · 3 Quitado · 4 Adiantamento, espelho FIEL de
// `App\Enums\Reports\AccountsPayableReceivableStatusEnum` (backend). NÃO vem
// de nenhuma rota `/options` — é um catálogo fixo, local, sem lookup remoto
// (roteiro §"Riscos + solução" (a)).
//
// `options()` devolve diretamente o shape `CheckboxListItem<number>`
// (`{value,label}`) consumido pelo `CheckboxListField` — diferente das
// fábricas de `Option<T>` (`report-format-options.ts`) usadas por `Select`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { AccountsPayableReceivableStatus } from '@/@types/v2/AccountsPayableReceivableReport';

const labels = (languageGB: LanguageDate): Map<AccountsPayableReceivableStatus, string> => {
  const dictionary = languageGB.accountsPayableReceivableReport.report.statusOptions;
  return new Map([
    [1, dictionary.open],
    [2, dictionary.partial],
    [3, dictionary.settled],
    [4, dictionary.advance],
  ]);
};

const getLabel = (value: AccountsPayableReceivableStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const options = (
  languageGB: LanguageDate
): { value: AccountsPayableReceivableStatus; label: string }[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ value, label }));

export const accountsPayableReceivableStatusOptions = { getLabel, options };

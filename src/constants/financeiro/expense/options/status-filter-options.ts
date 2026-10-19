// src/constants/financeiro/expense/options/status-filter-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do FILTRO server-side `status` de Expense (Contas a
// Pagar, esteira 036, TASK-FE-036-115/TASK-BE-036-116) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`options` (get_pwa_constants_and_mappers_
// pattern §3.2), mirror EXATO `payment-type-options.ts`.
//
// 8 estados derivados de `Expense::opStatus()` (legado, `App\Expense.php:104-
// 122`, rótulos reais em `lang/pt-BR/trad.php`, chaves `cpag_*`) — filtro
// NOVO e INDEPENDENTE do badge CLIENT-SIDE já existente na grid
// (`utils/expense-status.ts`, 4 estados, GAP-FE-036-108). Os dois números de
// estados (8 aqui, 4 no badge) NÃO precisam bater 1:1 — divergência
// conhecida, registrada nas Tarefas TASK-FE-036-115/TASK-BE-036-116, não
// resolvida aqui.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { ExpenseStatusFilterValue } from '@/@types/v2/Financeiro/expense';

export const expenseStatusFilterIndex = {
  A_VENCER: 1,
  VENCIDA: 2,
  BAIXA_PARCIAL: 3,
  BAIXADA: 4,
  ADIANTAMENTO_PENDENTE: 5,
  ADIANTAMENTO_BAIXADO: 6,
  FATURA_PENDENTE: 7,
  FATURA_BAIXADO: 8,
} as const satisfies Record<string, ExpenseStatusFilterValue>;

const labels = (languageGB: LanguageDate): Map<ExpenseStatusFilterValue, string> => {
  const dictionary = languageGB.financial.expense.filter.statusOptions;
  return new Map([
    [expenseStatusFilterIndex.A_VENCER, dictionary.aVencer],
    [expenseStatusFilterIndex.VENCIDA, dictionary.vencida],
    [expenseStatusFilterIndex.BAIXA_PARCIAL, dictionary.baixaParcial],
    [expenseStatusFilterIndex.BAIXADA, dictionary.baixada],
    [expenseStatusFilterIndex.ADIANTAMENTO_PENDENTE, dictionary.adiantamentoPendente],
    [expenseStatusFilterIndex.ADIANTAMENTO_BAIXADO, dictionary.adiantamentoBaixado],
    [expenseStatusFilterIndex.FATURA_PENDENTE, dictionary.faturaPendente],
    [expenseStatusFilterIndex.FATURA_BAIXADO, dictionary.faturaBaixado],
  ]);
};

const getLabel = (value: ExpenseStatusFilterValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const options = (languageGB: LanguageDate): Option<ExpenseStatusFilterValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseStatusFilterOptions = { getLabel, options };

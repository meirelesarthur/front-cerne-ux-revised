// src/constants/Budgets/options/budget-status-options.ts
// Fábrica de opções do enum `status` (BudgetStatus) — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror
// `request-quotation-status-options.ts`).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { budgetStatus, BudgetStatus } from '../budget-status';

const labels = (languageGB: LanguageDate): Map<BudgetStatus, string> => {
  const text = languageGB.budgets.budget.statusOptions;
  return new Map([
    [budgetStatus.aguardandoEnvio, text.aguardandoEnvio],
    [budgetStatus.enviado, text.enviado],
    [budgetStatus.confirmado, text.confirmado],
    [budgetStatus.negado, text.negado],
  ]);
};

const getLabel = (value: BudgetStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: BudgetStatus, languageGB: LanguageDate): Option<BudgetStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<BudgetStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const budgetStatusOptions = { getLabel, getOption, options };

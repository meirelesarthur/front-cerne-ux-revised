// src/constants/integracoes/exportExpensesIncomesDominio/options/type-options.ts
// Fábrica de opções do campo `type` da tela "Exportação Domínio — Contas a
// Pagar/Receber" (F-118, Integrações) — padrão canônico
// `(languageGB) => Map` (get_pwa_constants_and_mappers_pattern §3.2). 2
// opções literais no legado (FLD-09): 1=Pagar/Expense, 2=Receber/Income.
// SEM opção vazia — a 1ª opção real já é "Contas a Pagar" (fidelidade).
// Labels 100% derivados da tradução — nunca string literal (severidade
// INVIOLÁVEL).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { expenseIncomeType, type ExpenseIncomeType } from '../enums';

const labels = (languageGB: LanguageDate): Map<ExpenseIncomeType, string> => {
  const dictionary = languageGB.integrations.exportExpensesIncomesDominio.form.type;
  return new Map([
    [expenseIncomeType.expense, dictionary.expense],
    [expenseIncomeType.income, dictionary.income],
  ]);
};

const getLabel = (value: ExpenseIncomeType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const getOption = (
  value: ExpenseIncomeType,
  languageGB: LanguageDate
): Option<ExpenseIncomeType> => ({ label: getLabel(value, languageGB), value });

const options = (languageGB: LanguageDate): Option<ExpenseIncomeType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseIncomeTypeOptions = { getLabel, getOption, options };

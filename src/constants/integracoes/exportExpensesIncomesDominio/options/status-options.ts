// src/constants/integracoes/exportExpensesIncomesDominio/options/status-options.ts
// Fábrica de opções do campo `status` da tela "Exportação Domínio — Contas
// a Pagar/Receber" (F-118, Integrações) — padrão canônico
// `(languageGB) => Map` (get_pwa_constants_and_mappers_pattern §3.2). 8
// opções, ordem 1..8 fiel a `Expense::opStatus` (contrato de tela §4.1).
// Labels 100% derivados da tradução — nunca string literal (severidade
// INVIOLÁVEL).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

import { expenseIncomeStatus, type ExpenseIncomeStatus } from '../enums';

const labels = (languageGB: LanguageDate): Map<ExpenseIncomeStatus, string> => {
  const dictionary = languageGB.integrations.exportExpensesIncomesDominio.form.status;
  return new Map([
    [expenseIncomeStatus.aVencer, dictionary.aVencer],
    [expenseIncomeStatus.vencido, dictionary.vencido],
    [expenseIncomeStatus.baixaParcial, dictionary.baixaParcial],
    [expenseIncomeStatus.baixado, dictionary.baixado],
    [expenseIncomeStatus.adiantPendente, dictionary.adiantPendente],
    [expenseIncomeStatus.adiantBaixado, dictionary.adiantBaixado],
    [expenseIncomeStatus.faturaPendente, dictionary.faturaPendente],
    [expenseIncomeStatus.faturaBaixado, dictionary.faturaBaixado],
  ]);
};

const getLabel = (value: ExpenseIncomeStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const getOption = (
  value: ExpenseIncomeStatus,
  languageGB: LanguageDate
): Option<ExpenseIncomeStatus> => ({ label: getLabel(value, languageGB), value });

const options = (languageGB: LanguageDate): Option<ExpenseIncomeStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseIncomeStatusOptions = { getLabel, getOption, options };

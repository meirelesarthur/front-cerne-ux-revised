// src/constants/relatorios/bank-statement-report/options/condition-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `condition` do relatório "Extrato Financeiro"
// (F-233, execução 97-Esteiras/079, TASK-F233-FE-02). Domínio fixo
// `'S' | 'C'` (Sem/Com Categoria — enum server-side
// `BankStatementReportCondition{S,C}`), mirror EXATO
// `financial-movement-report/options/condition-options.ts` (F-264). Default
// da tela = `'S'` (FRONT-07, inferido do padrão HTML do legado).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { BankStatementReportConditionValue } from '@/@types/v2/BankStatementReport';

const labels = (languageGB: LanguageDate): Map<BankStatementReportConditionValue, string> => {
  const dictionary = languageGB.bankStatementReport.report.condition;
  return new Map([
    ['S', dictionary.semCategoria],
    ['C', dictionary.comCategoria],
  ]);
};

const getLabel = (value: BankStatementReportConditionValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: BankStatementReportConditionValue,
  languageGB: LanguageDate
): Option<BankStatementReportConditionValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<BankStatementReportConditionValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const bankStatementReportConditionOptions = { getLabel, getOption, options };

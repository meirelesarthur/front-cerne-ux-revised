// src/constants/relatorios/accumulated-income-statement-report/options/group-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `group` (Regime) do relatório F-217 Custo de
// Produção Acumulado — mirror EXATO de `report-format-options.ts`
// (Map alimentado por `languageGB`, domínio fixo do legado: `C`=Caixa,
// `O`=Competência). Rodada 3 (esteira 065) REVERTE a decisão original
// "SEM default pré-selecionado" (plano §2.2, esteira 058): fidelidade ao
// legado (print 41) exige `C`=Caixa pré-selecionado — ver
// `buildPristineValues` em `index.tsx`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AccumulatedIncomeStatementGroup } from '@/@types/v2/AccumulatedIncomeStatementReport';

const labels = (languageGB: LanguageDate): Map<AccumulatedIncomeStatementGroup, string> => {
  const dictionary = languageGB.accumulatedIncomeStatementReport.report.groupOptions;
  return new Map([
    ['C', dictionary.cash],
    ['O', dictionary.accrual],
  ]);
};

const getLabel = (value: AccumulatedIncomeStatementGroup, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: AccumulatedIncomeStatementGroup,
  languageGB: LanguageDate
): Option<AccumulatedIncomeStatementGroup> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AccumulatedIncomeStatementGroup>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const groupOptions = { getLabel, getOption, options };

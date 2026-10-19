// src/constants/relatorios/accumulated-income-statement-report/options/calculation-module-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `calculation_module` (Financeiro/Apontamento)
// do relatório F-217 Custo de Produção Acumulado — mirror EXATO de
// `group-options.ts`, domínio fixo do legado: `F`=Financeiro,
// `A`=Apontamento. A tela exibe um `tooltip` explicando a diferença
// (mirror `CustoProducao/index.tsx`, campo irmão). Rodada 3 (esteira 065)
// REVERTE a decisão original "SEM default pré-selecionado" (plano §2.2,
// esteira 058): fidelidade ao legado (print 41) exige `F`=Financeiro
// pré-selecionado — ver `buildPristineValues` em `index.tsx`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AccumulatedIncomeStatementCalculationModule } from '@/@types/v2/AccumulatedIncomeStatementReport';

const labels = (
  languageGB: LanguageDate
): Map<AccumulatedIncomeStatementCalculationModule, string> => {
  const dictionary = languageGB.accumulatedIncomeStatementReport.report.calculationModuleOptions;
  return new Map([
    ['F', dictionary.financial],
    ['A', dictionary.appropriation],
  ]);
};

const getLabel = (
  value: AccumulatedIncomeStatementCalculationModule,
  languageGB: LanguageDate
): string => labels(languageGB).get(value)!;

const getOption = (
  value: AccumulatedIncomeStatementCalculationModule,
  languageGB: LanguageDate
): Option<AccumulatedIncomeStatementCalculationModule> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AccumulatedIncomeStatementCalculationModule>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const calculationModuleOptions = { getLabel, getOption, options };

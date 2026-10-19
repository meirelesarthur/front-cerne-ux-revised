// src/constants/relatorios/accumulated-income-statement-report/options/type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `type` (Sintético/Analítico) do relatório F-217
// Custo de Produção Acumulado — mirror EXATO de `group-options.ts`, domínio
// fixo do legado: `1`=SYNTHETIC (soma só o grupo pai), `2`=ANALYTICAL
// (detalha filhos) — mirror `App\Enums\FinancialCategoryClass` (backed int)
// da API. Correção cirúrgica (TASK-058-F217-FIX-01): o valor enviado é o
// INT, não mais a string 'SYNTHETIC'/'ANALYTICS' — labels PT-BR permanecem
// intactos. Rodada 3 (esteira 065) REVERTE a decisão original "SEM default
// pré-selecionado" (plano §2.2, esteira 058): fidelidade ao legado (print
// 41) exige `1`=Sintético pré-selecionado — ver `buildPristineValues` em
// `index.tsx`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AccumulatedIncomeStatementType } from '@/@types/v2/AccumulatedIncomeStatementReport';

const labels = (languageGB: LanguageDate): Map<AccumulatedIncomeStatementType, string> => {
  const dictionary = languageGB.accumulatedIncomeStatementReport.report.typeOptions;
  return new Map([
    [1, dictionary.synthetic],
    [2, dictionary.analytical],
  ]);
};

const getLabel = (value: AccumulatedIncomeStatementType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: AccumulatedIncomeStatementType,
  languageGB: LanguageDate
): Option<AccumulatedIncomeStatementType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AccumulatedIncomeStatementType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const typeOptions = { getLabel, getOption, options };

// src/constants/relatorios/animal-movement-analysis-report/options/report-output-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `type` (formato de saída) do relatório F-223
// Análise Mov. Lote — 2 itens fixos, valor STRING explícito
// (`'pdf' | 'excel'`), mirror
// `animal-batch-history-report/options/report-output-type-options.ts`
// (F-221). Nome do valor casa 1:1 com o parâmetro literal esperado pela API
// (`?type=pdf|excel`) — não é índice de array.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalMovementAnalysisReportOutputType } from '@/@types/v2/AnimalMovementAnalysisReport';

const labels = (
  languageGB: LanguageDate
): Map<AnimalMovementAnalysisReportOutputType, string> => {
  const dictionary = languageGB.animalMovementAnalysisReport.report.outputTypeOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

const getLabel = (
  value: AnimalMovementAnalysisReportOutputType,
  languageGB: LanguageDate
): string => labels(languageGB).get(value)!;

const getOption = (
  value: AnimalMovementAnalysisReportOutputType,
  languageGB: LanguageDate
): Option<AnimalMovementAnalysisReportOutputType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (
  languageGB: LanguageDate
): Option<AnimalMovementAnalysisReportOutputType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const reportOutputTypeOptions = { getLabel, getOption, options };

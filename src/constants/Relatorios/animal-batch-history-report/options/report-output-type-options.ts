// src/constants/relatorios/animal-batch-history-report/options/report-output-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `type` (formato de saída) do relatório F-221
// Histórico de Animais/Lote — 2 itens fixos, valor STRING explícito
// (`'pdf' | 'excel'`), mirror `report-format-options.ts`/
// `weaning-report-format-options.ts`. Nome do valor casa 1:1 com o parâmetro
// literal esperado pela API (`?type=pdf|excel`) — não é índice de array
// (plano §"Riscos", item 2).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalBatchHistoryReportOutputType } from '@/@types/v2/AnimalBatchHistoryReport';

const labels = (languageGB: LanguageDate): Map<AnimalBatchHistoryReportOutputType, string> => {
  const dictionary = languageGB.animalBatchHistoryReport.report.outputTypeOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

const getLabel = (value: AnimalBatchHistoryReportOutputType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: AnimalBatchHistoryReportOutputType,
  languageGB: LanguageDate
): Option<AnimalBatchHistoryReportOutputType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AnimalBatchHistoryReportOutputType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const reportOutputTypeOptions = { getLabel, getOption, options };

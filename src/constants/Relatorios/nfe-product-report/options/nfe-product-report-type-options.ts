// src/constants/relatorios/nfe-product-report/options/nfe-product-report-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `type` do relatório "Faturamento" (F-286,
// esteira 97-Esteiras/054, TASK-054-286-FE-01) — mirror de FORMA de
// `report-format-options.ts` (`Map` alimentado por `languageGB` +
// `getLabel`/`getOption`/`options`), mas com domínio PRÓPRIO (D-FE-02):
// `NfeProductReportType` (`0 | 1`) — NUNCA reusar `ReportFormat`
// (`'pdf' | 'xlsx'`, domínio de string dos relatórios de Contas/Máquinas).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { NfeProductReportType } from '@/@types/v2/NfeProductReport';

const labels = (languageGB: LanguageDate): Map<NfeProductReportType, string> => {
  const dictionary = languageGB.nfeProductReport.report.typeOptions;
  return new Map([
    [0, dictionary.pdf],
    [1, dictionary.xlsx],
  ]);
};

const getLabel = (value: NfeProductReportType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: NfeProductReportType,
  languageGB: LanguageDate
): Option<NfeProductReportType> => ({ label: getLabel(value, languageGB), value });

const options = (languageGB: LanguageDate): Option<NfeProductReportType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const nfeProductReportTypeOptions = { getLabel, getOption, options };

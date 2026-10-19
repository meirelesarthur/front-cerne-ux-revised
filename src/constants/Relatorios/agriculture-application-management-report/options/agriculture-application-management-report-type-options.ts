// src/constants/relatorios/agriculture-application-management-report/options/agriculture-application-management-report-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `report_type` (Produto/Insumo · MO/Serviços ·
// Ocorrências) da tela "Aplicação/Manejo Talhões" (F-220, execução 059) —
// mirror EXATO de `stock-abc-report-format-options.ts`, mas CLEARABLE (campo
// opcional — ausência = servidor monta os 3 blocos, mirror
// `AgricultureApplicationManagementReportRequest::rules()`, `nullable|string|
// in:inputs,services,occurrences`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { AgricultureApplicationManagementReportType } from '@/@types/v2/Relatorios/agriculture-application-management-report';

const labels = (
  languageGB: LanguageDate
): Map<AgricultureApplicationManagementReportType, string> => {
  const dictionary = languageGB.agricultureApplicationManagementReport.report.reportTypeOptions;
  return new Map([
    ['inputs', dictionary.inputs],
    ['services', dictionary.services],
    ['occurrences', dictionary.occurrences],
  ]);
};

const getLabel = (
  value: AgricultureApplicationManagementReportType,
  languageGB: LanguageDate
): string => labels(languageGB).get(value)!;

const getOption = (
  value: AgricultureApplicationManagementReportType,
  languageGB: LanguageDate
): Option<AgricultureApplicationManagementReportType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (
  languageGB: LanguageDate
): Option<AgricultureApplicationManagementReportType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const agricultureApplicationManagementReportTypeOptions = { getLabel, getOption, options };

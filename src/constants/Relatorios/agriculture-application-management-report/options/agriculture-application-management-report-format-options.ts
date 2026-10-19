// src/constants/relatorios/agriculture-application-management-report/options/agriculture-application-management-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` da tela "Aplicação/Manejo Talhões"
// (F-220, execução 059) — mirror EXATO de `report-format-options.ts`
// (`@/constants/Relatorios/accounts-reports/options`, domínio 'pdf'|'xlsx'
// idêntico), mas com i18n e tipo PRÓPRIOS deste módulo (isolamento de módulo,
// convenção do codebase — ver `StockAbcReportFormat`/`stockAbcReportFormatOptions`,
// NUNCA compartilhar a fábrica entre relatórios distintos mesmo com o mesmo
// domínio de valores).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { AgricultureApplicationManagementReportFormat } from '@/@types/v2/Relatorios/agriculture-application-management-report';

const labels = (
  languageGB: LanguageDate
): Map<AgricultureApplicationManagementReportFormat, string> => {
  const dictionary = languageGB.agricultureApplicationManagementReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['xlsx', dictionary.xlsx],
  ]);
};

const getLabel = (
  value: AgricultureApplicationManagementReportFormat,
  languageGB: LanguageDate
): string => labels(languageGB).get(value)!;

const getOption = (
  value: AgricultureApplicationManagementReportFormat,
  languageGB: LanguageDate
): Option<AgricultureApplicationManagementReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (
  languageGB: LanguageDate
): Option<AgricultureApplicationManagementReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const agricultureApplicationManagementReportFormatOptions = { getLabel, getOption, options };

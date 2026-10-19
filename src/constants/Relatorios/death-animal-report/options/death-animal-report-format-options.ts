// src/constants/relatorios/death-animal-report/options/death-animal-report-format-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `format` da tela "Mortes" (F-254, esteira
// 97-Esteiras/077) — mirror EXATO de `stock-abc-report-format-options.ts`
// (F-322, mesma esteira), mas com domínio e i18n PRÓPRIOS deste módulo:
// `DeathAnimalReportFormat = 'pdf' | 'excel'` (NUNCA reusar
// `stockAbcReportFormatOptions`/`StockAbcReportFormat` — domínios distintos).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { DeathAnimalReportFormat } from '@/@types/v2/DeathAnimalReport';

const labels = (languageGB: LanguageDate): Map<DeathAnimalReportFormat, string> => {
  const dictionary = languageGB.deathAnimalReport.report.formatOptions;
  return new Map([
    ['pdf', dictionary.pdf],
    ['excel', dictionary.excel],
  ]);
};

const getLabel = (value: DeathAnimalReportFormat, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: DeathAnimalReportFormat,
  languageGB: LanguageDate
): Option<DeathAnimalReportFormat> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<DeathAnimalReportFormat>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const deathAnimalReportFormatOptions = { getLabel, getOption, options };

// src/constants/relatorios/markings-farm-forecast-report/options/harvest-order-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `forecast` ("Colheita 1ª/2ª/3ª") do relatório
// "Previsão Fazenda/Receita" (F-281, execução 055, roteiro-front-F281-prev-
// fazenda-receita.md §5/§6-TASK-01, FID-G3F CL-016/RN-13) — mirror
// `report-format-options.ts`/`module-weighing-type-options.ts`
// (`(languageGB) => Map` + `getLabel`/`getOption`/`options`,
// get_pwa_constants_and_mappers_pattern §3.2). CORRIGE o legado, que exibia
// os 3 rótulos em espanhol independente do idioma ativo — aqui cada idioma
// (pt-BR/en/es) traduz corretamente via `languageGB`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { MarkingsFarmForecastReportHarvestOrder } from '@/@types/v2/MarkingsFarmForecastReport';

const labels = (languageGB: LanguageDate): Map<MarkingsFarmForecastReportHarvestOrder, string> => {
  const dictionary = languageGB.markingsFarmForecastReport.report.harvestOrderOptions;
  return new Map([
    [1, dictionary.first],
    [2, dictionary.second],
    [3, dictionary.third],
  ]);
};

const getLabel = (
  value: MarkingsFarmForecastReportHarvestOrder,
  languageGB: LanguageDate
): string => labels(languageGB).get(value)!;

const getOption = (
  value: MarkingsFarmForecastReportHarvestOrder,
  languageGB: LanguageDate
): Option<MarkingsFarmForecastReportHarvestOrder> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<MarkingsFarmForecastReportHarvestOrder>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const harvestOrderOptions = { getLabel, getOption, options };

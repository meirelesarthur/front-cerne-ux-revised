// src/constants/relatorios/agricultura/marking-forecast-harvest-area-report/options/
// marking-forecast-harvest-area-report-forecast-order-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo "Colheita" (`forecast`) do relatório "Previsão
// Colheita/Área" (F-282, esteira 059) — universo ESTÁTICO fechado {1,2,3,4}
// (mirror `MarkingForecastHarvestAreaReportRequest::rules()::forecast` →
// `in:1,2,3,4`, e `marking-forecast-area-report-harvest-order-options.ts` de
// F-280). Labels derivados de
// `languageGB.markingForecastHarvestAreaReport.report.forecastOrderLabel(order)`
// (Lei 10 — sem hardcode fora de `constants/languages/`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { MarkingForecastHarvestAreaReportOrder } from '@/@types/v2/Relatorios/Agricultura/markingForecastHarvestAreaReport';

const FORECAST_ORDERS: MarkingForecastHarvestAreaReportOrder[] = [1, 2, 3, 4];

const markingForecastHarvestAreaReportForecastOrderOptions = (languageGB: LanguageDate) => ({
  options: (): Option<MarkingForecastHarvestAreaReportOrder>[] =>
    FORECAST_ORDERS.map((order) => ({
      label: languageGB.markingForecastHarvestAreaReport.report.forecastOrderLabel(order),
      value: order,
    })),
});

export { markingForecastHarvestAreaReportForecastOrderOptions };

// src/constants/relatorios/agricultura/marking-forecast-area-report/options/
// marking-forecast-area-report-harvest-order-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo "Colheita" do relatório "Prev. Área/Receita"
// (F-280, TASK-MFA-FE-01, esteira 075) — universo ESTÁTICO fechado {1,2,3,4}
// (mirror `CL-17`, contrato de tela §2/§4). Labels derivados de
// `languageGB.markingForecastAreaReport.report.harvestOrderLabel(order)`
// (Lei 10 — sem hardcode fora de `constants/languages/`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const HARVEST_ORDERS = [1, 2, 3, 4] as const;

const markingForecastAreaReportHarvestOrderOptions = (languageGB: LanguageDate) => ({
  options: (): Option<number>[] =>
    HARVEST_ORDERS.map((order) => ({
      label: languageGB.markingForecastAreaReport.report.harvestOrderLabel(order),
      value: order,
    })),
});

export { markingForecastAreaReportHarvestOrderOptions };

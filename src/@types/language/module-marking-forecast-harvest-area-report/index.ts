// src/@types/language/module-marking-forecast-harvest-area-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Previsão Colheita/Área" (relatório de
// Agricultura — F-282, esteira 059), chave TOP-LEVEL, mirror
// `module-marking-forecast-area-report`/`module-markings-farm-forecast-report`
// — tela de filtro + 1 download (PDF), sem grid/prévia.
//
// 8 campos de filtro: Ciclo de Produção (JS-only), Área, Dt. Início, Dt. Fim,
// Cultivo/Variedade, Colheita (universo estático {1,2,3,4}), Semana Ano, Ano.
// Nenhum campo obrigatório (mirror RN-01 das telas-irmãs de relatório de
// markings — submit vazio gera PDF).
//
// PENDENTE DE REGISTRO (bloco de fiação, item 3 — NÃO feito por este
// escritor em modo WRITER-PARALELO): esta interface precisa ser somada à
// união `LanguageDate` em `src/@types/language/index.d.ts`
// (`markingForecastHarvestAreaReport: ModuleMarkingForecastHarvestAreaReport;`).
// -----------------------------------------------------------------------------

export interface ModuleMarkingForecastHarvestAreaReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      productionCycle: string;
      areas: string;
      startDate: string;
      endDate: string;
      cultivation: string;
      forecast: string;
      week: string;
      year: string;
    };
    productionCyclePlaceholder: string;
    areasPlaceholder: string;
    cultivationPlaceholder: string;
    forecastPlaceholder: string;
    /** `(order: number) => string` — rótulo do universo estático {1,2,3,4}
     *  do campo "Colheita" (mirror `markingForecastAreaReport.harvestOrderLabel`),
     *  sem hardcode fora de `constants/languages/`. */
    forecastOrderLabel: (order: number) => string;
    downloadPdfButton: string;
    downloadError: string;
    toasts: {
      success: string;
      genericError: string;
    };
    validation: {
      endDateAfterStartDate: string;
    };
  };
}

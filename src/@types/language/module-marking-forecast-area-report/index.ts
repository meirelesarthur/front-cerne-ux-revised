// src/@types/language/module-marking-forecast-area-report/index.ts
// Interface de tradução do módulo "Prev. Área/Receita" (relatório de
// Agricultura — F-280, 97-Esteiras/075, TASK-MFA-FE-01), chave TOP-LEVEL,
// mirror `stockMovementReport`/`costingAnimalReport` — tela de filtro + 1
// download (PDF), sem grid/prévia.
//
// 8 campos de filtro (contrato de tela §2): Ciclo de Produção (JS-only),
// Área, Dt. Início, Dt. Fim, Variedade, Colheita, Semana Ano, Ano. Nenhum
// campo obrigatório (mirror `CL-37`).

export interface ModuleMarkingForecastAreaReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      productionCycle: string;
      areas: string;
      startDate: string;
      endDate: string;
      variety: string;
      order: string;
      week: string;
      year: string;
    };
    productionCyclePlaceholder: string;
    areasPlaceholder: string;
    varietyPlaceholder: string;
    /** `(order: number) => string` — `"{n}º Colheita"` (mirror `CL-17`, sem hardcode fora daqui). */
    harvestOrderLabel: (order: number) => string;
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

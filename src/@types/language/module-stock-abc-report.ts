// src/@types/language/module-stock-abc-report.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Curva ABC/Estoque" (relatório — domínio
// Estoque, F-322, esteira 97-Esteiras/077). Módulo top-level próprio (mirror
// `module-stock-provider-lot-report`), tela de filtro + download binário,
// SEM grid/prévia.
//
// Diferente de `ModuleStockProviderLotReport`: aqui NÃO há campo de entidade
// de lookup (`provider`) — os 3 campos são `start_date`/`end_date`/`format`,
// ambas as datas OBRIGATÓRIAS (sem `*Placeholder` de lookup async).
// -----------------------------------------------------------------------------

export interface ModuleStockAbcReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      format: string;
    };
    formatOptions: {
      pdf: string;
      excel: string;
    };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      endDateBeforeStartDate: string;
    };
  };
}

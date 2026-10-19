// src/@types/language/module-animals-sale-report.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Vendas/Animais" (relatório — domínio
// Pecuária, F-227, esteira 97-Esteiras/077). Módulo top-level próprio (mirror
// `module-category-animal-report`), tela de filtro + download binário, SEM
// grid/prévia.
//
// 3 campos de lookup (`sale`/`batch`/`client`) TODOS OPCIONAIS e SEM cascata
// entre si — cada um com placeholder próprio, fiel ao legado (`cascatas:
// NAO_APLICAVEL`).
// -----------------------------------------------------------------------------

export interface ModuleAnimalsSaleReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      sale: string;
      batch: string;
      client: string;
      startDate: string;
      endDate: string;
      format: string;
    };
    salePlaceholder: string;
    batchPlaceholder: string;
    clientPlaceholder: string;
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

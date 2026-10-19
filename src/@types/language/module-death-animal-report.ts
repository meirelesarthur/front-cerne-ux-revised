// src/@types/language/module-death-animal-report.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Mortes" (relatório — domínio Pecuária,
// F-254, esteira 97-Esteiras/077). Módulo top-level próprio (mirror
// `module-stock-abc-report`), tela de filtro + download binário, SEM
// grid/prévia.
//
// Diferente de `ModuleMortesSisbov`/F-253 (irmão de domínio, SÓ PDF, ambas as
// datas opcionais): aqui há `formatOptions` (PDF/Excel) e ambas as datas são
// OBRIGATÓRIAS.
// -----------------------------------------------------------------------------

export interface ModuleDeathAnimalReport {
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

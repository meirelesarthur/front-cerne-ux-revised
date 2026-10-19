// src/@types/language/module-animals-report/index.ts
// Interface de tradução do módulo "Estoque/Rebanho" (relatório de Pecuária —
// F-228, execução 97-Esteiras/078, TASK-F228-F01), chave TOP-LEVEL, mirror
// `module-discards-report` — tela de filtro + 1 download (PDF-ONLY, sem
// Excel, FRONT-05), sem grid/prévia. `periodRequired`/`endDateAfterStartDate`
// cobrem `start_date`/`end_date` (ambas obrigatórias, fiéis ao legado).
//
// FIX GAP-16/item 8 (2026-09, decisão do dono — homologação): `speciesRequired`
// cobre `species`, também OBRIGATÓRIO (`min(1)`, fiel ao `required` do
// `Form::select('species')` legado).

export interface ModuleAnimalsReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      species: string;
    };
    speciesPlaceholder: string;
    downloadPdfButton: string;
    exportFileName: string;
    popupBlocked: string;
    toasts: {
      success: string;
      genericError: string;
    };
    validation: {
      periodRequired: string;
      endDateAfterStartDate: string;
      speciesRequired: string;
    };
  };
}

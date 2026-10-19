// src/@types/language/module-costing-batch-report/index.ts
// Interface de tradução do módulo "Custeio/Lote" (relatório de Pecuária —
// F-20c552f0, esteira 97-Esteiras/074, TASK-CL-FE-01). Módulo TOP-LEVEL
// próprio (mirror `module-food-beat-aggregate-report`/`module-receipts-
// report`), tela de filtro + download de PDF/Excel, SEM grid/prévia — mesma
// forma reduzida do `report` das módulos irmãos de Relatório.

export interface ModuleCostingBatchReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      batches: string;
      startDate: string;
      endDate: string;
    };
    batchesPlaceholder: string;
    periodRequiredHint: string;
    exportPdfButton: string;
    exportXlsxButton: string;
    successToast: string;
    downloadError: string;
    validation: {
      periodRequired: string;
    };
  };
}

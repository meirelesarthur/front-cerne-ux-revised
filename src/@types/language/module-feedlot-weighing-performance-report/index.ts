// src/@types/language/module-feedlot-weighing-performance-report/index.ts
// Interface de tradução do módulo "Desempenho Pesagem Confinamento"
// (relatório de Pecuária — F-263, lote 076,
// `FeedlotWeighingPerformanceReport-contrato-api.md`). Módulo TOP-LEVEL
// próprio, mirror `module-costing-batch-report` — download-only puro (SEM
// prévia/grid), 2 botões PDF/Excel, acrescido dos campos `corral`/`batch`
// (mirror `module-fiscal-difference-report.fields.costCenter`).

export interface ModuleFeedlotWeighingPerformanceReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      corral: string;
      batch: string;
      startDate: string;
      endDate: string;
    };
    corralPlaceholder: string;
    batchPlaceholder: string;
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

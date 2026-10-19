// src/@types/language/module-ans-report/index.ts
// Interface de tradução do módulo "ANS" (relatório de Suprimentos — F-229,
// lote 076, `F-229-ans-report-contrato-api.md`). Módulo top-level próprio,
// mirror `module-costing-animal-report` — download-only puro (SEM prévia,
// SEM grid), 2 botões PDF/Excel, MAS sem nenhum outro filtro além do par de
// datas obrigatório (mirror ainda mais enxuto que `module-costing-animal-
// report`, que tem o campo extra `animal`).

export interface ModuleAnsReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
    };
    exportPdfButton: string;
    exportXlsxButton: string;
    successToast: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}

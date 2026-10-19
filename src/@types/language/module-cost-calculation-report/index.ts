// src/@types/language/module-cost-calculation-report/index.ts
// Interface de tradução do módulo "Apuração de Custo" (relatório financeiro —
// F-245, esteira 97-Esteiras/073, TASK-245-FE-01 + homologação de 5 itens).
// Módulo top-level próprio (mirror `module-paid-interest-report` na forma
// original), AMPLIADO na homologação com a prévia em tabela renderizada na
// própria página + "Tipo de Relatório" (PDF/Excel) — mirror dos campos
// equivalentes de `module-income-statement-report` (`reportType`/
// `reportTypeOptions`/`filterButton`/`previewError`/`retryButton`/
// `emptyBeforeFilter`/`emptyReport`).
//
// `downloadPdfButton` → renomeado para `printButton` (correção #4,
// homologação): o botão deixou de ser PDF-only, agora roteia PDF/Excel
// conforme `report_type` (rótulo "Imprimir", mirror `downloadButton` de
// `module-income-statement-report`). Campo isolado deste módulo — não afeta
// `downloadPdfButton` de outros módulos (`Dre`/`JurosPagos`/etc., interfaces
// próprias e independentes).

export interface ModuleCostCalculationReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      farm: string;
      costCenters: string;
      accounts: string;
      orderBy: string;
      /** NOVO (homologação) — mirror `reportType` de `module-income-statement-report`. */
      reportType: string;
    };
    farmPlaceholder: string;
    costCentersPlaceholder: string;
    accountsPlaceholder: string;
    orderByOptions: {
      asc: string;
      desc: string;
    };
    /** NOVO (homologação) — 100% client-side, roteia PDF/Excel, nunca vai para a API. */
    reportTypeOptions: {
      pdf: string;
      excel: string;
    };
    periodRequiredHint: string;
    /** NOVO (homologação) — aciona `/preview` e renderiza a tabela na página. */
    filterButton: string;
    /** Renomeado de `downloadPdfButton` (homologação) — roteado por `reportType`. */
    printButton: string;
    downloadError: string;
    /** NOVO (homologação) — mirror `previewError` de `module-income-statement-report`. */
    previewError: string;
    retryButton: string;
    emptyBeforeFilter: string;
    emptyReport: string;
    validation: {
      periodRequired: string;
    };
  };
}

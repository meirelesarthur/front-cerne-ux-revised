// src/@types/language/module-savings-report/index.ts
// Interface de tradução do módulo "Savings" (relatório de Suprimentos —
// F-319, execução 97-Esteiras/013, TASK-013-F319-FE-01/02), chave TOP-LEVEL,
// mirror `module-stock-movement-report` — tela de filtro + 2 downloads
// (PDF inline/Excel) independentes, sem grid/prévia (DEC-FE-01 = sem
// prévia). `farmRequired` cobre o `CheckboxListField` de fazendas (array
// não-vazio obrigatório, mirror `warehouseRequired`).
//
// ⚠️ Divergência de convenção de path: a Tarefa (v4) lista o arquivo como
// `src/@types/language/module-savings-report.ts` (flat). O padrão REAL já em
// uso pelos módulos de relatório mais recentes (`module-stock-movement-report`,
// `module-cashflow-product-report`, `module-nfe-product-report`, etc.) é uma
// PASTA com `index.ts` — seguido aqui por fidelidade ao fork, anotado como
// divergência real ao handover.

export interface ModuleSavingsReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      farmUuid: string;
      startDate: string;
      endDate: string;
      status: string;
      /** "Comprador Responsável" — campo DECORATIVO (`DEC-FE-02`). */
      userId: string;
    };
    statusPlaceholder: string;
    userIdPlaceholder: string;
    selectAll: string;
    deselectAll: string;
    farmSearchPlaceholder: string;
    farmEmptyLabel: string;
    downloadPdfButton: string;
    downloadExcelButton: string;
    downloadError: string;
    popupBlocked: string;
    exportFileName: string;
    toasts: {
      success: string;
      genericError: string;
    };
    validation: {
      farmRequired: string;
      periodRequired: string;
      endDateAfterStartDate: string;
    };
  };
}

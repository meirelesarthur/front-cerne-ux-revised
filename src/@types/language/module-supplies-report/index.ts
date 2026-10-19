// src/@types/language/module-supplies-report/index.ts
// Interface de tradução do módulo "Suprimentos" (relatório de Suprimentos —
// F-325, execução CORE_WORKSPACE/97-Esteiras/015, Tarefa 52), chave
// TOP-LEVEL, mirror `module-savings-report` — tela de filtro (8 campos, TODOS
// opcionais) + 2 downloads (PDF inline/Excel) independentes, sem grid/prévia.

export interface ModuleSuppliesReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      farmUuid: string;
      userUuid: string;
      authorizerUuid: string;
      status: string;
      priority: string;
      number: string;
      startDate: string;
      endDate: string;
    };
    statusPlaceholder: string;
    priorityPlaceholder: string;
    downloadPdfButton: string;
    downloadExcelButton: string;
    downloadError: string;
    popupBlocked: string;
    toasts: {
      success: string;
      genericError: string;
    };
    validation: {
      endDateAfterStartDate: string;
    };
  };
}

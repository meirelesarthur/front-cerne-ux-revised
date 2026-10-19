// src/@types/language/module-birth-report/index.ts
// Interface de tradução do módulo "Nascimentos" GENÉRICO (relatório pecuário
// — F-236, esteira CORE_WORKSPACE/97-Esteiras/053, TASK-053-236-FE-01).
// Mirror ESTRUTURAL de `module-management-batch-report/index.ts` (mesma
// família de relatórios de Pecuária com `/options`). Distinto do irmão
// SISBOV (F-235): este módulo tem `format` (PDF+Excel) e `category` (não
// `batch`).

export interface ModuleBirthReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      category: string;
      format: string;
      startDate: string;
      endDate: string;
    };
    categoryPlaceholder: string;
    downloadButton: string;
    downloadError: string;
    downloadSuccess: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}

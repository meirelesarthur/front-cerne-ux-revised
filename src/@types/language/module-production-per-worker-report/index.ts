// src/@types/language/module-production-per-worker-report/index.ts
// Interface de tradução do módulo "Prod./Colaborador" (relatório agrícola —
// F-300, lote 079, F-300-plano-frontend.md TASK-300-FE-01). Mirror
// ESTRUTURAL de `module-production-costing-area-report/index.ts` (relatório
// PDF-only, sem grid/prévia), acrescido de `teams`/`employees` (2 selects
// que o F-298 não tem, sem cascata).

export interface ModuleProductionPerWorkerReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      teams: string;
      productionCycle: string;
      areas: string;
      startDate: string;
      endDate: string;
      employees: string;
    };
    teamsPlaceholder: string;
    productionCyclePlaceholder: string;
    areasPlaceholder: string;
    employeesPlaceholder: string;
    downloadPdfButton: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}

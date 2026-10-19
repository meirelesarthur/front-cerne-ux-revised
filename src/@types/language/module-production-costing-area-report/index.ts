// src/@types/language/module-production-costing-area-report/index.ts
// Interface de tradução do módulo "Produção/Custeio/Área" (relatório
// agrícola — F-298, esteira CORE_WORKSPACE/97-Esteiras/051, TASK-298-FE-01).
// Mirror ESTRUTURAL de `module-food-beat-aggregate-report/index.ts` (relatório
// PDF-only, sem grid/prévia) — CANÁRIO do padrão de tela de relatório em
// código para o fan-out (F-279/F-238/F-315/F-326).

export interface ModuleProductionCostingAreaReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      productionCycle: string;
      areas: string;
      startDate: string;
      endDate: string;
    };
    productionCyclePlaceholder: string;
    areasPlaceholder: string;
    downloadPdfButton: string;
    downloadError: string;
    periodRequiredHint: string;
    validation: {
      periodRequired: string;
    };
  };
}

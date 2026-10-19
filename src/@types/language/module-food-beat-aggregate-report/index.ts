// src/@types/language/module-food-beat-aggregate-report/index.ts
// Interface de tradução do módulo "Custo Produção Batida" (relatório
// agregado de Estoque — F-267, esteira 97-Esteiras/073, TASK-267-FE-01).
// Módulo top-level próprio (mirror `module-paid-interest-report`/
// `module-cost-calculation-report`), tela de filtro + download de PDF, SEM
// grid/prévia — mesma forma reduzida do `report` das módulos irmãos.

export interface ModuleFoodBeatAggregateReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      food: string;
    };
    foodPlaceholder: string;
    periodRequiredHint: string;
    downloadPdfButton: string;
    downloadError: string;
    validation: {
      periodRequired: string;
    };
  };
}

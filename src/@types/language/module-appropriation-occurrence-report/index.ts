// src/@types/language/module-appropriation-occurrence-report/index.ts
// Interface de tradução do módulo "Ocorrências Talhões" (relatório de
// Agricultura — F-232, Tarefa 50, esteira CORE_WORKSPACE/97-Esteiras/015).
// Mirror ESTRUTURAL de `module-accumulated-weighing-batch-report/index.ts`,
// reduzido a 4 campos (SEM `format`/`onlyActiveBatch` — nenhum equivalente
// nesta tela, risco 1/4 da Tarefa 50).

export interface ModuleAppropriationOccurrenceReport {
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
    submitButton: string;
    successToast: string;
    errorToast: string;
    validation: {
      periodRequired: string;
      periodOrder: string;
    };
  };
}

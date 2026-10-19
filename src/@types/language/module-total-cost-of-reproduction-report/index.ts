// src/@types/language/module-total-cost-of-reproduction-report/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Custo Total de Reprodução" (relatório —
// domínio Pecuária, F-328, esteira 97-Esteiras/008, TASK-FE-CTR-01). Módulo
// top-level próprio, mirror ESTRUTURAL do bloco `reproductiveHistoryReport`
// (`languageBreedingMating.ts:380-403`) — tela "gerar e sair" (PDF+Excel via
// campo `format` único, `reportFormatOptions` compartilhado), SEM
// grid/prévia, SEM cascata. Diferente do irmão `reproductiveHistoryReport`
// (`type: 0|1`, endpoint próprio), esta tela reusa o catálogo GLOBAL
// `ReportFormat`/`reportFormatOptions` — por isso NÃO tem `reportTypeOptions`
// próprio, mirror `nutritionConsumptionReport`/`format`.
// -----------------------------------------------------------------------------

export interface ModuleTotalCostOfReproductionReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    filters: {
      startDate: string;
      endDate: string;
    };
    fields: {
      reportType: string;
    };
    submitButton: string;
    successToast: string;
    errorToast: string;
    hint: {
      datesRequired: string;
    };
  };
}

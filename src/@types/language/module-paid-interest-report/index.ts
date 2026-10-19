// src/@types/language/module-paid-interest-report/index.ts
// Interface de tradução do módulo "Juros Pagos" (relatório financeiro — F-290,
// esteira 97-Esteiras/073, TASK-290-FE-01). Módulo top-level próprio (mirror
// `dre`/`module-dre`), tela de filtro + download de PDF, SEM grid/prévia —
// mesma forma reduzida do `report` de `module-dre`.

export interface ModulePaidInterestReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      providers: string;
      proprietary: string;
      startDate: string;
      endDate: string;
      farm: string;
    };
    providersPlaceholder: string;
    proprietaryPlaceholder: string;
    farmPlaceholder: string;
    periodRequiredHint: string;
    downloadPdfButton: string;
    downloadError: string;
    validation: {
      periodRequired: string;
    };
  };
}
